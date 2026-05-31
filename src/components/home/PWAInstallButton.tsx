"use client";
import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallButton() {
  const [mounted, setMounted]               = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled]           = useState(false);
  const [installing, setInstalling]         = useState(false);

  useEffect(() => {
    setMounted(true);
    function handlePrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    function handleInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }
    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (!mounted) return null;

  if (installed) {
    return (
      <p className="text-sm font-semibold" style={{ color: "#22c55e" }}>
        ✅ LogerBien est installé sur votre écran d&apos;accueil
      </p>
    );
  }

  if (!deferredPrompt) {
    return (
      <p className="text-xs" style={{ color: "#666" }}>
        Ajoutez LogerBien à votre écran d&apos;accueil via le menu de votre navigateur
        &nbsp;(⋮ ou <span style={{ fontFamily: "monospace" }}>Partager → Ajouter</span>).
      </p>
    );
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    setInstalling(true);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
    setInstalling(false);
  }

  return (
    <button
      onClick={handleInstall}
      disabled={installing}
      className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-xl transition-opacity hover:opacity-90 disabled:opacity-60 text-sm"
      style={{ background: "#D4AF37", color: "#0A1216" }}
    >
      {installing ? "Installation en cours…" : "📱 Ajouter à l'écran d'accueil"}
    </button>
  );
}
