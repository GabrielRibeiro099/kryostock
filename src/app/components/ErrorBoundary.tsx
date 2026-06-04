import React from "react";
import { Button } from "./ui/button";

function isBrowserDomMutationError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("insertbefore") ||
    normalized.includes("removechild") ||
    normalized.includes("not a child") ||
    normalized.includes("não é filho") ||
    normalized.includes("nao é filho")
  );
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; message: string; autoRecovering: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "", autoRecovering: false };
  }

  static getDerivedStateFromError(error: unknown) {
    const message = error instanceof Error ? error.message : "Erro inesperado";
    const shouldAutoRecover = isBrowserDomMutationError(message) && sessionStorage.getItem("kryostock_dom_recovery_done") !== "1";
    return { hasError: true, message, autoRecovering: shouldAutoRecover };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error("Erro inesperado no KryoStock:", error, info);
    const message = error instanceof Error ? error.message : String(error ?? "");

    // Edge/Chrome Translate e alguns recursos de tradução podem alterar nós de texto do React.
    // Quando isso acontece, o React lança DOMException como insertBefore/removeChild.
    // O app já bloqueia tradução por meta/atributos/flags do launcher; este fallback evita
    // que o usuário final veja a tela de erro caso o navegador ainda interfira uma vez.
    if (isBrowserDomMutationError(message) && sessionStorage.getItem("kryostock_dom_recovery_done") !== "1") {
      sessionStorage.setItem("kryostock_dom_recovery_done", "1");
      window.setTimeout(() => window.location.reload(), 50);
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.state.autoRecovering) {
      return (
        <div className="min-h-screen bg-[#061a35] text-white flex items-center justify-center p-6 notranslate" translate="no">
          <div className="max-w-lg rounded-2xl bg-white/10 border border-white/10 p-6 text-center space-y-4">
            <img src="/kryostock-icon.png" alt="Logo KryoStock" className="w-14 h-14 mx-auto rounded-xl object-contain" />
            <div>
              <h1 className="text-2xl font-semibold">Carregando KryoStock</h1>
              <p className="text-blue-100 mt-2">Preparando a interface do aplicativo...</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#061a35] text-white flex items-center justify-center p-6 notranslate" translate="no">
        <div className="max-w-lg rounded-2xl bg-white/10 border border-white/10 p-6 text-center space-y-4">
          <img src="/kryostock-icon.png" alt="Logo KryoStock" className="w-14 h-14 mx-auto rounded-xl object-contain" />
          <div>
            <h1 className="text-2xl font-semibold">O KryoStock encontrou um erro</h1>
            <p className="text-blue-100 mt-2">A interface foi protegida para evitar tela branca. Recarregue o aplicativo e tente novamente.</p>
          </div>
          <p className="text-xs text-blue-100/70 break-words">{this.state.message}</p>
          <Button type="button" onClick={() => window.location.reload()} className="w-full">Recarregar KryoStock</Button>
        </div>
      </div>
    );
  }
}
