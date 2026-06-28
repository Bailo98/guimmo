"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Flag, X, Loader2, CheckCircle2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const REASONS = [
  { id: "fraud",         label: "Annonce frauduleuse / arnaque" },
  { id: "already_taken", label: "Logement déjà loué / vendu" },
  { id: "fake_photos",   label: "Photos fausses ou volées" },
  { id: "wrong_price",   label: "Prix incorrect" },
  { id: "other",         label: "Autre" },
];

const OWNER_REASONS = [
  { id: "owner_fraud", label: "Compte suspect / arnaque" },
  { id: "owner_phone", label: "Téléphone ou contact incorrect" },
  { id: "owner_behavior", label: "Mauvais comportement" },
  { id: "owner_payment", label: "Demande de paiement suspecte" },
  { id: "owner_other", label: "Autre" },
];

interface Props {
  propertyId: string;
  propertyTitle?: string;
  ownerId?: string | null;
  ownerName?: string | null;
  target?: "property" | "owner";
  /** When false, clicking redirects to /connexion instead of opening the modal */
  isLoggedIn?: boolean;
}

export function ReportButton({
  propertyId,
  propertyTitle = "",
  ownerId = null,
  ownerName = null,
  target = "property",
  isLoggedIn = false,
}: Props) {
  const router = useRouter();
  const [open, setOpen]                   = useState(false);
  const [reason, setReason]               = useState("");
  const [details, setDetails]             = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [loading, setLoading]             = useState(false);
  const [done, setDone]                   = useState(false);
  const [errorMsg, setErrorMsg]           = useState("");
  const [hovered, setHovered]             = useState(false);
  const reasons = target === "owner" ? OWNER_REASONS : REASONS;
  const title = target === "owner" ? "Pourquoi signalez-vous ce compte ?" : "Pourquoi signalez-vous cette annonce ?";

  function openModal() {
    if (!isLoggedIn) {
      router.push(`/connexion?redirect=/annonces/${propertyId}`);
      return;
    }
    setOpen(true);
    document.body.style.overflow = "hidden";
  }

  function close() {
    setOpen(false);
    document.body.style.overflow = "";
    setTimeout(() => { setDone(false); setReason(""); setDetails(""); setReporterPhone(""); setErrorMsg(""); }, 300);
  }

  async function submit() {
    if (!reason) return;
    setLoading(true);
    setErrorMsg("");
    try {
      if (isSupabaseConfigured && supabase) {
        const detailParts = [
          target === "owner" ? "Signalement de compte/propriétaire" : null,
          ownerId ? `owner_id: ${ownerId}` : null,
          ownerName ? `propriétaire: ${ownerName}` : null,
          propertyTitle ? `annonce: ${propertyTitle}` : null,
          details.trim() ? `message: ${details.trim()}` : null,
        ].filter(Boolean);
        const { error } = await supabase.from("reports").insert({
          property_id:    propertyId,
          reason,
          details:        detailParts.join("\n") || null,
          reporter_phone: reporterPhone.trim() || null,
        });
        if (error) throw error;
        // Notify admin by email — fire and forget
        fetch("/api/notify-admin-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            propertyTitle,
            reason,
            details: detailParts.join("\n") || null,
            reporterPhone: reporterPhone.trim() || null,
          }),
        }).catch(() => {});
      }
      setDone(true);
    } catch (error) {
      console.error("[ReportButton] submit error:", error);
      setErrorMsg("Impossible d'envoyer le signalement. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  const modal = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: "max(16px, env(safe-area-inset-top, 0px))",
        paddingRight: 16,
        paddingBottom: "max(16px, env(safe-area-inset-bottom, 0px))",
        paddingLeft: 16,
        overflowY: "auto",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div
        className="space-y-5"
        style={{
          position: "relative",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: 24,
          width: "100%",
          maxWidth: 460,
          maxHeight: "calc(100dvh - 32px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))",
          overflowY: "auto",
        }}
      >
        {done ? (
          <div className="text-center py-4 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-[var(--accent-gold)] mx-auto" />
            <p className="font-bold text-lg text-[var(--text-primary)]">Merci pour votre signalement</p>
            <p className="text-sm text-[var(--text-secondary)]">Notre équipe va examiner ce signalement.</p>
            <button
              onClick={close}
              className="mt-2 px-5 py-2.5 rounded-xl font-bold text-sm"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
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
                <h2 className="font-black text-base text-[var(--text-primary)]">{title}</h2>
              </div>
              <button
                onClick={close}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Reasons */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">Raison</p>
              {reasons.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setReason(r.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                  style={{
                    background: reason === r.id ? "rgba(239,68,68,0.12)" : "var(--bg-card)",
                    border:     reason === r.id ? "1px solid rgba(239,68,68,0.46)" : "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: reason === r.id ? "#ef4444" : "var(--border)" }}
                  >
                    {reason === r.id && <div className="w-2 h-2 rounded-full bg-red-500" />}
                  </div>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{r.label}</span>
                </button>
              ))}
            </div>

            {/* Optional details */}
            <textarea
              placeholder="Précisez (optionnel)…"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={2}
              className="w-full rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500/30 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", minHeight: 64 }}
            />

            {/* Reporter phone */}
            <input
              type="tel"
              placeholder="Votre numéro (optionnel — pour vous recontacter)"
              value={reporterPhone}
              onChange={(e) => setReporterPhone(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", minHeight: 52 }}
            />

            {errorMsg && (
              <p className="rounded-xl px-3 py-2 text-sm font-bold text-red-600" style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.22)" }}>
                {errorMsg}
              </p>
            )}

            {/* Submit */}
            <button
              onClick={submit}
              disabled={!reason || loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl font-bold text-white text-sm"
              style={{
                minHeight: 52,
                background: reason && !loading ? "#dc2626" : "rgba(255,255,255,0.08)",
                color:      reason && !loading ? "#fff"    : "var(--text-muted)",
                border: reason && !loading ? "1px solid #dc2626" : "1px solid var(--border)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Envoi…
                </>
              ) : (
                <>
                  <Flag className="w-4 h-4" />
                  Envoyer le signalement
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={openModal}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-black transition-all"
        style={{
          border: hovered ? "1px solid rgba(220,38,38,0.40)" : "1px solid rgba(220,38,38,0.22)",
          background: hovered ? "rgba(220,38,38,0.14)" : "rgba(220,38,38,0.08)",
          color: "#dc2626",
        }}
      >
        <Flag className="w-4 h-4" strokeWidth={2.5} />
        {target === "owner" ? "Signaler le compte" : "Signaler"}
      </button>

      {open && typeof document !== "undefined" && createPortal(modal, document.body)}
    </>
  );
}
