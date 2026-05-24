"use client";
import { useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, X, Loader2, CheckCircle2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/lib/toast";
import Link from "next/link";

const TIME_SLOTS = [
  { id: "morning",   label: "Matin (8h – 12h)" },
  { id: "afternoon", label: "Après-midi (12h – 17h)" },
  { id: "evening",   label: "Soir (17h – 20h)" },
];

interface Props {
  propertyId: string;
  ownerId: string;
  propertyTitle: string;
  onClose: () => void;
}

export function VisitRequestModal({ propertyId, ownerId, propertyTitle, onClose }: Props) {
  const { user, profile } = useAuth();

  const [visitorName,  setVisitorName]  = useState(profile?.full_name ?? "");
  const [visitorPhone, setVisitorPhone] = useState(profile?.phone ?? "");
  const [visitorEmail, setVisitorEmail] = useState(user?.email ?? "");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [message,      setMessage]      = useState("");
  const [loading,      setLoading]      = useState(false);
  const [done,         setDone]         = useState(false);

  const today = new Date().toISOString().split("T")[0];

  function close() {
    document.body.style.overflow = "";
    onClose();
  }

  async function submit() {
    if (!visitorName.trim() || !visitorPhone.trim() || !preferredDate || !preferredTime) return;
    if (!user || !isSupabaseConfigured || !supabase) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("visits").insert({
        property_id:      propertyId,
        visitor_id:       user.id,
        owner_id:         ownerId,
        visitor_name:     visitorName.trim(),
        visitor_phone:    visitorPhone.trim(),
        visitor_email:    visitorEmail.trim() || null,
        scheduled_date:   preferredDate,
        scheduled_time:   preferredTime,
        visitor_message:  message.trim() || null,
        status:           "pending",
      });
      if (!error) {
        toast("📅 Demande de visite envoyée ! L'agent vous contactera pour confirmer.", "success");
      }
      setDone(true);
    } catch {
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  const inputCss: React.CSSProperties = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 12,
    padding: "0 14px",
    color: "#fff",
    fontSize: 14,
    width: "100%",
    outline: "none",
    height: 48,
  };

  const isOwner = user?.id === ownerId;
  const canSubmit = visitorName.trim() && visitorPhone.trim() && preferredDate && preferredTime;

  const modal = (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 2147483647,
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div
        className="space-y-4"
        style={{
          position: "relative", background: "#1a252b", borderRadius: 20,
          padding: 24, width: "100%", maxWidth: 480,
          maxHeight: "88vh", overflowY: "auto",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-yellow-400" />
            <h2 className="text-white font-black text-base">Demander une visite</h2>
          </div>
          <button
            onClick={close}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-white/50 text-xs line-clamp-1">{propertyTitle}</p>

        {done ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-yellow-400 mx-auto" />
            <p className="text-white font-bold text-lg">Demande envoyée !</p>
            <p className="text-white/50 text-sm">Le propriétaire vous contactera pour confirmer la visite.</p>
            <button
              onClick={close}
              className="mt-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm"
              style={{ background: "rgba(255,255,255,0.10)" }}
            >
              Fermer
            </button>
          </div>
        ) : !user ? (
          <div className="text-center py-6 space-y-3">
            <p className="text-white/70 text-sm">Connectez-vous pour envoyer une demande de visite.</p>
            <Link
              href={`/connexion?redirect=/annonces/${propertyId}`}
              className="inline-block px-6 py-2.5 rounded-xl font-bold text-sm"
              style={{ background: "#E9E900", color: "#0A1216" }}
              onClick={() => { document.body.style.overflow = ""; }}
            >
              Se connecter
            </Link>
          </div>
        ) : isOwner ? (
          <div className="text-center py-6">
            <p className="text-white/50 text-sm">Vous ne pouvez pas demander une visite pour votre propre annonce.</p>
          </div>
        ) : (
          <>
            {/* Name + Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-white/50 text-[10px] uppercase tracking-wider mb-1.5">Prénom &amp; Nom *</p>
                <input
                  style={inputCss} type="text" value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="Votre nom"
                />
              </div>
              <div>
                <p className="text-white/50 text-[10px] uppercase tracking-wider mb-1.5">Téléphone *</p>
                <input
                  style={inputCss} type="tel" value={visitorPhone}
                  onChange={(e) => setVisitorPhone(e.target.value)}
                  placeholder="+224 6XX XXX XXX"
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <p className="text-white/50 text-[10px] uppercase tracking-wider mb-1.5">Date souhaitée *</p>
              <input
                style={inputCss} type="date" value={preferredDate} min={today}
                onChange={(e) => setPreferredDate(e.target.value)}
              />
            </div>

            {/* Time slot */}
            <div>
              <p className="text-white/50 text-[10px] uppercase tracking-wider mb-1.5">Créneau *</p>
              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.map((t) => (
                  <button
                    key={t.id} type="button"
                    onClick={() => setPreferredTime(t.id)}
                    className="px-2 py-2.5 rounded-xl text-xs font-semibold text-center transition-all"
                    style={{
                      background: preferredTime === t.id ? "rgba(233,233,0,0.15)" : "rgba(255,255,255,0.04)",
                      border: preferredTime === t.id ? "1px solid rgba(233,233,0,0.50)" : "1px solid rgba(255,255,255,0.08)",
                      color: preferredTime === t.id ? "#E9E900" : "rgba(255,255,255,0.60)",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional message */}
            <div>
              <p className="text-white/50 text-[10px] uppercase tracking-wider mb-1.5">Message (optionnel)</p>
              <textarea
                value={message} onChange={(e) => setMessage(e.target.value)}
                placeholder="Précisez vos questions ou contraintes…"
                rows={2}
                className="resize-none focus:outline-none"
                style={{ ...inputCss, height: "auto", padding: "12px 14px", minHeight: 60 }}
              />
            </div>

            {/* Submit */}
            <button
              onClick={submit}
              disabled={!canSubmit || loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl font-bold text-sm"
              style={{
                minHeight: 52,
                background: canSubmit && !loading ? "#E9E900" : "rgba(255,255,255,0.08)",
                color: canSubmit && !loading ? "#0A1216" : "rgba(255,255,255,0.30)",
              }}
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Envoi…</> : "📅 Envoyer la demande"}
            </button>
          </>
        )}
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modal, document.body) : null;
}
