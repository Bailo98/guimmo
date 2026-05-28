"use client";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const SCREENS = [
  {
    icon: "🏠",
    title: "Trouve ton logement en Guinée",
    subtitle: "Simple. Rapide. Sans arnaque.",
  },
  {
    icon: "👆",
    title: "Swipe pour découvrir",
    subtitle: "Glisse à droite si tu aimes, à gauche pour passer",
    swipeAnimation: true,
  },
  {
    icon: "📞",
    title: "Contacte directement",
    subtitle: "WhatsApp, appel ou visite en 1 clic",
  },
];

export function Onboarding() {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [animDir, setAnimDir] = useState<"left" | "right">("left");
  const [transitioning, setTransitioning] = useState(false);
  const startXRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
    // Don't show if either key is set (old or new onboarding already seen)
    const alreadySeen =
      localStorage.getItem("logerbien_onboarded") ||
      localStorage.getItem("LogerBien-onboarded");
    if (!alreadySeen) setShow(true);
  }, []);

  function finish() {
    localStorage.setItem("logerbien_onboarded", "1");
    // Also set the old key so OnboardingModal doesn't re-appear if it's still in layout
    localStorage.setItem("LogerBien-onboarded", "1");
    setShow(false);
  }

  function goTo(next: number, dir: "left" | "right" = "left") {
    if (transitioning || next < 0 || next >= SCREENS.length) return;
    setAnimDir(dir);
    setTransitioning(true);
    setTimeout(() => {
      setStep(next);
      setTransitioning(false);
    }, 220);
  }

  function handleNext() {
    if (step < SCREENS.length - 1) goTo(step + 1, "left");
    else finish();
  }

  // Touch swipe
  function onTouchStart(e: React.TouchEvent) {
    startXRef.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (startXRef.current === null) return;
    const dx = e.changedTouches[0].clientX - startXRef.current;
    startXRef.current = null;
    if (Math.abs(dx) < 50) return;
    if (dx < 0 && step < SCREENS.length - 1) goTo(step + 1, "left");
    if (dx > 0 && step > 0) goTo(step - 1, "right");
  }

  if (!mounted || !show) return null;

  const screen = SCREENS[step];

  const modal = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "var(--bg-primary, #0A1216)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 32px",
        overflowX: "hidden",
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Skip */}
      <button
        onClick={finish}
        style={{
          position: "absolute",
          top: 24,
          right: 24,
          color: "rgba(255,255,255,0.40)",
          background: "none",
          border: "none",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          minHeight: "auto",
          letterSpacing: 0,
          textTransform: "none",
        }}
      >
        Passer
      </button>

      {/* Screen content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          maxWidth: 340,
          opacity: transitioning ? 0 : 1,
          transform: transitioning
            ? `translateX(${animDir === "left" ? "-40px" : "40px"})`
            : "translateX(0)",
          transition: "opacity 0.22s ease, transform 0.22s ease",
        }}
      >
        {/* Icon */}
        <div
          style={{
            fontSize: 80,
            lineHeight: 1,
            marginBottom: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "rgba(212,175,55,0.12)",
            border: "2px solid rgba(212,175,55,0.25)",
          }}
        >
          {screen.icon}
        </div>

        {/* Swipe hand animation on screen 2 */}
        {screen.swipeAnimation && (
          <div
            style={{
              position: "absolute",
              top: "calc(50% - 80px)",
              fontSize: 36,
              animation: "swipeHint 1.8s ease-in-out infinite",
            }}
          >
            👈
          </div>
        )}

        {/* Title */}
        <p
          style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            fontSize: 28,
            fontWeight: 700,
            color: "var(--bl-cream)",
            lineHeight: 1.25,
            marginBottom: 12,
          }}
        >
          {screen.title}
        </p>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 16,
            color: "rgba(255,255,255,0.60)",
            lineHeight: 1.6,
            fontWeight: 400,
          }}
        >
          {screen.subtitle}
        </p>
      </div>

      {/* Pagination dots */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 48,
          marginBottom: 24,
        }}
      >
        {SCREENS.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i, i > step ? "left" : "right")}
            style={{
              width: i === step ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: i === step ? "var(--accent-gold)" : "rgba(255,255,255,0.20)",
              border: "none",
              cursor: "pointer",
              transition: "width 0.25s ease, background 0.25s ease",
              padding: 0,
              minHeight: "auto",
            }}
            aria-label={`Écran ${i + 1}`}
          />
        ))}
      </div>

      {/* CTA Button */}
      <button
        onClick={handleNext}
        style={{
          background: "var(--accent-gold)",
          color: "#0B0F19",
          fontWeight: 700,
          fontSize: 16,
          padding: "14px 48px",
          borderRadius: 30,
          border: "none",
          cursor: "pointer",
          minWidth: 200,
          boxShadow: "0 4px 20px rgba(212,175,55,0.35)",
          letterSpacing: 0,
          textTransform: "none",
          minHeight: "auto",
        }}
      >
        {step < SCREENS.length - 1 ? "Suivant →" : "Commencer !"}
      </button>

      <style>{`
        @keyframes swipeHint {
          0%  { transform: translateX(40px); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100%{ transform: translateX(-40px); opacity: 0; }
        }
      `}</style>
    </div>
  );

  return createPortal(modal, document.body);
}
