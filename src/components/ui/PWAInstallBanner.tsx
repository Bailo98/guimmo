"use client";
import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";

const VISIT_KEY = "guimmo_visit_count";
const DISMISSED_KEY = "guimmo_pwa_dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallBanner() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;

    const count = parseInt(localStorage.getItem(VISIT_KEY) ?? "0", 10) + 1;
    localStorage.setItem(VISIT_KEY, String(count));

    if (count < 2) return;

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Also show the banner on 2nd+ visit even without the event (iOS Safari)
    if (count >= 2) setShow(true);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setShow(false);
  }

  async function install() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        localStorage.setItem(DISMISSED_KEY, "1");
      }
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl p-4 flex items-center gap-3 shadow-2xl"
      style={{
        background: "rgba(17,26,20,0.97)",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      {/* App icon */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
        style={{ background: "rgba(200,144,30,0.20)", border: "1px solid rgba(200,144,30,0.30)" }}
      >
        🏠
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm leading-tight">Installer GuImmo</p>
        <p className="text-white/50 text-xs mt-0.5">Accès rapide depuis votre écran d&apos;accueil</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={install}
          className="flex items-center gap-1.5 px-3 rounded-xl font-bold text-white text-sm"
          style={{ minHeight: 40, background: "#c8901e" }}
        >
          <Download className="w-3.5 h-3.5" />
          Installer
        </button>
        <button
          onClick={dismiss}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
