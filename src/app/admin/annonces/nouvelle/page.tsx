"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import { useAuth } from "@/lib/auth-context";
import { NEIGHBORHOODS } from "@/data/neighborhoods";

const COMMUNES = ["Ratoma", "Dixinn", "Matam", "Kaloum", "Matoto", "Coyah"];

const FEATURES_LIST = [
  "Parking", "Gardien", "Groupes électrogène", "Eau courante", "Climatisation",
  "Wifi", "Balcon", "Jardin", "Piscine", "Ascenseur", "Meublé", "Cuisine équipée",
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

const INPUT_CLS = "w-full bg-white dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] rounded-xl px-3 py-2.5 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F97316]";
const SELECT_CLS = INPUT_CLS + " appearance-none";

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
    short_ref: "",
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
      short_ref:          form.short_ref.trim() || null,
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

  if (done) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-sm">
          <CheckCircle className="w-14 h-14 text-green-400 mx-auto" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Annonce publiée !</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">L&apos;annonce a été ajoutée avec succès.</p>
          <div className="flex gap-3 justify-center pt-2">
            {newId && (
              <Link href={`/annonces/${newId}`} target="_blank"
                className="px-4 py-2.5 rounded-xl bg-[#c8901e] text-white text-sm font-bold">
                Voir l&apos;annonce
              </Link>
            )}
            <button onClick={() => { setDone(false); setNewId(null); setForm({ title: "", description: "", type: "apartment", transaction_type: "rent", price: "", price_period: "month", surface: "", rooms: "1", bathrooms: "0", furnished: false, available_now: true, neighborhood: "", contact_phone: "", contact_preference: "both", features: [], video_url: "", short_ref: "", latitude: "", longitude: "" }); }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#2a3040] text-slate-600 dark:text-slate-300 text-sm font-semibold">
              Nouvelle annonce
            </button>
            <button onClick={() => router.push("/admin/annonces")}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#2a3040] text-slate-600 dark:text-slate-300 text-sm font-semibold">
              Retour liste
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/annonces"
          className="w-8 h-8 rounded-xl border border-slate-200 dark:border-[#2a3040] flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Nouvelle annonce</h1>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {/* Title */}
        <Field label="Titre *">
          <input id="title" aria-label="Titre de l'annonce" required value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Studio meublé à Kipé"
            className={INPUT_CLS} />
        </Field>

        {/* Type + Transaction */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type de bien *">
            <select id="type" aria-label="Type de bien" value={form.type} onChange={(e) => set("type", e.target.value)} className={SELECT_CLS}>
              <option value="apartment">Appartement</option>
              <option value="house">Maison</option>
              <option value="studio">Studio</option>
              <option value="villa">Villa</option>
              <option value="room">Chambre</option>
              <option value="land">Terrain</option>
            </select>
          </Field>
          <Field label="Transaction *">
            <select id="transaction_type" aria-label="Type de transaction" value={form.transaction_type} onChange={(e) => set("transaction_type", e.target.value)} className={SELECT_CLS}>
              <option value="rent">Location</option>
              <option value="sale">Vente</option>
            </select>
          </Field>
        </div>

        {/* Price */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prix (GNF) *">
            <input id="price" aria-label="Prix en GNF" type="number" min={0} required value={form.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="1500000"
              className={INPUT_CLS} />
          </Field>
          <Field label="Période">
            <select id="price_period" aria-label="Période de paiement" value={form.price_period} onChange={(e) => set("price_period", e.target.value)} className={SELECT_CLS}>
              <option value="month">Par mois</option>
              <option value="year">Par an</option>
              <option value="total">Total</option>
            </select>
          </Field>
        </div>

        {/* Surface + Rooms */}
        <div className="grid grid-cols-3 gap-3">
          <Field label="Surface (m²)">
            <input id="surface" aria-label="Surface en m²" type="number" min={0} value={form.surface}
              onChange={(e) => set("surface", e.target.value)} placeholder="50" className={INPUT_CLS} />
          </Field>
          <Field label="Pièces">
            <input id="rooms" aria-label="Nombre de pièces" type="number" min={0} value={form.rooms}
              onChange={(e) => set("rooms", e.target.value)} className={INPUT_CLS} />
          </Field>
          <Field label="SDB">
            <input id="bathrooms" aria-label="Nombre de salles de bain" type="number" min={0} value={form.bathrooms}
              onChange={(e) => set("bathrooms", e.target.value)} className={INPUT_CLS} />
          </Field>
        </div>

        {/* Neighborhood */}
        <Field label="Quartier *">
          <select id="neighborhood" aria-label="Quartier" required value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} className={SELECT_CLS}>
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
          <textarea id="description" aria-label="Description de l'annonce" value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={4} placeholder="Décrivez le bien…"
            className={INPUT_CLS + " resize-none"} />
        </Field>

        {/* Contact */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Téléphone contact">
            <input id="contact_phone" aria-label="Numéro de contact" type="tel" value={form.contact_phone}
              onChange={(e) => set("contact_phone", e.target.value)}
              placeholder="+224 6XX XXX XXX" className={INPUT_CLS} />
          </Field>
          <Field label="Mode de contact">
            <select id="contact_pref" aria-label="Mode de contact préféré" value={form.contact_preference} onChange={(e) => set("contact_preference", e.target.value)} className={SELECT_CLS}>
              <option value="both">WhatsApp + Appel</option>
              <option value="whatsapp">WhatsApp uniquement</option>
              <option value="call">Appel uniquement</option>
            </select>
          </Field>
        </div>

        {/* Toggles */}
        <div className="flex gap-4 flex-wrap">
          {([
            { key: "furnished",     label: "Meublé" },
            { key: "available_now", label: "Disponible maintenant" },
          ] as { key: keyof typeof form; label: string }[]).map(({ key, label }) => {
            const val = form[key] as boolean;
            return (
              <button key={key} type="button"
                onClick={() => set(key, !val)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${val ? "bg-green-50 dark:bg-green-900/20 border-green-400 text-green-700 dark:text-green-400" : "bg-white dark:bg-[#151922] border-slate-200 dark:border-[#2a3040] text-slate-500"}`}>
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${val ? "border-green-500 bg-green-500" : "border-slate-300"}`}>
                  {val && <span className="w-2 h-2 rounded-full bg-white" />}
                </span>
                {label}
              </button>
            );
          })}
        </div>

        {/* Features */}
        <Field label="Équipements">
          <div className="flex flex-wrap gap-2">
            {FEATURES_LIST.map((f) => (
              <button key={f} type="button" onClick={() => toggleFeature(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${form.features.includes(f) ? "bg-[#c8901e] border-[#c8901e] text-white" : "bg-white dark:bg-[#151922] border-slate-200 dark:border-[#2a3040] text-slate-500 dark:text-slate-400"}`}>
                {f}
              </button>
            ))}
          </div>
        </Field>

        {/* Video + Short ref */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="URL vidéo">
            <input id="video_url" aria-label="URL de la vidéo" type="url" value={form.video_url}
              onChange={(e) => set("video_url", e.target.value)}
              placeholder="https://…" className={INPUT_CLS} />
          </Field>
          <Field label="Référence courte">
            <input id="short_ref" aria-label="Référence courte" value={form.short_ref}
              onChange={(e) => set("short_ref", e.target.value)}
              placeholder="GUI-XXXX" className={INPUT_CLS} />
          </Field>
        </div>

        {/* GPS */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Latitude">
            <input id="latitude" aria-label="Latitude GPS" type="number" step="any" value={form.latitude}
              onChange={(e) => set("latitude", e.target.value)}
              placeholder="9.5370" className={INPUT_CLS} />
          </Field>
          <Field label="Longitude">
            <input id="longitude" aria-label="Longitude GPS" type="number" step="any" value={form.longitude}
              onChange={(e) => set("longitude", e.target.value)}
              placeholder="-13.6773" className={INPUT_CLS} />
          </Field>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <Link href="/admin/annonces"
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 dark:border-[#2a3040] text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-[#2a3040]">
            Annuler
          </Link>
          <button type="submit" disabled={saving || !form.title || !form.price || !form.neighborhood}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#c8901e] hover:bg-[#b87c18] text-white font-bold text-sm transition-colors disabled:opacity-40">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Publication…</> : "Publier l'annonce"}
          </button>
        </div>
      </form>
    </div>
  );
}
