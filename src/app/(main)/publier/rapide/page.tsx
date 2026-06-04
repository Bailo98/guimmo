"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, Upload, X, Phone, MapPin, CheckCircle2, Loader2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/lib/toast";
import { NEIGHBORHOODS } from "@/data/neighborhoods";
import { cn, formatPrice } from "@/lib/utils";

const COMMUNES = ["Ratoma", "Dixinn", "Matam", "Kaloum", "Matoto", "Coyah"];

const fieldStyle = {
  background: "var(--bg-secondary)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  fontSize: 16,
  minHeight: 52,
};

const helpTextStyle = { color: "var(--text-secondary)" };

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
  const { user, profile } = useAuth();
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
  const isSeekerAccount = !!user && ["chercheur", "seeker"].includes(profile?.account_type ?? profile?.role ?? "");

  async function becomeOwner() {
    if (!user || !supabase) return;
    let { error } = await supabase.from("profiles").update({ account_type: "owner", role: "owner" }).eq("id", user.id);
    if (error) {
      const legacy = await supabase.from("profiles").update({ account_type: "proprietaire", role: "owner" }).eq("id", user.id);
      error = legacy.error;
    }
    if (error) {
      toast("Impossible de changer le type de compte", "error");
      return;
    }
    toast("Compte propriétaire activé", "success");
    window.location.reload();
  }

  if (isSeekerAccount) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-12 pb-32 text-center" style={{ background: "var(--bg-primary)" }}>
        <div className="rounded-3xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <p className="text-4xl mb-4">🏠</p>
          <h1 className="text-2xl font-black mb-3" style={{ color: "var(--text-primary)" }}>
            Tu veux publier un logement ?
          </h1>
          <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
            Passe en compte propriétaire pour publier en moins de 60 secondes.
          </p>
          <button
            onClick={becomeOwner}
            className="w-full rounded-2xl font-black"
            style={{ minHeight: 52, background: "var(--accent-gold)", color: "var(--bg-primary)" }}
          >
            Devenir propriétaire
          </button>
        </div>
      </div>
    );
  }

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
      <div className="max-w-lg mx-auto px-4 pt-12 pb-32 text-center" style={{ background: "var(--bg-primary)" }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl" style={{ background: "rgba(212,175,55,0.12)", border: "2px solid rgba(212,175,55,0.30)" }}>
          ✅
        </div>
        <h1 className="text-2xl font-black mb-3" style={{ color: "var(--text-primary)" }}>Annonce soumise !</h1>
        <p className="text-sm leading-relaxed mb-6" style={helpTextStyle}>
          Votre annonce est en cours de vérification. Elle sera publiée sous 24h.<br />
          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Retenez votre numéro {form.phone} pour vous connecter plus tard.</span>
        </p>
        <button
          onClick={() => router.push(`/annonces/${published.id}`)}
          className="w-full flex items-center justify-center gap-2 rounded-2xl font-black mb-3"
          style={{ minHeight: 52, background: "var(--accent-gold)", color: "#17120a" }}
        >
          <CheckCircle2 className="w-5 h-5" /> Voir mon annonce
        </button>
        <button
          onClick={() => router.push("/annonces")}
          className="w-full text-sm py-3"
          style={helpTextStyle}
        >
          Voir toutes les annonces
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 min-h-screen" style={{ background: "var(--bg-primary)", paddingBottom: "calc(120px + env(safe-area-inset-bottom, 0px))" }}>
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-3"
          style={{ background: "rgba(212,175,55,0.15)", color: "var(--accent-gold)", border: "1px solid rgba(212,175,55,0.25)" }}>
          ⚡ Publication rapide
        </div>
        <h1 className="text-2xl font-black mb-1" style={{ color: "var(--text-primary)" }}>Publie ton bien</h1>
        <p className="text-sm" style={helpTextStyle}>Sans compte — en moins de 2 minutes</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Photos */}
        <div>
          <label className="block text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>
            📸 Photos <span className="text-red-400">*</span>
            <span className="font-normal ml-1" style={helpTextStyle}>(min. 1, max. 4)</span>
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
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed transition-colors text-sm font-bold"
                style={{ minHeight: 52, background: "var(--bg-card)", borderColor: "rgba(212,175,55,0.35)", color: "var(--text-primary)" }}>
                <Upload className="w-4 h-4" /> Galerie
              </button>
              <button type="button" onClick={() => cameraRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed transition-colors text-sm font-bold"
                style={{ minHeight: 52, background: "var(--bg-card)", borderColor: "rgba(212,175,55,0.35)", color: "var(--text-primary)" }}>
                <Camera className="w-4 h-4" /> Caméra
              </button>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} />
          <input ref={cameraRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} />
        </div>

        {/* Type de bien */}
        <div>
          <label className="block text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>🏠 Type de bien</label>
          <div className="grid grid-cols-3 gap-2">
            {TYPE_OPTIONS.map((t) => (
              <button key={t.id} type="button" onClick={() => setForm((f) => ({ ...f, type: t.id }))}
                className={cn("flex flex-col items-center gap-1 py-3 rounded-xl border-2 font-semibold text-xs transition-all")}
                style={{
                  minHeight: 60,
                  borderColor: form.type === t.id ? "var(--accent-gold)" : "var(--border)",
                  background: form.type === t.id ? "rgba(212,175,55,0.16)" : "var(--bg-card)",
                  color: form.type === t.id ? "var(--accent-gold)" : "var(--text-primary)",
                }}>
                <span className="text-xl">{t.emoji}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction type */}
        <div>
          <label className="block text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>🔑 Location ou vente ?</label>
          <div className="grid grid-cols-2 gap-3">
            {(["rent", "sale"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setForm((f) => ({ ...f, txType: t }))}
                className="py-4 rounded-xl border-2 font-bold text-sm transition-all"
                style={{
                  minHeight: 52,
                  borderColor: form.txType === t ? "var(--accent-gold)" : "var(--border)",
                  background: form.txType === t ? "rgba(212,175,55,0.16)" : "var(--bg-card)",
                  color: form.txType === t ? "var(--accent-gold)" : "var(--text-primary)",
                }}>
                {t === "rent" ? "🔑 À Louer" : "💰 À Vendre"}
              </button>
            ))}
          </div>
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            💰 Prix {form.txType === "rent" ? "(par mois)" : ""} <span className="text-red-400">*</span>
          </label>
          <input
            type="number" inputMode="numeric" placeholder="Ex : 1 500 000"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            className="w-full rounded-xl px-4 py-3 font-semibold focus:outline-none placeholder:text-[var(--text-muted)]"
            style={fieldStyle}
          />
          {priceLabel && <p className="text-[var(--accent-gold)] font-bold text-sm mt-1.5 ml-1">{priceLabel}{form.txType === "rent" ? "/mois" : ""}</p>}
        </div>

        {/* Quartier */}
        <div>
          <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            <MapPin className="w-4 h-4 inline mr-1" />Quartier <span className="text-red-400">*</span>
          </label>
          <select
            value={form.neighborhood}
            onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))}
            className="w-full rounded-xl px-4 py-3 focus:outline-none appearance-none"
            style={fieldStyle}
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
          <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            <Phone className="w-4 h-4 inline mr-1" />Votre WhatsApp <span className="text-red-400">*</span>
          </label>
          <input
            type="tel" placeholder="+224 6XX XX XX XX"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="w-full rounded-xl px-4 py-3 font-semibold focus:outline-none placeholder:text-[var(--text-muted)]"
            style={fieldStyle}
          />
          <p className="text-xs mt-1.5 ml-1" style={helpTextStyle}>Les acheteurs vous contacteront via ce numéro</p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="w-full flex items-center justify-center gap-2 rounded-2xl font-black transition-all"
          style={{
            minHeight: 56, fontSize: 15,
            background: canSubmit && !submitting ? "var(--accent-gold)" : "var(--bg-card)",
            border: canSubmit && !submitting ? "1px solid var(--accent-gold)" : "1px solid var(--border)",
            color: canSubmit && !submitting ? "#16120a" : "var(--text-muted)",
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

        <p className="text-center text-xs" style={helpTextStyle}>
          En publiant, vous acceptez nos{" "}
          <a href="/cgv" className="text-[var(--accent-gold)] hover:underline">conditions d&apos;utilisation</a>.
          Publication gratuite, visible immédiatement.
        </p>

      </form>
    </div>
  );
}
