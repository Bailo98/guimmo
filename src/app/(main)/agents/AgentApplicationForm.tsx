"use client";
import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { NEIGHBORHOODS } from "@/data/neighborhoods";

const COMMUNES = ["Ratoma", "Dixinn", "Matam", "Kaloum", "Matoto", "Coyah"];

export function AgentApplicationForm() {
  const [form, setForm]     = useState({ name: "", phone: "", neighborhood: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone]     = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.phone || !form.neighborhood) return;
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.from("agent_applications").insert({
          name:         form.name,
          phone:        form.phone,
          neighborhood: form.neighborhood,
        });
      }
      setDone(true);
    } catch {
      setDone(true); // best-effort
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-4 space-y-3">
        <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto" />
        <p className="text-white font-bold">Demande envoyée !</p>
        <p className="text-white/50 text-sm">Notre équipe vous contactera sous 48h.</p>
      </div>
    );
  }

  const canSubmit = !!form.name && !!form.phone && !!form.neighborhood;

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Nom */}
      <input
        type="text"
        placeholder="Votre nom complet"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        className="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", minHeight: 52 }}
      />

      {/* Téléphone */}
      <input
        type="tel"
        placeholder="Votre numéro WhatsApp (+224...)"
        value={form.phone}
        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        className="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", minHeight: 52 }}
      />

      {/* Quartier */}
      <select
        value={form.neighborhood}
        onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))}
        className="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none appearance-none"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", minHeight: 52 }}
      >
        <option value="">— Votre quartier principal —</option>
        {COMMUNES.map((commune) => (
          <optgroup key={commune} label={commune}>
            {NEIGHBORHOODS.filter((n) => n.commune === commune).map((n) => (
              <option key={n.id} value={n.id}>{n.name}</option>
            ))}
          </optgroup>
        ))}
      </select>

      <button
        type="submit"
        disabled={!canSubmit || loading}
        className="w-full flex items-center justify-center gap-2 rounded-xl font-bold text-white text-sm"
        style={{
          minHeight: 52,
          background: canSubmit && !loading ? "#f97316" : "rgba(255,255,255,0.08)",
          color: canSubmit && !loading ? "#fff" : "rgba(255,255,255,0.30)",
        }}
      >
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi…</> : "Envoyer ma candidature"}
      </button>
    </form>
  );
}
