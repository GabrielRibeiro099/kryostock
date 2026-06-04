package main

import (
    "context"
    "encoding/json"
    "errors"
    "fmt"
    "io"
    "log"
    "net"
    "net/http"
    "os"
    "os/exec"
    "path/filepath"
    "runtime"
    "strings"
    "sync/atomic"
    "time"
)

const appName = "KryoStock"

func main() {
    if err := run(); err != nil {
        showMessage("KryoStock", err.Error())
        os.Exit(1)
    }
}

func run() error {
    exePath, err := os.Executable()
    if err != nil {
        return fmt.Errorf("não foi possível localizar o executável: %w", err)
    }
    baseDir := filepath.Dir(exePath)
    if logFile, err := os.OpenFile(filepath.Join(baseDir, "KryoStock-launcher.log"), os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0644); err == nil {
        log.SetOutput(logFile)
        defer logFile.Close()
    }
    log.Printf("iniciando KryoStock launcher em %s", baseDir)

    distDir := filepath.Join(baseDir, "dist")
    if stat, err := os.Stat(distDir); err != nil || !stat.IsDir() {
        return errors.New("a pasta 'dist' precisa estar na mesma pasta do KryoStock.exe")
    }

    dataDir := filepath.Join(baseDir, "dados")
    if err := os.MkdirAll(dataDir, 0755); err != nil {
        return fmt.Errorf("não foi possível criar/acessar a pasta de dados: %w", err)
    }
    dataFile := filepath.Join(dataDir, "estoque_dados.json")

    var lastPingUnix atomic.Int64
    var receivedPing atomic.Bool
    lastPingUnix.Store(time.Now().Unix())

    mux := http.NewServeMux()
    mux.HandleFunc("/api/data", dataHandler(dataFile))
    mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json; charset=utf-8")
        _, _ = w.Write([]byte(`{"ok":true,"app":"KryoStock"}`))
    })
    mux.HandleFunc("/api/ping", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        if r.Method == http.MethodOptions {
            w.WriteHeader(http.StatusNoContent)
            return
        }
        if !receivedPing.Load() {
            log.Printf("primeiro heartbeat recebido")
        }
        receivedPing.Store(true)
        lastPingUnix.Store(time.Now().Unix())
        w.Header().Set("Content-Type", "application/json; charset=utf-8")
        _, _ = w.Write([]byte(`{"ok":true}`))
    })
    // Mantida apenas por compatibilidade com versões antigas. A versão atual usa heartbeat via /api/ping.
    mux.HandleFunc("/api/close", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json; charset=utf-8")
        _, _ = w.Write([]byte(`{"ok":true}`))
    })
    mux.HandleFunc("/", spaHandler(distDir))

    listener, err := net.Listen("tcp", "127.0.0.1:0")
    if err != nil {
        return fmt.Errorf("não foi possível iniciar o servidor local do KryoStock: %w", err)
    }

    server := &http.Server{Handler: mux}
    serverErr := make(chan error, 1)
    go func() {
        err := server.Serve(listener)
        if err != nil && !errors.Is(err, http.ErrServerClosed) {
            serverErr <- err
            return
        }
        serverErr <- nil
    }()

    url := "http://" + listener.Addr().String()
    log.Printf("servidor local iniciado em %s", url)
    if err := waitForHealth(url, 8*time.Second); err != nil {
        shutdown(server)
        return err
    }

    profileDir, err := os.MkdirTemp("", "kryostock-profile-*")
    if err != nil {
        shutdown(server)
        return fmt.Errorf("não foi possível criar perfil temporário do navegador: %w", err)
    }
    defer os.RemoveAll(profileDir)

    browser, args, err := browserCommand(url, profileDir)
    if err != nil {
        shutdown(server)
        return err
    }

    cmd := exec.Command(browser, args...)
    cmd.Stdout = nil
    cmd.Stderr = nil

    log.Printf("abrindo navegador: %s %s", browser, strings.Join(args, " "))
    if err := cmd.Start(); err != nil {
        shutdown(server)
        return fmt.Errorf("não foi possível abrir o KryoStock no navegador interno: %w", err)
    }

    done := make(chan error, 1)
    go func() { done <- cmd.Wait() }()

    heartbeatExpired := make(chan struct{}, 1)
    go func() {
        ticker := time.NewTicker(2 * time.Second)
        defer ticker.Stop()

        // Importante: em Windows, Edge/Chrome podem encerrar o processo iniciado pelo launcher
        // logo após repassar a URL para uma instância já existente do navegador. Se o launcher
        // encerrar o servidor nesse momento, o usuário vê ERR_CONNECTION_REFUSED.
        // Por isso, o ciclo de vida do servidor é controlado pelo heartbeat do React, não pelo
        // cmd.Wait() do navegador.
        startupDeadline := time.Now().Add(45 * time.Second)
        for range ticker.C {
            if !receivedPing.Load() {
                if time.Now().After(startupDeadline) {
                    log.Printf("heartbeat não foi recebido dentro do prazo inicial")
                    select { case heartbeatExpired <- struct{}{}: default: }
                    return
                }
                continue
            }

            last := time.Unix(lastPingUnix.Load(), 0)
            if time.Since(last) > 12*time.Second {
                log.Printf("heartbeat expirou; encerrando servidor")
                select { case heartbeatExpired <- struct{}{}: default: }
                return
            }
        }
    }()

    select {
    case <-heartbeatExpired:
        if cmd.Process != nil {
            _ = cmd.Process.Kill()
        }
        shutdown(server)
        return nil
    case err := <-serverErr:
        if cmd.Process != nil {
            _ = cmd.Process.Kill()
        }
        shutdown(server)
        if err != nil {
            return fmt.Errorf("erro no servidor local do KryoStock: %w", err)
        }
        return nil
    case err := <-done:
        // Não encerramos o servidor apenas porque o processo do navegador finalizou.
        // Em muitos ambientes o Edge/Chrome retorna imediatamente, mas a janela continua aberta.
        // Se o processo terminou antes de qualquer heartbeat, aguardamos o watchdog acima.
        // Se terminou depois do uso normal, o watchdog também encerrará o servidor ao parar o ping.
        if err != nil {
            log.Printf("processo do navegador finalizado: %v", err)
        } else {
            log.Printf("processo do navegador finalizado")
        }
        select {
        case <-heartbeatExpired:
            shutdown(server)
            return nil
        case err := <-serverErr:
            shutdown(server)
            if err != nil {
                return fmt.Errorf("erro no servidor local do KryoStock: %w", err)
            }
            return nil
        }
    }

}

