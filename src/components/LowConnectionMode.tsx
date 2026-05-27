"use client";
import { useEffect, useState } from "react";

export function LowConnectionMode() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") return;

    // Network Information API (Chrome / Android)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conn = (navigator as any).connection
      ?? (navigator as any).mozConnection
      ?? (navigator as any).webkitConnection;

    const isSlow =
      conn?.effectiveType === "2g" ||
      conn?.effectiveType === "slow-2g" ||
      (typeof conn?.downlink === "number" && conn.downlink < 1);

    if (isSlow) {
      // Add reduce-motion class so CSS disables all animations
      document.body.classList.add("reduce-motion");
      // Store flag for other components to read
      localStorage.setItem("logerbien_low_bandwidth", "1");
      setShowBanner(true);
      // Auto-hide banner after 5 s
      const t = setTimeout(() => setShowBanner(false), 5000);
      return () => clearTimeout(t);
    }
  }, []);

  if (!showBanner) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 76,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        background: "rgba(26,37,43,0.97)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 30,
        padding: "10px 20px",
        fontSize: 13,
        fontWeight: 600,
        color: "rgba(255,255,255,0.85)",
        whiteSpace: "nowrap",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      📶 Connexion lente — mode économique activé
    </div>
  );
}
