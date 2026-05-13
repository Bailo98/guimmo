"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ChevronLeft, X, Mic, MicOff, MapPin, Phone,
  Upload, Camera, ArrowRight, Locate, CheckCircle2, Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import { NEIGHBORHOODS } from "@/data/neighborhoods";
import { cn } from "@/lib/utils";

type PType = "apartment" | "house" | "studio" | "villa" | "room" | "land";
type TxType = "rent" | "sale";
type ContactMethod = "whatsapp" | "call" | "both";

const TYPE_OPTIONS: { id: PType; label: string; emoji: string }[] = [
  { id: "apartment", label: "Appartement", emoji: "🏢" },
  { id: "house",     label: "Maison",      emoji: "🏠" },
  { id: "studio",    label: "Studio",      emoji: "🛏️" },
  { id: "villa",     label: "Villa",       emoji: "🏡" },
  { id: "room",      label: "Chambre",     emoji: "🚪" },
  { id: "land",      label: "Terrain",     emoji: "🌿" },
];

const ROOM_OPTIONS = [0, 1, 2, 3, 4, "5+"] as const;
const COMMUNES = ["Ratoma", "Dixinn", "Matam", "Kaloum", "Matoto", "Coyah"];
const STEP_LABELS = ["Type & transaction", "Photos & prix", "Quartier", "Contact"];

interface FormState {
  type: PType | "";
  txType: TxType | "";
  photos: File[];
  price: string;
  rooms: number;
  furnished: boolean | null;
  neighborhood: string;
  locationDetail: string;
  phone: string;
  contactMethod: ContactMethod;
  latitude: number | null;
  longitude: number | null;
}


function formatGNF(raw: string): string {
  const n = parseInt(raw.replace(/\D/g, ""), 10);
  if (isNaN(n) || n === 0) return "";
  return new Intl.NumberFormat("fr-GN", { maximumFractionDigits: 0 }).format(n) + " GNF";
}

function generateTitle(type: string, rooms: number, neighborhood: string): string {
  const labels: Record<string, string> = {
    apartment: "Appartement", house: "Maison", studio: "Studio",
    villa: "Villa", room: "Chambre", land: "Terrain",
  };
  const nName = NEIGHBORHOODS.find((n) => n.id === neighborhood)?.name ?? neighborhood;
  const tLabel = labels[type] ?? type;
  if (rooms > 0 && type !== "land") {
    return `${tLabel} ${rooms} chambre${rooms > 1 ? "s" : ""} à ${nName}`;
  }
  return `${tLabel} à ${nName}`;
}