func waitForHealth(baseURL string, timeout time.Duration) error {
    deadline := time.Now().Add(timeout)
    client := &http.Client{Timeout: 400 * time.Millisecond}
    healthURL := baseURL + "/api/health"
    for time.Now().Before(deadline) {
        response, err := client.Get(healthURL)
        if err == nil && response != nil {
            _, _ = io.Copy(io.Discard, response.Body)
            _ = response.Body.Close()
            if response.StatusCode >= 200 && response.StatusCode < 300 {
                return nil
            }
        }
        time.Sleep(150 * time.Millisecond)
    }
    return errors.New("o servidor local do KryoStock não ficou pronto a tempo. Tente abrir o aplicativo novamente")
}

func dataHandler(dataFile string) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Accept")
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        if r.Method == http.MethodOptions {
            w.WriteHeader(http.StatusNoContent)
            return
        }

        switch r.Method {
        case http.MethodGet:
            w.Header().Set("Content-Type", "application/json; charset=utf-8")
            if _, err := os.Stat(dataFile); errors.Is(err, os.ErrNotExist) {
                _, _ = w.Write([]byte(`{}`))
                return
            }
            http.ServeFile(w, r, dataFile)
        case http.MethodPost:
            body, err := io.ReadAll(io.LimitReader(r.Body, 25*1024*1024))
            if err != nil {
                http.Error(w, "erro ao ler dados", http.StatusBadRequest)
                return
            }
            if !json.Valid(body) {
                http.Error(w, "json inválido", http.StatusBadRequest)
                return
            }
            tmp := dataFile + ".tmp"
            if err := os.WriteFile(tmp, body, 0644); err != nil {
                http.Error(w, "erro ao salvar dados", http.StatusInternalServerError)
                return
            }
            if err := os.Rename(tmp, dataFile); err != nil {
                _ = os.Remove(tmp)
                http.Error(w, "erro ao finalizar gravação", http.StatusInternalServerError)
                return
            }
            w.Header().Set("Content-Type", "application/json; charset=utf-8")
            _, _ = w.Write([]byte(`{"ok":true}`))
        default:
            http.Error(w, "método não permitido", http.StatusMethodNotAllowed)
        }
    }
}

