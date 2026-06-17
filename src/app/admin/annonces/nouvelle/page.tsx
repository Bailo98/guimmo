"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import { useAuth } from "@/lib/auth-context";
import { NEIGHBORHOODS } from "@/data/neighborhoods";

// ─── Tokens ──────────────────────────────────────────────────────────────────
const SURFACE  = "var(--bg-card)";
const BORDER   = "var(--border)";
const TEXT_PRI = "var(--text-primary)";
const TEXT_SEC = "var(--text-primary-dim)";
const ACCENT   = "var(--accent-gold)";

const INPUT_STYLE: React.CSSProperties = {
  width: "100%", background: "var(--border-subtle)", border: `1px solid ${BORDER}`,
  color: TEXT_PRI, borderRadius: 10, height: 48, padding: "0 16px",
  fontSize: 14, outline: "none", boxSizing: "border-box",
};
const TEXTAREA_STYLE: React.CSSProperties = {
  ...INPUT_STYLE, height: "auto", padding: "12px 16px", resize: "none",
};
const SELECT_STYLE: React.CSSProperties = {
  ...INPUT_STYLE, appearance: "none" as const,
};

const COMMUNES = ["Ratoma", "Dixinn", "Matam", "Kaloum", "Matoto", "Coyah"];

const FEATURES_LIST = [
  "Parking", "Gardien", "Groupes électrogène", "Eau courante", "Climatisation",
  "Wifi", "Balcon", "Jardin", "Piscine", "Ascenseur", "Meublé", "Cuisine équipée",
];

function focusInput(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  (e.target as HTMLElement).style.borderColor = ACCENT;
}
function blurInput(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  (e.target as HTMLElement).style.borderColor = BORDER;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, color: TEXT_SEC, fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  );
}

export default function AdminNouvelleAnnoncePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "apartment",
    transaction_type: "rent",
    price: "",
    price_period: "month",
    surface: "",
    rooms: "1",
    bathrooms: "0",
    furnished: false,
    available_now: true,
    neighborhood: "",
    contact_phone: "",
    contact_preference: "both",
    features: [] as string[],
    video_url: "",
    latitude: "",
    longitude: "",
  });

  const [saving, setSaving] = useState(false);
  const [done, setDone]     = useState(false);
  const [newId, setNewId]   = useState<string | null>(null);

  function set(key: string, val: unknown) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function toggleFeature(f: string) {
    setForm((prev) => ({
      ...prev,
      features: prev.features.includes(f)
        ? prev.features.filter((x) => x !== f)
        : [...prev.features, f],
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !user) return;
    if (!form.title || !form.price || !form.neighborhood) {
      toast("Titre, prix et quartier sont obligatoires.", "error");
      return;
    }
    setSaving(true);
    const payload = {
      owner_id:           user.id,
      title:              form.title.trim(),
      description:        form.description.trim() || null,
      type:               form.type,
      transaction_type:   form.transaction_type,
      status:             "active",
      price:              Number(form.price),
      price_period:       form.price_period,
      surface:            form.surface ? Number(form.surface) : null,
      rooms:              Number(form.rooms) || 1,
      bathrooms:          Number(form.bathrooms) || 0,
      furnished:          form.furnished,
      available_now:      form.available_now,
      neighborhood:       form.neighborhood,
      city:               "Conakry",
      features:           form.features,
      contact_phone:      form.contact_phone.trim() || null,
      contact_preference: form.contact_preference,
      video_url:          form.video_url.trim() || null,
      latitude:           form.latitude ? Number(form.latitude) : null,
      longitude:          form.longitude ? Number(form.longitude) : null,
    };
    const { data, error } = await supabase.from("properties").insert(payload).select("id").single();
    setSaving(false);
    if (error) {
      toast("Erreur lors de la publication.", "error");
      console.error(error);
    } else {
      setNewId(data.id);
      setDone(true);
    }
  }

  const emptyForm = {
    title: "", description: "", type: "apartment", transaction_type: "rent",
    price: "", price_period: "month", surface: "", rooms: "1", bathrooms: "0",
    furnished: false, available_now: true, neighborhood: "", contact_phone: "",
    contact_preference: "both", features: [], video_url: "",
    latitude: "", longitude: "",
  };

  if (done) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <CheckCircle size={56} color="var(--accent-gold)" style={{ margin: "0 auto 16px" }} />
          <h2 style={{ color: TEXT_PRI, fontWeight: 900, fontSize: 20, marginBottom: 8 }}>Annonce publiée !</h2>
          <p style={{ color: TEXT_SEC, fontSize: 14, marginBottom: 24 }}>L&apos;annonce a été ajoutée avec succès.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {newId && (
              <Link href={`/annonces/${newId}`} target="_blank"
                style={{ padding: "10px 20px", borderRadius: 10, background: ACCENT, color: "white", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
                Voir l&apos;annonce
              </Link>
            )}
            <button onClick={() => { setDone(false); setNewId(null); setForm(emptyForm); }}
              style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "transparent", color: TEXT_PRI, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              Nouvelle annonce
            </button>
            <button onClick={() => router.push("/admin/annonces")}
              style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "transparent", color: TEXT_PRI, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              Retour liste
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page" style={{ maxWidth: 680, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <Link href="/admin/annonces" style={{
          width: 36, height: 36, borderRadius: 10, border: `1px solid ${BORDER}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: TEXT_SEC, textDecoration: "none",
        }}>
          <ArrowLeft size={16} />
        </Link>
        <h1 style={{ color: TEXT_PRI, fontWeight: 900, fontSize: "clamp(18px,3vw,24px)" }}>Nouvelle annonce</h1>
      </div>

      {/* Form card */}
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 32 }}>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Title */}
          <Field label="Titre *">
            <input
              aria-label="Titre de l'annonce" required value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Studio meublé à Kipé"
              style={INPUT_STYLE} onFocus={focusInput} onBlur={blurInput}
            />
          </Field>

          {/* Type + Transaction */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Type de bien *">
              <select aria-label="Type de bien" value={form.type} onChange={(e) => set("type", e.target.value)}
                style={SELECT_STYLE} onFocus={focusInput} onBlur={blurInput}>
                <option value="apartment">Appartement</option>
                <option value="house">Maison</option>
                <option value="studio">Studio</option>
                <option value="villa">Villa</option>
                <option value="room">Chambre</option>
                <option value="land">Terrain</option>
              </select>
            </Field>
            <Field label="Transaction *">
              <select aria-label="Type de transaction" value={form.transaction_type} onChange={(e) => set("transaction_type", e.target.value)}
                style={SELECT_STYLE} onFocus={focusInput} onBlur={blurInput}>
                <option value="rent">Location</option>
                <option value="sale">Vente</option>
              </select>
            </Field>
          </div>

          {/* Price */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Prix (GNF) *">
              <input
                aria-label="Prix en GNF" type="number" min={0} required value={form.price}
                onChange={(e) => set("price", e.target.value)} placeholder="1500000"
                style={INPUT_STYLE} onFocus={focusInput} onBlur={blurInput}
              />
            </Field>
            <Field label="Période">
              <select aria-label="Période de paiement" value={form.price_period} onChange={(e) => set("price_period", e.target.value)}
                style={SELECT_STYLE} onFocus={focusInput} onBlur={blurInput}>
                <option value="month">Par mois</option>
                <option value="year">Par an</option>
                <option value="total">Total</option>
              </select>
            </Field>
          </div>

          {/* Surface + Rooms + Bathrooms */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Field label="Surface (m²)">
              <input aria-label="Surface en m²" type="number" min={0} value={form.surface}
                onChange={(e) => set("surface", e.target.value)} placeholder="50"
                style={INPUT_STYLE} onFocus={focusInput} onBlur={blurInput} />
            </Field>
            <Field label="Pièces">
              <input aria-label="Nombre de pièces" type="number" min={0} value={form.rooms}
                onChange={(e) => set("rooms", e.target.value)}
                style={INPUT_STYLE} onFocus={focusInput} onBlur={blurInput} />
            </Field>
            <Field label="SDB">
              <input aria-label="Nombre de salles de bain" type="number" min={0} value={form.bathrooms}
                onChange={(e) => set("bathrooms", e.target.value)}
                style={INPUT_STYLE} onFocus={focusInput} onBlur={blurInput} />
            </Field>
          </div>

          {/* Neighborhood */}
          <Field label="Quartier *">
            <select aria-label="Quartier" required value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)}
              style={SELECT_STYLE} onFocus={focusInput} onBlur={blurInput}>
              <option value="">— Choisir un quartier —</option>
              {COMMUNES.map((c) => (
                <optgroup key={c} label={c}>
                  {NEIGHBORHOODS.filter((n) => n.commune === c).map((n) => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>

          {/* Description */}
          <Field label="Description">
            <textarea
              aria-label="Description de l'annonce" value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={4} placeholder="Décrivez le bien…"
              style={TEXTAREA_STYLE} onFocus={focusInput} onBlur={blurInput}
            />
          </Field>

          {/* Contact */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Téléphone contact">
              <input aria-label="Numéro de contact" type="tel" value={form.contact_phone}
                onChange={(e) => set("contact_phone", e.target.value)}
                placeholder="+224 6XX XXX XXX"
                style={INPUT_STYLE} onFocus={focusInput} onBlur={blurInput} />
            </Field>
            <Field label="Mode de contact">
              <select aria-label="Mode de contact préféré" value={form.contact_preference} onChange={(e) => set("contact_preference", e.target.value)}
                style={SELECT_STYLE} onFocus={focusInput} onBlur={blurInput}>
                <option value="both">WhatsApp + Appel</option>
                <option value="whatsapp">WhatsApp uniquement</option>
                <option value="call">Appel uniquement</option>
              </select>
            </Field>
          </div>

          {/* Toggles */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {([
              { key: "furnished",     label: "Meublé" },
              { key: "available_now", label: "Disponible maintenant" },
            ] as { key: keyof typeof form; label: string }[]).map(({ key, label }) => {
              const val = form[key] as boolean;
              return (
                <button key={key} type="button" onClick={() => set(key, !val)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 500,
                    border: `1px solid ${val ? "var(--accent-gold)" : BORDER}`,
                    background: val ? "rgba(212,175,55,0.12)" : "transparent",
                    color: val ? "var(--accent-gold)" : TEXT_SEC, cursor: "pointer",
                  }}>
                  <span style={{
                    width: 16, height: 16, borderRadius: "50%",
                    border: `2px solid ${val ? "var(--accent-gold)" : TEXT_SEC}`,
                    background: val ? "var(--accent-gold)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {val && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "white" }} />}
                  </span>
                  {label}
                </button>
              );
            })}
          </div>

          {/* Features */}
          <Field label="Équipements">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {FEATURES_LIST.map((f) => {
                const selected = form.features.includes(f);
                return (
                  <button key={f} type="button" onClick={() => toggleFeature(f)}
                    style={{
                      padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                      border: `1px solid ${selected ? ACCENT : BORDER}`,
                      background: selected ? ACCENT : "transparent",
                      color: selected ? "white" : TEXT_SEC, cursor: "pointer",
                    }}>
                    {f}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Video + Short ref */}
          <Field label="URL vidéo">
            <input aria-label="URL de la vidéo" type="url" value={form.video_url}
              onChange={(e) => set("video_url", e.target.value)}
              placeholder="https://…"
              style={INPUT_STYLE} onFocus={focusInput} onBlur={blurInput} />
          </Field>

          {/* GPS */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Latitude">
              <input aria-label="Latitude GPS" type="number" step="any" value={form.latitude}
                onChange={(e) => set("latitude", e.target.value)} placeholder="9.5370"
                style={INPUT_STYLE} onFocus={focusInput} onBlur={blurInput} />
            </Field>
            <Field label="Longitude">
              <input aria-label="Longitude GPS" type="number" step="any" value={form.longitude}
                onChange={(e) => set("longitude", e.target.value)} placeholder="-13.6773"
                style={INPUT_STYLE} onFocus={focusInput} onBlur={blurInput} />
            </Field>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, paddingTop: 8 }}>
            <Link href="/admin/annonces"
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "0 20px", height: 52, borderRadius: 12,
                border: `1px solid ${BORDER}`, color: TEXT_PRI,
                fontSize: 13, fontWeight: 600, textDecoration: "none",
              }}>
              Annuler
            </Link>
            <button type="submit" disabled={saving || !form.title || !form.price || !form.neighborhood}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                height: 52, borderRadius: 12, border: "none",
                background: saving || !form.title || !form.price || !form.neighborhood ? "rgba(249,115,22,0.4)" : ACCENT,
                color: "white", fontWeight: 600, fontSize: 14, cursor: saving ? "not-allowed" : "pointer",
              }}>
              {saving ? <><Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} />Publication…</> : "Publier l'annonce"}
            </button>
          </div>

        </form>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
