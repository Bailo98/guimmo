"use client";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Flag, X, Send } from "lucide-react";
import { toast } from "@/lib/toast";

const REASONS = [
  "Annonce frauduleuse",
  "Photos trompeuses",
  "Prix incorrect",
  "Logement inexistant",
  "Propriétaire non joignable",
  "Autre",
];

interface Props {
  propertyId: string;
}

export function ReportButton({ propertyId }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [sent, setSent] = useState(false);
  const portalRef = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    portalRef.current = document.body;
    setMounted(true);
  }, []);

  function handleSubmit() {
    if (!reason) return;
    setSent(true);
    toast("Signalement envoyé. Merci !", "success");
    setTimeout(() => { setOpen(false); setSent(false); setReason(""); }, 1500);
    void propertyId;
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 hover:text-red-500 transition-colors"
      >
        <Flag className="w-3.5 h-3.5" /> Signaler
      </button>

      {open && mounted && portalRef.current && createPortal(
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          style={{ backdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-sm bg-[var(--bg-card-light)] rounded-2xl p-6 border border-[var(--color-border)] shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Flag className="w-4 h-4 text-red-500" /> Signaler cette annonce
              </h3>
              <button onClick={() => setOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-[#151922]">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Quel est le problème avec cette annonce ?</p>
            <div className="space-y-2 mb-5">
              {REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                    reason === r
                      ? "border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                      : "border-slate-200 dark:border-[var(--color-border)] text-slate-600 dark:text-slate-300 hover:border-slate-300"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <button
              onClick={handleSubmit}
              disabled={!reason || sent}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                reason && !sent
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-slate-100 dark:bg-[#151922] text-slate-400 cursor-not-allowed"
              }`}
            >
              <Send className="w-4 h-4" />
              {sent ? "Envoyé !" : "Envoyer le signalement"}
            </button>
          </div>
        </div>,
        portalRef.current
      )}
    </>
  );
}