export default function PublierPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [micActive, setMicActive] = useState(false);
  const [micField, setMicField] = useState<"price" | "location" | null>(null);

  const fileInputRef   = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const [form, setForm] = useState<FormState>({
    type: "", txType: "", photos: [], price: "",
    rooms: 1, furnished: null,
    neighborhood: "", locationDetail: "",
    phone: "", contactMethod: "both",
    latitude: null, longitude: null,
  });
  const [geoState, setGeoState] = useState<"idle" | "loading" | "done" | "error">("idle");

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/connexion?redirect=/publier");
    }
  }, [authLoading, user, router]);

  // Pre-fill phone from profile
  useEffect(() => {
    if (profile?.phone) setForm((f) => ({ ...f, phone: profile.phone! }));
  }, [profile]);

  function update<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function addPhotos(files: FileList | null) {
    if (!files) return;
    const BLOCKED = ["image/avif", "image/heic", "image/heif"];
    const all = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const blocked = all.filter((f) => BLOCKED.includes(f.type));
    if (blocked.length) {
      toast(
        `Format non supporté (${blocked.map((f) => f.type.split("/")[1].toUpperCase()).join(", ")}). Utilisez JPG, PNG ou WebP.`,
        "error"
      );
    }
    const accepted = all.filter((f) => !BLOCKED.includes(f.type));
    if (!accepted.length) return;
    const previews = accepted.map((f) => URL.createObjectURL(f));
    setForm((f) => ({ ...f, photos: [...f.photos, ...accepted] }));
    setPhotoPreviews((p) => [...p, ...previews]);
  }

  function removePhoto(i: number) {
    URL.revokeObjectURL(photoPreviews[i]);
    setForm((f) => ({ ...f, photos: f.photos.filter((_, idx) => idx !== i) }));
    setPhotoPreviews((p) => p.filter((_, idx) => idx !== i));
  }

  function toggleMic(field: "price" | "location") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast("Micro non supporté sur ce navigateur", "error"); return; }

    if (micActive) { recognitionRef.current?.stop(); return; }

    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.lang = "fr-FR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => { setMicActive(true); setMicField(field); };
    recognition.onend   = () => { setMicActive(false); setMicField(null); };
    recognition.onerror = () => { setMicActive(false); setMicField(null); toast("Erreur micro", "error"); };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      const text: string = e.results[0][0].transcript;
      if (field === "price") {
        const digits = text.replace(/\D/g, "");
        if (digits) update("price", digits);
      } else {
        update("locationDetail", text);
      }
    };
    recognition.start();
  }

  function handleGeolocate() {
    if (!navigator.geolocation) {
      toast("Géolocalisation non supportée sur ce navigateur.", "error");
      return;
    }
    setGeoState("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update("latitude", pos.coords.latitude);
        update("longitude", pos.coords.longitude);
        setGeoState("done");
      },
      () => {
        setGeoState("error");
        toast("Position refusée ou indisponible.", "error");
      },
      { timeout: 10_000, maximumAge: 60_000 }
    );
  }

  async function handleSubmit() {
    if (!user || !supabase) return;
    setSubmitting(true);

    try {
      // 1. Upload photos to Supabase Storage
      const uploadedUrls: string[] = [];
      for (let i = 0; i < form.photos.length; i++) {
        const file = form.photos[i];
        const ext  = file.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${Date.now()}-${i}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("property-images")
          .upload(path, file, { upsert: false, contentType: file.type });
        if (upErr) {
          console.error("[upload] error:", JSON.stringify(upErr));
          const msg = upErr.message ?? JSON.stringify(upErr);
          toast(`Erreur upload : ${msg}`, "error");
          setSubmitting(false);
          return;
        }
        const { data: { publicUrl } } = supabase.storage.from("property-images").getPublicUrl(path);
        uploadedUrls.push(publicUrl);
      }
      if (uploadedUrls.length === 0) {
        toast("Aucune photo uploadée — réessayez.", "error");
        setSubmitting(false);
        return;
      }

      // 2. Insert into properties
      const priceNum = parseInt(form.price.replace(/\D/g, ""), 10);
      const title    = generateTitle(form.type, form.rooms, form.neighborhood);
      const { data: property, error: insertErr } = await supabase
        .from("properties")
        .insert({
          title,
          description:         form.locationDetail || "",
          type:                form.type,
          transaction_type:    form.txType,
          price:               priceNum,
          price_period:        form.txType === "rent" ? "month" : "total",
          rooms:               form.rooms,
          bathrooms:           0,
          surface:             null,
          furnished:           form.furnished ?? false,
          available_now:       true,
          neighborhood:        form.neighborhood,
          city:                "Conakry",
          status:              "active",
          contact_phone:       form.phone,
          contact_preference:  form.contactMethod,
          owner_id:            user.id,
          features:            [],
          is_boosted:          false,
          views:               0,
          whatsapp_clicks:     0,
          latitude:            form.latitude,
          longitude:           form.longitude,
        })
        .select("id")
        .single();

      if (insertErr || !property) {
        console.error(insertErr);
        toast("Erreur lors de la publication", "error");
        setSubmitting(false);
        return;
      }

      // 3. Insert images
      await supabase.from("property_images").insert(
        uploadedUrls.map((url, i) => ({
          property_id: property.id,
          url,
          alt:        title,
          is_primary: i === 0,
          sort_order: i,
        }))
      );

      toast("✅ Votre annonce est en ligne !", "success");
      router.push(`/annonces/${property.id}`);
    } catch (err) {
      console.error(err);
      toast("Une erreur est survenue", "error");
      setSubmitting(false);
    }
  }

  const canAdvance =
    step === 1 ? !!form.type && !!form.txType :
    step === 2 ? form.photos.length >= 1 && !!form.price :
    step === 3 ? !!form.neighborhood :
    !!form.phone;

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return null;

  const typeLabel        = TYPE_OPTIONS.find((t) => t.id === form.type)?.label ?? "";
  const typeEmoji        = TYPE_OPTIONS.find((t) => t.id === form.type)?.emoji ?? "";
  const neighborhoodName = NEIGHBORHOODS.find((n) => n.id === form.neighborhood)?.name ?? "";
  const priceFormatted   = formatGNF(form.price);

  return (
    <div className="max-w-xl mx-auto px-4 pt-4 pb-40">

      {/* ── Progress ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Étape {step}&nbsp;/&nbsp;4
          </p>
          <p className="text-xs text-slate-400">{STEP_LABELS[step - 1]}</p>
        </div>
        <div className="relative h-2 bg-slate-100 dark:bg-[#2a3040] rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-[#F97316] rounded-full transition-all duration-500"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
        <div className="flex gap-1 mt-2">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className={cn(
                "flex-1 h-1 rounded-full transition-colors duration-300",
                n <= step ? "bg-[#F97316]" : "bg-slate-200 dark:bg-[#2a3040]"
              )}
            />
          ))}
        </div>
      </div>

      {/* ── STEP 1 : Type + Transaction ── */}
      {step === 1 && (
        <div className="space-y-8 animate-fadeIn">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
              Quel type de bien ?
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Sélectionnez le type de logement
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {TYPE_OPTIONS.map((t) => (
              <button
                key={t.id}
                onClick={() => update("type", t.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-5 rounded-2xl border-2 font-semibold text-sm transition-all active:scale-95",
                  form.type === t.id
                    ? "border-[#F97316] bg-orange-50 dark:bg-orange-900/20 text-[#F97316]"
                    : "border-slate-200 dark:border-[#2a3040] bg-white dark:bg-[#1e2430] text-slate-700 dark:text-slate-300 hover:border-[#F97316]/40"
                )}
              >
                <span className="text-4xl leading-none">{t.emoji}</span>
                {t.label}
              </button>
            ))}
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
              Location ou vente ?
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {([
                { id: "rent" as TxType, label: "🔑 Location", sub: "Louer mon bien" },
                { id: "sale" as TxType, label: "💰 Vente",    sub: "Vendre mon bien" },
              ] as const).map((tx) => (
                <button
                  key={tx.id}
                  onClick={() => update("txType", tx.id)}
                  className={cn(
                    "flex flex-col items-start p-4 rounded-2xl border-2 text-left transition-all active:scale-95",
                    form.txType === tx.id
                      ? "border-[#F97316] bg-orange-50 dark:bg-orange-900/20"
                      : "border-slate-200 dark:border-[#2a3040] bg-white dark:bg-[#1e2430] hover:border-[#F97316]/40"
                  )}
                >
                  <p className={cn("font-bold text-base", form.txType === tx.id ? "text-[#F97316]" : "text-slate-900 dark:text-white")}>
                    {tx.label}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{tx.sub}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2 : Photos + Prix + Chambres + Meublé ── */}
      {step === 2 && (
        <div className="space-y-7 animate-fadeIn">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
              Photos &amp; prix
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Minimum 1 photo obligatoire pour continuer
            </p>
          </div>

          {/* Photo grid */}
          {photoPreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {photoPreviews.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-[#1e2430]">
                  <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="120px" />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 bg-[#F97316] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                      Principale
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upload buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-[#2a3040] text-slate-600 dark:text-slate-300 hover:border-[#F97316] hover:text-[#F97316] transition-colors text-sm font-semibold"
            >
              <Upload className="w-4 h-4" />
              Galerie
            </button>
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-[#2a3040] text-slate-600 dark:text-slate-300 hover:border-[#F97316] hover:text-[#F97316] transition-colors text-sm font-semibold"
            >
              <Camera className="w-4 h-4" />
              Prendre une photo
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="hidden"
            onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }}
          />

          {/* Price */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Prix {form.txType === "rent" ? "(par mois)" : ""} <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                id="price"
                name="price"
                type="number"
                inputMode="numeric"
                placeholder="Ex: 1500000"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
                className="w-full bg-white dark:bg-[#1e2430] border border-slate-200 dark:border-[#2a3040] rounded-xl px-4 py-3 pr-12 text-slate-900 dark:text-white font-semibold text-base focus:outline-none focus:ring-2 focus:ring-[#F97316]/50"
              />
              <button
                onClick={() => toggleMic("price")}
                title="Dicter le prix"
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                  micActive && micField === "price"
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-slate-100 dark:bg-[#2a3040] text-slate-500 dark:text-slate-400 hover:text-[#F97316]"
                )}
              >
                {micActive && micField === "price"
                  ? <MicOff className="w-4 h-4" />
                  : <Mic className="w-4 h-4" />}
              </button>
            </div>
            {priceFormatted && (
              <p className="text-[#F97316] font-bold text-sm mt-2 ml-1">
                {priceFormatted}{form.txType === "rent" ? "/mois" : ""}
              </p>
            )}
            {micActive && micField === "price" && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1.5 ml-1">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse inline-block" />
                Parlez le montant…
              </p>
            )}
          </div>

          {/* Rooms */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Nombre de chambres
            </label>
            <div className="flex gap-2 flex-wrap">
              {ROOM_OPTIONS.map((r) => {
                const val = r === "5+" ? 5 : (r as number);
                return (
                  <button
                    key={String(r)}
                    onClick={() => update("rooms", val)}
                    className={cn(
                      "w-12 h-12 rounded-xl border-2 font-bold text-sm transition-all",
                      form.rooms === val
                        ? "border-[#F97316] bg-orange-50 dark:bg-orange-900/20 text-[#F97316]"
                        : "border-slate-200 dark:border-[#2a3040] bg-white dark:bg-[#1e2430] text-slate-600 dark:text-slate-300 hover:border-[#F97316]/40"
                    )}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Furnished */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Meublé ?
            </label>
            <div className="flex gap-3">
              {([
                { val: true,  label: "🛋️ Oui" },
                { val: false, label: "🪑 Non" },
              ] as const).map((f) => (
                <button
                  key={String(f.val)}
                  onClick={() => update("furnished", f.val)}
                  className={cn(
                    "flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all",
                    form.furnished === f.val
                      ? "border-[#F97316] bg-orange-50 dark:bg-orange-900/20 text-[#F97316]"
                      : "border-slate-200 dark:border-[#2a3040] bg-white dark:bg-[#1e2430] text-slate-600 dark:text-slate-300 hover:border-[#F97316]/40"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3 : Quartier ── */}
      {step === 3 && (
        <div className="space-y-7 animate-fadeIn">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
              Où se trouve le bien ?
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Sélectionnez le quartier à Conakry
            </p>
          </div>

          {/* Neighborhood select */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Quartier <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                id="neighborhood"
                name="neighborhood"
                value={form.neighborhood}
                onChange={(e) => update("neighborhood", e.target.value)}
                className="w-full bg-white dark:bg-[#1e2430] border border-slate-200 dark:border-[#2a3040] rounded-xl pl-9 pr-4 py-3 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#F97316]/50 appearance-none"
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
          </div>

          {/* GPS button */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Coordonnées GPS{" "}
              <span className="text-slate-400 font-normal">(optionnel — améliore la recherche)</span>
            </label>
            <button
              type="button"
              onClick={handleGeolocate}
              disabled={geoState === "loading"}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition-all",
                geoState === "done"
                  ? "border-green-400 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                  : geoState === "error"
                  ? "border-red-300 bg-red-50 dark:bg-red-900/10 text-red-500"
                  : "border-slate-200 dark:border-[#2a3040] bg-white dark:bg-[#1e2430] text-slate-600 dark:text-slate-300 hover:border-[#F97316] hover:text-[#F97316]"
              )}
            >
              {geoState === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
              {geoState === "done" && <CheckCircle2 className="w-4 h-4" />}
              {geoState !== "loading" && geoState !== "done" && <Locate className="w-4 h-4" />}
              {geoState === "loading" && "Localisation en cours…"}
              {geoState === "done" && `Position capturée (${form.latitude?.toFixed(4)}, ${form.longitude?.toFixed(4)})`}
              {geoState === "error" && "Position refusée — réessayer"}
              {geoState === "idle" && "Utiliser ma position actuelle"}
            </button>
          </div>

          {/* Location detail + mic */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Précision sur l&apos;emplacement{" "}
              <span className="text-slate-400 font-normal">(optionnel)</span>
            </label>
            <div className="relative">
              <textarea
                id="locationDetail"
                name="locationDetail"
                value={form.locationDetail}
                onChange={(e) => update("locationDetail", e.target.value)}
                placeholder="Ex : près du carrefour, derrière la mosquée…"
                rows={3}
                className="w-full bg-white dark:bg-[#1e2430] border border-slate-200 dark:border-[#2a3040] rounded-xl px-4 py-3 pr-12 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F97316]/50 resize-none"
              />
              <button
                onClick={() => toggleMic("location")}
                title="Dicter la description"
                className={cn(
                  "absolute right-3 top-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                  micActive && micField === "location"
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-slate-100 dark:bg-[#2a3040] text-slate-500 dark:text-slate-400 hover:text-[#F97316]"
                )}
              >
                {micActive && micField === "location"
                  ? <MicOff className="w-4 h-4" />
                  : <Mic className="w-4 h-4" />}
              </button>
            </div>
            {micActive && micField === "location" && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1.5 ml-1">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse inline-block" />
                Parlez maintenant…
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 4 : Contact + Récapitulatif + Publier ── */}
      {step === 4 && (
        <div className="space-y-7 animate-fadeIn">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
              Contact &amp; publication
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Le numéro que les locataires verront
            </p>
          </div>

          {/* Summary */}
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/30 rounded-2xl p-4">
            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-3">
              Récapitulatif
            </p>
            <div className="flex flex-wrap gap-2">
              {form.type && (
                <span className="bg-white dark:bg-[#1e2430] text-slate-700 dark:text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 dark:border-[#2a3040]">
                  {typeEmoji} {typeLabel}
                </span>
              )}
              {form.txType && (
                <span className="bg-white dark:bg-[#1e2430] text-slate-700 dark:text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 dark:border-[#2a3040]">
                  {form.txType === "rent" ? "🔑 Location" : "💰 Vente"}
                </span>
              )}
              {form.neighborhood && (
                <span className="bg-white dark:bg-[#1e2430] text-slate-700 dark:text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 dark:border-[#2a3040]">
                  📍 {neighborhoodName}
                </span>
              )}
              {priceFormatted && (
                <span className="bg-white dark:bg-[#1e2430] text-[#F97316] text-xs font-bold px-3 py-1.5 rounded-full border border-orange-200 dark:border-orange-700/30">
                  {priceFormatted}{form.txType === "rent" ? "/mois" : ""}
                </span>
              )}
              {form.photos.length > 0 && (
                <span className="bg-white dark:bg-[#1e2430] text-slate-700 dark:text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 dark:border-[#2a3040]">
                  📸 {form.photos.length} photo{form.photos.length > 1 ? "s" : ""}
                </span>
              )}
              {form.rooms > 0 && form.type !== "land" && (
                <span className="bg-white dark:bg-[#1e2430] text-slate-700 dark:text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 dark:border-[#2a3040]">
                  🛏️ {form.rooms === 5 ? "5+" : form.rooms} ch.
                </span>
              )}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Numéro de téléphone <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="+224 6XX XX XX XX"
                className="w-full bg-white dark:bg-[#1e2430] border border-slate-200 dark:border-[#2a3040] rounded-xl pl-9 pr-4 py-3 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#F97316]/50"
              />
            </div>
          </div>

          {/* Contact method */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
              Comment souhaitez-vous être contacté ?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: "whatsapp" as ContactMethod, label: "WhatsApp", emoji: "💬" },
                { id: "call"     as ContactMethod, label: "Appel",    emoji: "📞" },
                { id: "both"     as ContactMethod, label: "Les deux", emoji: "✅" },
              ] as const).map((c) => (
                <button
                  key={c.id}
                  onClick={() => update("contactMethod", c.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 py-3.5 rounded-xl border-2 font-semibold text-xs transition-all",
                    form.contactMethod === c.id
                      ? "border-[#F97316] bg-orange-50 dark:bg-orange-900/20 text-[#F97316]"
                      : "border-slate-200 dark:border-[#2a3040] bg-white dark:bg-[#1e2430] text-slate-600 dark:text-slate-300 hover:border-[#F97316]/40"
                  )}
                >
                  <span className="text-2xl">{c.emoji}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Publish button */}
          <button
            onClick={handleSubmit}
            disabled={!form.phone || submitting}
            className="w-full bg-[#F97316] hover:bg-[#EA6C0A] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 px-6 rounded-2xl text-base transition-colors shadow-[0_8px_32px_rgba(249,115,22,0.35)] flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
                Publication en cours…
              </>
            ) : (
              "🚀 Publier mon annonce"
            )}
          </button>

          <p className="text-slate-400 text-xs text-center leading-relaxed">
            En publiant, vous acceptez que votre annonce soit visible par tous les visiteurs de GuImmo.
          </p>
        </div>
      )}

      {/* ── Bottom navigation bar ── */}
      <div className="fixed bottom-16 left-0 right-0 bg-white/95 dark:bg-[#111418]/95 backdrop-blur border-t border-slate-100 dark:border-[#2a3040] px-4 py-3 z-40">
        <div className="max-w-xl mx-auto flex gap-3">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-[#2a3040] text-slate-600 dark:text-slate-300 font-semibold text-sm hover:border-[#F97316] hover:text-[#F97316] transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour
            </button>
          ) : (
            <div className="w-24" />
          )}

          {step < 4 && (
            <button
              onClick={() => { if (canAdvance) setStep((s) => s + 1); }}
              disabled={!canAdvance}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all",
                canAdvance
                  ? "bg-[#F97316] hover:bg-[#EA6C0A] text-white shadow-[0_4px_20px_rgba(249,115,22,0.3)]"
                  : "bg-slate-100 dark:bg-[#1e2430] text-slate-400 dark:text-slate-500 cursor-not-allowed"
              )}
            >
              Continuer
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
