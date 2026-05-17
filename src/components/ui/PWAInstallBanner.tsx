"use client";
import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";

const VISIT_KEY = "BienLoger_visit_count";
const DISMISSED_KEY = "BienLoger_pwa_dismissed";

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
      className="md:hidden fixed top-0 left-0 right-0 z-[60] flex items-center gap-3 px-4 shadow-2xl"
      style={{
        height: 60,
        background: "#111a1f",
        borderBottom: "1px solid rgba(255,255,255,0.10)",
      }}
    >
      {/* App icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
        style={{ background: "rgba(200,144,30,0.20)", border: "1px solid rgba(200,144,30,0.30)" }}
      >
        🏠
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-xs leading-tight">📱 Installer BienLoger sur votre téléphone</p>
        <p className="text-white/50 text-[10px] mt-0.5">Accès rapide depuis l&apos;écran d&apos;accueil</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={install}
          className="flex items-center gap-1 px-3 rounded-lg font-bold text-white text-xs"
          style={{ height: 32, background: "#E9E900" }}
        >
          <Download className="w-3 h-3" />
          Installer
        </button>
        <button
          onClick={dismiss}
          className="text-white/40 hover:text-white/70 transition-colors text-xs font-medium px-2"
          style={{ height: 32 }}
        >
          Plus tard
        </button>
      </div>
    </div>
  );
}
