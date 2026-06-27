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
        "fixed z-[45] h-10 w-10 rounded-full bg-[var(--accent-gold)] items-center justify-center transition-all duration-300 hover:-translate-y-0.5 active:scale-95",
        isPropertyDetail ? "hidden md:flex" : "flex",
        visible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-5 pointer-events-none"
      )}
      style={{
        bottom: "calc(64px + env(safe-area-inset-bottom, 0px) + 72px)",
        right: 16,
        boxShadow: "0 10px 24px rgba(24,21,16,0.16), 0 4px 14px rgba(185,138,46,0.24)",
      }}
    >
      <ArrowUp className="h-4 w-4" color="var(--bg-primary)" strokeWidth={2.8} />
    </button>
  );
}
