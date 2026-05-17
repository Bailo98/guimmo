"use client";
import { useState } from "react";
import { Flag, X, Loader2, CheckCircle2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const REASONS = [
  { id: "fraud",        label: "Annonce frauduleuse / arnaque" },
  { id: "already_taken",label: "Logement déjà loué / vendu" },
  { id: "fake_photos",  label: "Photos fausses ou volées" },
  { id: "wrong_price",  label: "Prix incorrect" },
  { id: "other",        label: "Autre" },
];

interface Props {
  propertyId: string;
}

export function ReportButton({ propertyId }: Props) {
  const [open, setOpen]             = useState(false);
  const [reason, setReason]         = useState("");
  const [details, setDetails]       = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [loading, setLoading]       = useState(false);
  const [done, setDone]             = useState(false);

  async function submit() {
    if (!reason) return;
    setLoading(true);

    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.from("reports").insert({
          property_id:   propertyId,
          reason,
          details:       details.trim() || null,
          reporter_phone: reporterPhone.trim() || null,
        });
      }
      setDone(true);
    } catch {
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-white/30 hover:text-red-400 transition-colors text-xs"
      >
        <Flag className="w-3.5 h-3.5" />
        Signaler cette annonce
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <div
        className="w-full max-w-md rounded-3xl p-6 space-y-5"
        style={{ background: "#0A1216", border: "1px solid rgba(255,255,255,0.10)" }}
      >
        {done ? (
          <div className="text-center py-4 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-yellow-400 mx-auto" />
            <p className="text-white font-bold text-lg">Merci pour votre signalement</p>
            <p className="text-white/50 text-sm">Notre équipe va examiner cette annonce.</p>
            <button
              onClick={() => { setOpen(false); setDone(false); setReason(""); setDetails(""); setReporterPhone(""); }}
              className="mt-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm"
              style={{ background: "rgba(255,255,255,0.10)" }}
            >
              Fermer
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-red-400" />
                <h2 className="text-white font-black text-base">Pourquoi signalez-vous cette annonce ?</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Reasons */}
            <div className="space-y-2">
              <p className="text-white/60 text-xs font-bold uppercase tracking-wide">Raison</p>
              {REASONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setReason(r.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                  style={{
                    background: reason === r.id ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.04)",
                    border: reason === r.id ? "1px solid rgba(239,68,68,0.40)" : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: reason === r.id ? "#ef4444" : "rgba(255,255,255,0.25)" }}>
                    {reason === r.id && <div className="w-2 h-2 rounded-full bg-red-500" />}
                  </div>
                  <span className="text-white/80 text-sm">{r.label}</span>
                </button>
              ))}
            </div>

            {/* Optional details */}
            <textarea
              placeholder="Précisez (optionnel)…"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={2}
              className="w-full rounded-xl px-4 py-3 text-white text-sm resize-none focus:outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", minHeight: 64 }}
            />

            {/* Reporter phone */}
            <input
              type="tel"
              placeholder="Votre numéro (optionnel — pour vous recontacter)"
              value={reporterPhone}
              onChange={(e) => setReporterPhone(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", minHeight: 52 }}
            />

            {/* Submit */}
            <button
              onClick={submit}
              disabled={!reason || loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl font-bold text-white text-sm"
              style={{
                minHeight: 52,
                background: reason && !loading ? "#dc2626" : "rgba(255,255,255,0.08)",
                color: reason && !loading ? "#fff" : "rgba(255,255,255,0.30)",
              }}
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Envoi…</> : "🚩 Envoyer le signalement"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
