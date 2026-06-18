"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  const isPropertyDetail = /^\/annonces\/[^/]+$/.test(pathname ?? "");

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
        "fixed z-[55] h-16 w-16 rounded-full bg-[var(--accent-gold)] items-center justify-center transition-all duration-300 hover:-translate-y-1 active:scale-95",
        isPropertyDetail ? "hidden md:flex" : "flex",
        visible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-5 pointer-events-none"
      )}
      style={{
        // Mobile : au-dessus du bouton 💰 (lui-même à +16px au-dessus de la pill nav)
        // 76px (nav) + 16px (gap nav→💰) + 52px (💰 height) + 12px (gap 💰→↑)
        bottom: "calc(76px + env(safe-area-inset-bottom, 0px) + 80px)",
        right: 16,
        boxShadow: "0 18px 38px rgba(24,21,16,0.22), 0 8px 22px rgba(185,138,46,0.32)",
      }}
    >
      <ArrowUp className="w-7 h-7" color="var(--bg-primary)" strokeWidth={2.8} />
    </button>
  );
}
