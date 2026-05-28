"use client";
import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Retour en haut"
      className={cn(
        "fixed z-[55] w-10 h-10 rounded-full bg-[#D4AF37] shadow-lg flex items-center justify-center transition-all duration-300",
        visible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
      )}
      style={{
        // Mobile : au-dessus du bouton 💰 (lui-même à +16px au-dessus de la pill nav)
        // 76px (nav) + 16px (gap nav→💰) + 52px (💰 height) + 12px (gap 💰→↑)
        bottom: "calc(76px + env(safe-area-inset-bottom, 0px) + 80px)",
        right: 16,
      }}
    >
      <ArrowUp className="w-5 h-5" color="#0A1216" />
    </button>
  );
}
