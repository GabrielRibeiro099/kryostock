import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { ErrorBoundary } from "./app/components/ErrorBoundary.tsx";
import "./styles/index.css";

function disableBrowserTranslation() {
  document.documentElement.lang = "pt-BR";
  document.documentElement.setAttribute("translate", "no");
  document.documentElement.classList.add("notranslate");
  document.body?.setAttribute("translate", "no");
  document.body?.classList.add("notranslate");

  let meta = document.querySelector('meta[name="google"]') as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "google";
    document.head.appendChild(meta);
  }
  meta.content = "notranslate";
}

disableBrowserTranslation();

function LauncherHeartbeat() {
  useEffect(() => {
    let stopped = false;

    const ping = async () => {
      try {
        await fetch("/api/ping", { method: "POST", cache: "no-store" });
      } catch {
        // Em modo desenvolvimento/navegador comum a API local pode não existir.
      }
    };

    void ping();
    const interval = window.setInterval(() => {
      if (!stopped) void ping();
    }, 2000);

    return () => {
      stopped = true;
      window.clearInterval(interval);
    };
  }, []);

  return null;
}

createRoot(document.getElementById("root")!).render(
  <>
    <LauncherHeartbeat />
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </>
);
