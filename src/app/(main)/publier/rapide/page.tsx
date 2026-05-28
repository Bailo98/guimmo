"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, Upload, X, Phone, MapPin, CheckCircle2, Loader2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import { NEIGHBORHOODS } from "@/data/neighborhoods";
import { cn, formatPrice } from "@/lib/utils";

const COMMUNES = ["Ratoma", "Dixinn", "Matam", "Kaloum", "Matoto", "Coyah"];

const TYPE_OPTIONS = [
  { id: "apartment", label: "Appart.",  emoji: "🏢" },
  { id: "house",     label: "Maison",   emoji: "🏠" },
  { id: "villa",     label: "Villa",    emoji: "🏡" },
  { id: "studio",    label: "Studio",   emoji: "🛋️" },
  { id: "room",      label: "Chambre",  emoji: "🚪" },
  { id: "land",      label: "Terrain",  emoji: "🌿" },
] as const;

type PType = typeof TYPE_OPTIONS[number]["id"];

function formatGNF(raw: string): string {
  const n = parseInt(raw.replace(/\D/g, ""), 10);
  if (isNaN(n) || n === 0) return "";
  return formatPrice(n);
}

export default function PublierRapidePage() {
  const router = useRouter();
  const fileRef   = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [previews, setPreviews]     = useState<string[]>([]);
  const [files, setFiles]           = useState<File[]>([]);
  const [published, setPublished]   = useState<{ id: string; phone: string } | null>(null);
  const [form, setForm] = useState({
    price:        "",
    neighborhood: "",
    phone:        "",
    txType:       "rent" as "rent" | "sale",
    type:         "" as PType | "",
  });

  function addPhotos(fl: FileList | null) {
    if (!fl) return;
    const imgs = Array.from(fl).filter((f) => f.type.startsWith("image/")).slice(0, 4 - files.length);
    setFiles((p) => [...p, ...imgs]);
    setPreviews((p) => [...p, ...imgs.map((f) => URL.createObjectURL(f))]);
  }

  function removePhoto(i: number) {
    URL.revokeObjectURL(previews[i]);
    setFiles((p) => p.filter((_, idx) => idx !== i));
    setPreviews((p) => p.filter((_, idx) => idx !== i));
  }

  const canSubmit = files.length >= 1 && !!form.price && !!form.neighborhood && !!form.phone;
  const priceLabel = formatGNF(form.price);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);

    try {
      if (!isSupabaseConfigured || !supabase) {
        // Mock mode
        await new Promise((r) => setTimeout(r, 1200));
        toast("✅ Annonce soumise (mode demo)", "success");
        router.push("/annonces");
        return;
      }

      const priceNum = parseInt(form.price.replace(/\D/g, ""), 10);
      if (!priceNum || priceNum <= 0) {
        toast("Veuillez saisir un prix valide", "error");
        setSubmitting(false);
        return;
      }

      const digitsOnly = form.phone.replace(/[\s+\-().]/g, "");
      if (!/^\d{7,15}$/.test(digitsOnly)) {
        toast("Numéro de téléphone invalide (7–15 chiffres)", "error");
        setSubmitting(false);
        return;
      }

      const nbName   = NEIGHBORHOODS.find((n) => n.id === form.neighborhood)?.name ?? form.neighborhood;
      const propType = form.type || "house";
      const title    = `${TYPE_OPTIONS.find((t) => t.id === propType)?.label ?? "Bien"} à ${nbName}`;

      // ── 1. Get or create user ──────────────────────────────────────
      let userId: string;
      const { data: { user: existing } } = await supabase.auth.getUser();

      if (existing) {
        userId = existing.id;
      } else {
        // Create a temporary account
        const rawPhone = form.phone.replace(/[\s+\-()]/g, "");
        const normalized = rawPhone.startsWith("224") ? rawPhone : `224${rawPhone}`;
        // ⚠️  DO NOT rename @bienloger.gn without migrating auth.users in Supabase first.
        const tempEmail = `temp_${normalized}_${Date.now()}@bienloger.gn`;
        const tempPassword = Math.random().toString(36).slice(2, 12) + "Aa1!";

        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: tempEmail,
          password: tempPassword,
          options: { data: { phone: form.phone, role: "owner" } },
        });

        if (signUpErr || !signUpData.user) throw new Error("Création compte échouée");
        userId = signUpData.user.id;

        // Force immediate sign-in to bypass email confirmation
        await supabase.auth.signInWithPassword({ email: tempEmail, password: tempPassword });
      }

      // ── 2. Upload photos ───────────────────────────────────────────
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext  = file.name.split(".").pop() ?? "jpg";
        const path = `${userId}/${Date.now()}-${i}.${ext}`;
        const { error } = await supabase.storage
          .from("property-images")
          .upload(path, file, { upsert: false, contentType: file.type });
        if (!error) {
          const { data: { publicUrl } } = supabase.storage.from("property-images").getPublicUrl(path);
          uploadedUrls.push(publicUrl);
        }
      }

      // ── 3. Insert property ─────────────────────────────────────────
      const { data: prop, error: insertErr } = await supabase
        .from("properties")
        .insert({
          owner_id:          userId,
          title,
          description:       "",
          type:              propType,
          transaction_type:  form.txType,
          price:             priceNum,
          price_period:      form.txType === "rent" ? "month" : "total",
          rooms:             1,
          bathrooms:         0,
          furnished:         false,
          available_now:     true,
          neighborhood:      form.neighborhood,
          city:              "Conakry",
          status:            "pending",
          expires_at:        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          contact_phone:     form.phone,
          contact_preference: "both",
          features:          [],
          is_boosted:        false,
          views:             0,
          whatsapp_clicks:   0,
        })
        .select("id")
        .single();

      if (insertErr || !prop) {
        const msg = insertErr?.message ?? "Erreur insertion — vérifiez votre connexion";
        toast(`Erreur publication : ${msg}`, "error");
        setSubmitting(false);
        return;
      }

      if (uploadedUrls.length > 0) {
        await supabase.from("property_images").insert(
          uploadedUrls.map((url, i) => ({
            property_id: prop.id,
            url,
            alt: title,
            is_primary: i === 0,
            sort_order: i,
          }))
        );
      }

      setPublished({ id: prop.id, phone: form.phone });
    } catch (err) {
      console.error(err);
      toast("Erreur lors de la publication", "error");
      setSubmitting(false);
    }
  }

  // ── Success screen ──────────────────────────────────────────────
  if (published) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-12 pb-32 text-center" style={{ background: "var(--LogerBien-bg)" }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl" style={{ background: "rgba(212,175,55,0.12)", border: "2px solid rgba(212,175,55,0.30)" }}>
          ✅
        </div>
        <h1 className="text-2xl font-black text-white mb-3">Annonce soumise !</h1>
        <p className="text-white/60 text-sm leading-relaxed mb-6">
          Votre annonce est en cours de vérification. Elle sera publiée sous 24h.<br />
          <span className="text-white font-semibold">Retenez votre numéro {form.phone} pour vous connecter plus tard.</span>
        </p>
        <button
          onClick={() => router.push(`/annonces/${published.id}`)}
          className="w-full flex items-center justify-center gap-2 rounded-2xl font-black text-white mb-3"
          style={{ minHeight: 52, background: "#D4AF37" }}
        >
          <CheckCircle2 className="w-5 h-5" /> Voir mon annonce
        </button>
        <button
          onClick={() => router.push("/annonces")}
          className="w-full text-white/50 text-sm py-3"
        >
          Voir toutes les annonces
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-32 min-h-screen" style={{ background: "var(--LogerBien-bg)" }}>
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-3"
          style={{ background: "rgba(212,175,55,0.15)", color: "var(--LogerBien-amber-light)", border: "1px solid rgba(212,175,55,0.25)" }}>
          ⚡ Publication rapide
        </div>
        <h1 className="text-2xl font-black text-white mb-1">Publie ton bien</h1>
        <p className="text-white/50 text-sm">Sans compte — en moins de 2 minutes</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Photos */}
        <div>
          <label className="block text-sm font-bold text-white mb-3">
            📸 Photos <span className="text-red-400">*</span>
            <span className="text-white/40 font-normal ml-1">(min. 1, max. 4)</span>
          </label>
          {previews.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mb-3">
              {previews.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-white/5">
                  <Image src={url} alt="" fill className="object-cover" sizes="80px" />
                  <button type="button" onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white">
                    <X className="w-3 h-3" />
                  </button>
                  {i === 0 && <span className="absolute bottom-1 left-1 text-[9px] font-bold px-1 py-0.5 rounded text-white" style={{ background: "rgba(255,255,255,0.25)" }}>Princ.</span>}
                </div>
              ))}
            </div>
          )}
          {files.length < 4 && (
            <div className="flex gap-2">
              <button type="button" onClick={() => fileRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-white/20 text-white/60 hover:border-white/40 hover:text-white transition-colors text-sm font-semibold"
                style={{ minHeight: 52 }}>
                <Upload className="w-4 h-4" /> Galerie
              </button>
              <button type="button" onClick={() => cameraRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-white/20 text-white/60 hover:border-white/40 hover:text-white transition-colors text-sm font-semibold"
                style={{ minHeight: 52 }}>
                <Camera className="w-4 h-4" /> Caméra
              </button>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} />
          <input ref={cameraRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} />
        </div>

        {/* Type de bien */}
        <div>
          <label className="block text-sm font-bold text-white mb-3">🏠 Type de bien</label>
          <div className="grid grid-cols-3 gap-2">
            {TYPE_OPTIONS.map((t) => (
              <button key={t.id} type="button" onClick={() => setForm((f) => ({ ...f, type: t.id }))}
                className={cn("flex flex-col items-center gap-1 py-3 rounded-xl border-2 font-semibold text-xs transition-all")}
                style={{
                  minHeight: 60,
                  borderColor: form.type === t.id ? "#D4AF37" : "rgba(255,255,255,0.12)",
                  background: form.type === t.id ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.04)",
                  color: form.type === t.id ? "#D4AF37" : "rgba(255,255,255,0.60)",
                }}>
                <span className="text-xl">{t.emoji}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction type */}
        <div>
          <label className="block text-sm font-bold text-white mb-3">🔑 Location ou vente ?</label>
          <div className="grid grid-cols-2 gap-3">
            {(["rent", "sale"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setForm((f) => ({ ...f, txType: t }))}
                className="py-4 rounded-xl border-2 font-bold text-sm transition-all"
                style={{
                  minHeight: 52,
                  borderColor: form.txType === t ? "#D4AF37" : "rgba(255,255,255,0.12)",
                  background: form.txType === t ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.04)",
                  color: form.txType === t ? "#D4AF37" : "rgba(255,255,255,0.50)",
                }}>
                {t === "rent" ? "🔑 À Louer" : "💰 À Vendre"}
              </button>
            ))}
          </div>
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-bold text-white mb-2">
            💰 Prix {form.txType === "rent" ? "(par mois)" : ""} <span className="text-red-400">*</span>
          </label>
          <input
            type="number" inputMode="numeric" placeholder="Ex : 1 500 000"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            className="w-full rounded-xl px-4 py-3 text-white font-semibold focus:outline-none"
            style={{ background: "var(--border-subtle)", border: "1px solid rgba(255,255,255,0.10)", fontSize: 16, minHeight: 52 }}
          />
          {priceLabel && <p className="text-[#D4AF37] font-bold text-sm mt-1.5 ml-1">{priceLabel}{form.txType === "rent" ? "/mois" : ""}</p>}
        </div>

        {/* Quartier */}
        <div>
          <label className="block text-sm font-bold text-white mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />Quartier <span className="text-red-400">*</span>
          </label>
          <select
            value={form.neighborhood}
            onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))}
            className="w-full rounded-xl px-4 py-3 text-white focus:outline-none appearance-none"
            style={{ background: "var(--border-subtle)", border: "1px solid rgba(255,255,255,0.10)", fontSize: 16, minHeight: 52 }}
          >
            <option value="">— Choisir un quartier —</option>
            {COMMUNES.map((commune) => (
              <optgroup key={commune} label={commune}>
                {NEIGHBORHOODS.filter((n) => n.commune === commune).map((n) => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Phone / WhatsApp */}
        <div>
          <label className="block text-sm font-bold text-white mb-2">
            <Phone className="w-4 h-4 inline mr-1" />Votre WhatsApp <span className="text-red-400">*</span>
          </label>
          <input
            type="tel" placeholder="+224 6XX XX XX XX"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="w-full rounded-xl px-4 py-3 text-white font-semibold focus:outline-none"
            style={{ background: "var(--border-subtle)", border: "1px solid rgba(255,255,255,0.10)", fontSize: 16, minHeight: 52 }}
          />
          <p className="text-white/40 text-xs mt-1.5 ml-1">Les acheteurs vous contacteront via ce numéro</p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="w-full flex items-center justify-center gap-2 rounded-2xl font-black text-white transition-all"
          style={{
            minHeight: 56, fontSize: 15,
            background: canSubmit && !submitting ? "#D4AF37" : "rgba(255,255,255,0.08)",
            color: canSubmit && !submitting ? "#fff" : "rgba(255,255,255,0.30)",
            boxShadow: canSubmit && !submitting ? "0 8px 32px rgba(212,175,55,0.35)" : "none",
          }}
        >
          {submitting ? (
            <><Loader2 className="w-5 h-5 animate-spin" />Publication en cours…</>
          ) : canSubmit ? (
            <><CheckCircle2 className="w-5 h-5" />Publier maintenant — gratuit</>
          ) : (
            "Complétez les champs obligatoires"
          )}
        </button>

        <p className="text-center text-white/30 text-xs">
          En publiant, vous acceptez nos{" "}
          <a href="/cgv" className="text-[#D4AF37] hover:underline">conditions d&apos;utilisation</a>.
          Publication gratuite, visible immédiatement.
        </p>

      </form>
    </div>
  );
}
