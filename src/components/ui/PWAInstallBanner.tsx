"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Download, X } from "lucide-react";

const VISIT_KEY     = "LogerBien_visit_count";
const DISMISSED_KEY = "LogerBien_pwa_dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
}

export function PWAInstallBanner() {
  const pathname = usePathname();
  const [show,              setShow]              = useState(false);
  const [deferredPrompt,    setDeferredPrompt]    = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosModal,      setShowIosModal]      = useState(false);
  const [isIos,             setIsIos]             = useState(false);

  useEffect(() => {
    const ios = isIosDevice();
    setIsIos(ios);

    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;

    const count = parseInt(localStorage.getItem(VISIT_KEY) ?? "0", 10) + 1;
    localStorage.setItem(VISIT_KEY, String(count));

    if (count < 2) return;

    // Already running as installed PWA — don't show
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    if (ios) {
      // iOS Safari: no install event, show banner immediately
      setShow(true);
    } else {
      // Android / Chrome: wait for the native install prompt
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setShow(true);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setShow(false);
    setShowIosModal(false);
  }

  async function install() {
    if (deferredPrompt) {
      // Android / Chrome — trigger native install dialog
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        localStorage.setItem(DISMISSED_KEY, "1");
        setShow(false);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      // iOS Safari — show step-by-step instructions
      setShowIosModal(true);
    }
  }

  // All hooks above — conditional return allowed from here
  if (!show || pathname === "/decouvrir") return null;

  return (
    <>
      {/* ── Banner strip ───────────────────────────────────────────── */}
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
          <p className="text-white font-bold text-xs leading-tight">
            📱 Installer LogerBien sur votre téléphone
          </p>
          <p className="text-white/50 text-[10px] mt-0.5">
            {isIos ? "Ajouter à l'écran d'accueil depuis Safari" : "Accès rapide depuis l'écran d'accueil"}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={install}
            className="flex items-center gap-1 px-3 rounded-lg font-bold text-[#0A1216] text-xs"
            style={{ height: 32, background: "#E9E900", minHeight: "auto" }}
          >
            <Download className="w-3 h-3" />
            Installer
          </button>
          <button
            onClick={dismiss}
            className="text-white/40 hover:text-white/70 transition-colors text-xs font-medium px-2"
            style={{ height: 32, minHeight: "auto" }}
          >
            Plus tard
          </button>
        </div>
      </div>

      {/* ── iOS instruction modal (bottom sheet) ───────────────────── */}
      {showIosModal && (
        <div
          className="fixed inset-0 z-[70] flex items-end"
          style={{ background: "rgba(0,0,0,0.65)" }}
          onClick={() => setShowIosModal(false)}
        >
          <div
            className="w-full"
            style={{
              background: "#1a252b",
              borderRadius: "20px 20px 0 0",
              padding: "24px 20px 32px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div style={{
              width: 40, height: 4, borderRadius: 2,
              background: "rgba(255,255,255,0.15)",
              margin: "0 auto 20px",
            }} />

            {/* Title */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-lg">Installer LogerBien</h3>
              <button
                onClick={() => setShowIosModal(false)}
                style={{
                  background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%",
                  width: 32, height: 32, cursor: "pointer", color: "rgba(255,255,255,0.6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  minHeight: "auto",
                }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <p className="text-white/60 text-sm mb-5">
              Sur iPhone et iPad, ajoutez l&apos;app à l&apos;écran d&apos;accueil depuis Safari :
            </p>

            {/* Steps */}
            <div className="space-y-4">
              {[
                {
                  icon: "□↑",
                  text: <>Appuyez sur le bouton <strong className="text-white">Partager</strong> (□↑) en bas de Safari</>,
                },
                {
                  icon: "+□",
                  text: <>Faites défiler et appuyez sur <strong className="text-white">« Sur l&apos;écran d&apos;accueil »</strong></>,
                },
                {
                  icon: "✓",
                  text: <>Appuyez sur <strong className="text-white">« Ajouter »</strong> en haut à droite</>,
                },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span
                    className="flex-shrink-0 flex items-center justify-center font-bold text-xs"
                    style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: "#E9E900", color: "#0A1216",
                      marginTop: 1,
                    }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-white/70 text-sm leading-relaxed">{step.text}</p>
                </div>
              ))}
            </div>

            {/* Confirm */}
            <button
              onClick={dismiss}
              style={{
                marginTop: 24,
                width: "100%",
                background: "#E9E900",
                color: "#0A1216",
                border: "none",
                borderRadius: 14,
                padding: "14px 0",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Compris !
            </button>
          </div>
        </div>
      )}
    </>
  );
}
