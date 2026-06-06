"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { CheckCircle, Smartphone } from "lucide-react";

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
        <span className="inline-flex items-center gap-1.5">
          <CheckCircle className="h-4 w-4" />
          LogerBien est installé sur votre écran d&apos;accueil
        </span>
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
      style={{ background: "var(--accent-gold)", color: "var(--bg-primary)" }}
    >
      {installing ? (
        "Installation en cours…"
      ) : (
        <>
          <Smartphone className="h-4 w-4" />
          Ajouter à l&apos;écran d&apos;accueil
        </>
      )}
    </button>
  );
}
