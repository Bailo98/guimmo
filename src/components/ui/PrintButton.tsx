"use client";
import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-1 hover:text-[#D4AF37] transition-colors print:hidden"
      aria-label="Imprimer"
    >
      <Printer className="w-3.5 h-3.5" /> Imprimer
    </button>
  );
}