func spaHandler(distDir string) http.HandlerFunc {
    fileServer := http.FileServer(http.Dir(distDir))
    return func(w http.ResponseWriter, r *http.Request) {
        if r.URL.Path == "/" || r.URL.Path == "" {
            http.ServeFile(w, r, filepath.Join(distDir, "index.html"))
            return
        }
        cleanPath := filepath.Clean(strings.TrimPrefix(r.URL.Path, "/"))
        fullPath := filepath.Join(distDir, cleanPath)
        if stat, err := os.Stat(fullPath); err == nil && !stat.IsDir() {
            fileServer.ServeHTTP(w, r)
            return
        }
        http.ServeFile(w, r, filepath.Join(distDir, "index.html"))
    }
}

func browserCommand(url string, profileDir string) (string, []string, error) {
    browser, err := findBrowser()
    if err != nil {
        return "", nil, err
    }

    args := []string{
        "--app=" + url,
        "--user-data-dir=" + profileDir,
        "--no-first-run",
        "--disable-sync",
        "--disable-background-mode",
        "--disable-extensions",
        "--no-default-browser-check",
        "--disable-session-crashed-bubble",
        "--disable-translate",
        "--lang=pt-BR",
        "--accept-lang=pt-BR",
        "--disable-features=Translate,TranslateUI,EdgeTranslate,OptimizationHints,RendererCodeIntegrity",
        "--new-window",
    }
    return browser, args, nil
}

func findBrowser() (string, error) {
    candidates := []string{}
    if runtime.GOOS == "windows" {
        envs := []string{"ProgramFiles", "ProgramFiles(x86)", "LOCALAPPDATA"}
        for _, env := range envs {
            root := os.Getenv(env)
            if root == "" { continue }
            candidates = append(candidates,
                filepath.Join(root, "Microsoft", "Edge", "Application", "msedge.exe"),
                filepath.Join(root, "Google", "Chrome", "Application", "chrome.exe"),
            )
        }
    }
    candidates = append(candidates, "msedge", "msedge.exe", "chrome", "chrome.exe", "google-chrome", "chromium", "chromium-browser")

    for _, candidate := range candidates {
        if strings.Contains(candidate, string(os.PathSeparator)) {
            if stat, err := os.Stat(candidate); err == nil && !stat.IsDir() {
                return candidate, nil
            }
            continue
        }
        if path, err := exec.LookPath(candidate); err == nil {
            return path, nil
        }
    }
    return "", errors.New("não encontrei Microsoft Edge ou Google Chrome para abrir o aplicativo. No Windows 10/11, normalmente o Microsoft Edge já vem instalado")
}

func shutdown(server *http.Server) {
    ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
    defer cancel()
    _ = server.Shutdown(ctx)
}

func showMessage(title, text string) {
    if runtime.GOOS != "windows" {
        log.Printf("%s: %s", title, text)
        return
    }
    log.Printf("%s: %s", title, text)
}
