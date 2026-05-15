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

interface TourRoom {
  id: string;
  name: string;
  file: File | null;
  preview: string | null;
}

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
  waterSource: string;
  electricity: string;
  internet: string;
  hasParking: boolean;
  hasSecurity: boolean;
  hasFence: boolean;
  hasAc: boolean;
  kitchenEquipped: boolean;
  floorNumber: number;
  hasVirtualTour: boolean;
  tourRooms: TourRoom[];
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
  const videoInputRef  = useRef<HTMLInputElement>(null);
  const [videoFile, setVideoFile]         = useState<File | null>(null);
  const [videoPreview, setVideoPreview]   = useState<string | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tourInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const [form, setForm] = useState<FormState>({
    type: "", txType: "", photos: [], price: "",
    rooms: 1, furnished: null,
    neighborhood: "", locationDetail: "",
    phone: "", contactMethod: "both",
    latitude: null, longitude: null,
    waterSource: "robinet", electricity: "edg", internet: "none",
    hasParking: false, hasSecurity: false, hasFence: false,
    hasAc: false, kitchenEquipped: false, floorNumber: 0,
    hasVirtualTour: false,
    tourRooms: [{ id: crypto.randomUUID(), name: "Salon", file: null, preview: null }],
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

  function handleVideoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { toast("Vidéo trop lourde (max 50 Mo)", "error"); return; }
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    e.target.value = "";
  }

  function addTourRoom() {
    if (form.tourRooms.length >= 10) return;
    setForm((f) => ({
      ...f,
      tourRooms: [...f.tourRooms, { id: crypto.randomUUID(), name: "", file: null, preview: null }],
    }));
  }

  function removeTourRoom(id: string) {
    setForm((f) => {
      const room = f.tourRooms.find((r) => r.id === id);
      if (room?.preview) URL.revokeObjectURL(room.preview);
      return { ...f, tourRooms: f.tourRooms.filter((r) => r.id !== id) };
    });
  }

  function updateTourRoomName(id: string, name: string) {
    setForm((f) => ({
      ...f,
      tourRooms: f.tourRooms.map((r) => (r.id === id ? { ...r, name } : r)),
    }));
  }

  function handleTourRoomFile(id: string, file: File | null) {
    if (!file) return;
    setForm((f) => {
      const room = f.tourRooms.find((r) => r.id === id);
      if (room?.preview) URL.revokeObjectURL(room.preview);
      return {
        ...f,
        tourRooms: f.tourRooms.map((r) =>
          r.id === id ? { ...r, file, preview: URL.createObjectURL(file) } : r
        ),
      };
    });
  }

  async function testInsert() {
    if (!supabase) return;
    const { data: { user: u }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !u) {
      setError(`TEST: non connecté — ${authErr?.message ?? "user null"}`);
      return;
    }
    console.log("=== TEST INSERT MINIMAL ===", "uid:", u.id);
    const { data, error: e } = await supabase
      .from("properties")
      .insert({
        title: "TEST",
        type: "apartment",
        transaction_type: "rent",
        price: 1,
        neighborhood: "kipe",
        city: "Conakry",
        status: "active",
        owner_id: u.id,
      })
      .select("id")
      .single();
    if (e) {
      console.error("TEST INSERT ÉCHOUÉ:", { code: e.code, message: e.message, details: e.details, hint: e.hint });
      setError(`TEST INSERT ÉCHOUÉ: ${e.message} | code=${e.code} | ${e.details ?? ""} | ${e.hint ?? ""}`);
    } else {
      console.log("TEST INSERT OK — id:", data?.id);
      await supabase.from("properties").delete().eq("id", data!.id);
      setError(null);
      toast("TEST INSERT OK ✓", "success");
    }
  }

  async function testInsertSansPhotos() {
    if (!supabase) return;
    const { data: { user: u }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !u) {
      setError(`TEST SANS PHOTOS: non connecté — ${authErr?.message ?? "user null"}`);
      return;
    }
    const priceNum = parseInt(form.price.replace(/\D/g, ""), 10) || 1000000;
    const testPayload = {
      owner_id:         u.id,
      title:            generateTitle(form.type || "apartment", form.rooms, form.neighborhood || "kipe"),
      transaction_type: form.txType || "rent",
      type:             form.type || "apartment",
      price:            priceNum,
      neighborhood:     form.neighborhood || "kipe",
      status:           "active",
      available_now:    true,
      city:             "Conakry",
    };
    console.log("=== TEST SANS PHOTOS ===", testPayload);
    const { data, error: e } = await supabase
      .from("properties")
      .insert(testPayload)
      .select("id")
      .single();
    if (e) {
      console.error("TEST SANS PHOTOS ÉCHOUÉ:", e);
      setError(`TEST SANS PHOTOS ÉCHOUÉ: ${e.message} | code=${e.code} | ${e.details ?? ""} | ${e.hint ?? ""}`);
    } else {
      console.log("TEST SANS PHOTOS OK — id:", data?.id);
      await supabase.from("properties").delete().eq("id", data!.id);
      setError(null);
      toast("TEST SANS PHOTOS OK ✓ — le problème vient du storage", "success");
    }
  }

  async function handleSubmit() {
    if (!supabase) {
      toast("Service non disponible, réessayez plus tard", "error");
      return;
    }

    // Re-fetch user fresh from Supabase (context cache may be stale on mobile)
    const { data: { user: freshUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !freshUser) {
      console.error("AUTH ERROR:", authError);
      setError("Vous devez être connecté pour publier");
      router.push("/connexion?redirect=/publier");
      return;
    }
    console.log("USER ID:", freshUser.id);
    console.log("USER EMAIL:", freshUser.email);

    if (form.photos.length === 0) {
      toast("Veuillez ajouter au moins une photo", "error");
      return;
    }
    const priceNum = parseInt(form.price.replace(/\D/g, ""), 10);
    if (!priceNum || isNaN(priceNum) || priceNum <= 0) {
      toast("Veuillez saisir un prix valide", "error");
      return;
    }

    setError(null);

    // Validate required fields before hitting the DB
    const requiredFields: Record<string, unknown> = {
      owner_id: freshUser.id,
      title: generateTitle(form.type, form.rooms, form.neighborhood),
      type: form.type,
      transaction_type: form.txType,
      price: priceNum,
      neighborhood: form.neighborhood,
    };
    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value && value !== 0) {
        const msg = `Champ obligatoire manquant: ${key}`;
        setError(msg);
        toast(msg, "error");
        return;
      }
    }

    setSubmitting(true);

    try {
      // 1. Upload photos to Supabase Storage
      const uploadedUrls: string[] = [];
      for (let i = 0; i < form.photos.length; i++) {
        const file = form.photos[i];
        const ext  = file.name.split(".").pop() ?? "jpg";
        const path = `${freshUser.id}/${Date.now()}-${i}.${ext}`;
        console.log(`[upload photo ${i}] bucket=property-images path=${path} size=${file.size} type=${file.type}`);
        const { error: upErr } = await supabase.storage
          .from("property-images")
          .upload(path, file, { upsert: false, contentType: file.type });
        if (upErr) {
          console.error(`[upload photo ${i}] ERREUR:`, upErr.message, upErr);
          setError(`Upload photo ${i + 1} échoué: ${upErr.message}`);
          // Non-blocking: continue trying remaining photos
          continue;
        }
        const { data: { publicUrl } } = supabase.storage.from("property-images").getPublicUrl(path);
        console.log(`[upload photo ${i}] OK → ${publicUrl}`);
        uploadedUrls.push(publicUrl);
      }
      if (uploadedUrls.length === 0) {
        const msg = "Aucune photo uploadée — vérifiez le bucket 'property-images' et ses policies.";
        setError(msg);
        toast(msg, "error");
        setSubmitting(false);
        return;
      }
      setError(null);

      // 1b. Upload video if present (non-blocking — failure skips video)
      let videoUrl: string | null = null;
      if (videoFile) {
        setVideoUploading(true);
        const ext  = videoFile.name.split(".").pop() ?? "mp4";
        const path = `videos/${freshUser.id}/${Date.now()}.${ext}`;
        const { error: vErr } = await supabase.storage
          .from("listings")
          .upload(path, videoFile, { upsert: false, contentType: videoFile.type });
        setVideoUploading(false);
        if (vErr) {
          console.error("[upload video] error:", JSON.stringify(vErr, null, 2));
          toast(`Erreur upload vidéo (annonce publiée sans vidéo) : ${vErr.message ?? ""}`, "error");
        } else {
          const { data: { publicUrl } } = supabase.storage.from("listings").getPublicUrl(path);
          videoUrl = publicUrl;
        }
      }

      // 2. Insert into properties
      const title    = generateTitle(form.type, form.rooms, form.neighborhood);
      console.log("=== DEBUT PUBLICATION ===");
      console.log("User:", freshUser.id, freshUser.email);

      const payload = {
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
        video_url:           videoUrl,
        owner_id:            freshUser.id,
        features:            [],
        is_boosted:          false,
        views:               0,
        whatsapp_clicks:     0,
        latitude:            form.latitude,
        longitude:           form.longitude,
        water_source:        form.waterSource || "robinet",
        electricity:         form.electricity || "edg",
        internet:            form.internet || "none",
        has_parking:         form.hasParking,
        has_security:        form.hasSecurity,
        has_fence:           form.hasFence,
        has_ac:              form.hasAc,
        kitchen_equipped:    form.kitchenEquipped,
        floor_number:        form.floorNumber,
      };

      console.log("owner_id dans payload:", payload.owner_id, typeof payload.owner_id);
      console.log("Payload complet:", JSON.stringify(payload, null, 2));

      const { data: property, error: insertErr } = await supabase
        .from("properties")
        .insert(payload)
        .select("id")
        .single();

      if (insertErr || !property) {
        console.error("ERREUR SUPABASE INSERT");
        console.error("CODE:", insertErr?.code);
        console.error("MESSAGE:", insertErr?.message);
        console.error("DETAILS:", insertErr?.details);
        console.error("HINT:", insertErr?.hint);
        console.error("PAYLOAD ENVOYÉ:", JSON.stringify(payload, null, 2));
        const fullMsg = `${insertErr?.message ?? "Erreur inconnue"} | code=${insertErr?.code ?? "?"} | ${insertErr?.details ?? ""} | ${insertErr?.hint ?? ""}`.replace(/\s*\|\s*$/, "");
        setError(fullMsg);
        toast(`Erreur publication : ${insertErr?.message ?? "réessayez"}`, "error");
        setSubmitting(false);
        return;
      }

      // 3. Insert images
      const { error: imgErr } = await supabase.from("property_images").insert(
        uploadedUrls.map((url, i) => ({
          property_id: property.id,
          url,
          alt:        title,
          is_primary: i === 0,
          sort_order: i,
        }))
      );
      if (imgErr) {
        console.error("ERREUR INSERT IMAGES:", JSON.stringify(imgErr, null, 2));
      }

      // 4. Virtual tour upload (non-blocking — failure skips VT gracefully)
      if (form.hasVirtualTour) {
        const roomsWithFile = form.tourRooms.filter((r) => r.file && r.name.trim());
        if (roomsWithFile.length > 0) {
          const vtRecords: { property_id: string; url: string; room_name: string; sort_order: number }[] = [];
          for (let i = 0; i < roomsWithFile.length; i++) {
            const room = roomsWithFile[i];
            const ext  = room.file!.name.split(".").pop() ?? "jpg";
            const path = `virtual_tours/${property.id}/${i}-${room.id}.${ext}`;
            const { error: vtUpErr } = await supabase.storage
              .from("listings")
              .upload(path, room.file!, { upsert: false, contentType: room.file!.type });
            if (vtUpErr) {
              console.error("[VT upload] error:", JSON.stringify(vtUpErr, null, 2));
              continue;
            }
            const { data: { publicUrl } } = supabase.storage.from("listings").getPublicUrl(path);
            vtRecords.push({ property_id: property.id, url: publicUrl, room_name: room.name.trim(), sort_order: i });
          }
          if (vtRecords.length > 0) {
            const { error: vtInsErr } = await supabase.from("virtual_tour_images").insert(vtRecords);
            if (vtInsErr) {
              console.error("ERREUR INSERT VT:", JSON.stringify(vtInsErr, null, 2));
            } else {
              await supabase.from("properties").update({ has_virtual_tour: true }).eq("id", property.id);
            }
          }
        }
      }

      toast("✅ Votre annonce est en ligne !", "success");
      router.push(`/annonces/${property.id}`);
    } catch (err) {
      console.error("ERREUR INATTENDUE:", err);
      toast("Une erreur inattendue est survenue", "error");
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
        <div className="w-8 h-8 border-2 border-white/40 border-t-transparent rounded-full animate-spin" />
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
          <p className="text-sm font-bold text-white">
            Étape {step}&nbsp;/&nbsp;4
          </p>
          <p className="text-xs text-white/40">{STEP_LABELS[step - 1]}</p>
        </div>
        <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-white/70 rounded-full transition-all duration-500"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
        <div className="flex gap-1 mt-2">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className={cn(
                "flex-1 h-1 rounded-full transition-colors duration-300",
                n <= step ? "bg-white/70" : "bg-white/10"
              )}
            />
          ))}
        </div>
      </div>

      {/* ── STEP 1 : Type + Transaction ── */}
      {step === 1 && (
        <div className="space-y-8 animate-fadeIn">
          <div>
            <h1 className="text-2xl font-black text-white mb-1">
              Quel type de bien ?
            </h1>
            <p className="text-white/50 text-sm">
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
                    ? "border-white/40 text-white"
                    : "hover:border-white/30 text-white"
                )}
              >
                <span className="text-4xl leading-none">{t.emoji}</span>
                {t.label}
              </button>
            ))}
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-3">
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
                      ? "border-[#c8901e] bg-[rgba(200,144,30,0.12)]"
                      : "hover:border-white/30"
                  )}
                >
                  <p className="font-bold text-base text-white">
                    {tx.label}
                  </p>
                  <p className="text-xs text-white/50 mt-0.5">{tx.sub}</p>
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
            <h1 className="text-2xl font-black text-white mb-1">
              Photos &amp; prix
            </h1>
            <p className="text-white/50 text-sm">
              Minimum 1 photo obligatoire pour continuer
            </p>
          </div>

          {/* Photo grid */}
          {photoPreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {photoPreviews.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-white/5">
                  <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="120px" />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none" style={{ background: "rgba(255,255,255,0.25)" }}>
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
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-dashed border-white/20 text-white/70 hover:border-white/40 hover:text-white transition-colors text-sm font-semibold"
            >
              <Upload className="w-4 h-4" />
              Galerie
            </button>
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-dashed border-white/20 text-white/70 hover:border-white/40 hover:text-white transition-colors text-sm font-semibold"
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
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={handleVideoSelect}
          />

          {/* Video upload */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              🎥 Vidéo de visite <span className="text-white/40 font-normal">(optionnel — max 60 s, 50 Mo)</span>
            </label>
            {videoUploading && (
              <div style={{ background: "rgba(200,144,30,0.10)", border: "1px solid rgba(200,144,30,0.25)", borderRadius: 10, padding: "10px 14px", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 14, height: 14, border: "2px solid #c8901e", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "#c8901e", fontWeight: 600 }}>Upload vidéo en cours…</span>
                </div>
                <div style={{ height: 4, background: "rgba(200,144,30,0.15)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: "60%", background: "#c8901e", borderRadius: 4, animation: "progressPulse 1.5s ease-in-out infinite" }} />
                </div>
              </div>
            )}
            {videoPreview ? (
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                <video src={videoPreview} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { URL.revokeObjectURL(videoPreview); setVideoPreview(null); setVideoFile(null); }}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/70 rounded-full flex items-center justify-center text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-dashed border-white/20 text-white/60 hover:border-white/40 hover:text-white transition-colors text-sm font-semibold"
                style={{ minHeight: 52 }}
              >
                🎥 Ajouter une vidéo
              </button>
            )}
          </div>

          {/* Virtual Tour */}
          <div>
            <div style={{
              background: "linear-gradient(135deg, #1a2e1e 0%, #0d1610 100%)",
              border: "1px solid rgba(200,144,30,0.30)",
              borderRadius: 14, padding: "14px 16px",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: form.hasVirtualTour ? 14 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>🏠</span>
                  <div>
                    <p style={{ color: "#f7f2e6", fontWeight: 700, fontSize: 13, marginBottom: 1 }}>Visite virtuelle</p>
                    <p style={{ color: "rgba(240,230,204,0.45)", fontSize: 11 }}>Photos par pièce · max 10 pièces</p>
                  </div>
                </div>
                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, hasVirtualTour: !f.hasVirtualTour }))}
                  style={{
                    width: 44, height: 24, borderRadius: 12, border: "none",
                    background: form.hasVirtualTour ? "#c8901e" : "rgba(255,255,255,0.12)",
                    position: "relative", cursor: "pointer", flexShrink: 0, transition: "background 0.2s",
                  }}
                >
                  <span style={{
                    position: "absolute", top: 3, width: 18, height: 18, borderRadius: 9,
                    background: "#fff", transition: "left 0.2s",
                    left: form.hasVirtualTour ? 23 : 3,
                  }} />
                </button>
              </div>

              {form.hasVirtualTour && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {form.tourRooms.map((room, i) => (
                    <div key={room.id} style={{
                      background: "rgba(240,230,204,0.04)", border: "1px solid rgba(240,230,204,0.10)",
                      borderRadius: 10, padding: "10px 12px",
                      display: "flex", alignItems: "center", gap: 10,
                    }}>
                      {/* Thumb or upload button */}
                      <button
                        type="button"
                        onClick={() => tourInputRefs.current[room.id]?.click()}
                        style={{
                          width: 52, height: 52, borderRadius: 8, flexShrink: 0,
                          background: room.preview ? "transparent" : "rgba(200,144,30,0.10)",
                          border: room.preview ? "none" : "1px dashed rgba(200,144,30,0.40)",
                          overflow: "hidden", cursor: "pointer", position: "relative",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        {room.preview
                          /* eslint-disable-next-line @next/next/no-img-element */
                          ? <img src={room.preview} alt={room.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <span style={{ fontSize: 20 }}>📷</span>
                        }
                      </button>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        ref={(el) => { tourInputRefs.current[room.id] = el; }}
                        onChange={(e) => { handleTourRoomFile(room.id, e.target.files?.[0] ?? null); e.target.value = ""; }}
                      />

                      {/* Room name */}
                      <input
                        type="text"
                        value={room.name}
                        placeholder={`Pièce ${i + 1} (ex: Salon)`}
                        maxLength={30}
                        onChange={(e) => updateTourRoomName(room.id, e.target.value)}
                        style={{
                          flex: 1, background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.10)", borderRadius: 8,
                          padding: "8px 10px", color: "#f7f2e6", fontSize: 13,
                          outline: "none",
                        }}
                      />

                      {/* Remove */}
                      {form.tourRooms.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTourRoom(room.id)}
                          style={{
                            width: 28, height: 28, borderRadius: 14, flexShrink: 0,
                            background: "rgba(239,68,68,0.15)", border: "none",
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          <X style={{ width: 14, height: 14, color: "#ef4444" }} />
                        </button>
                      )}
                    </div>
                  ))}

                  {form.tourRooms.length < 10 && (
                    <button
                      type="button"
                      onClick={addTourRoom}
                      style={{
                        width: "100%", background: "transparent", border: "1px dashed rgba(200,144,30,0.30)",
                        borderRadius: 10, padding: "10px", color: "#daa84a", fontSize: 13, fontWeight: 600,
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      }}
                    >
                      + Ajouter une pièce ({form.tourRooms.length}/10)
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">
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
                className="w-full rounded-xl px-4 py-3 pr-12 text-white font-semibold text-base focus:outline-none focus:ring-2 focus:ring-white/20"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
              />
              <button
                onClick={() => toggleMic("price")}
                title="Dicter le prix"
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                  micActive && micField === "price"
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-white/10 text-white/50 hover:text-white"
                )}
              >
                {micActive && micField === "price"
                  ? <MicOff className="w-4 h-4" />
                  : <Mic className="w-4 h-4" />}
              </button>
            </div>
            {priceFormatted && (
              <p className="text-white font-bold text-sm mt-2 ml-1">
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
            <label className="block text-sm font-bold text-white mb-2">
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
                        ? "border-white/40 text-white"
                        : "text-white/70 hover:border-white/30"
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
            <label className="block text-sm font-bold text-white mb-2">
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
                      ? "border-white/40 text-white"
                      : "text-white/70 hover:border-white/30"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Équipements essentiels ── */}
          <div>
            <p className="text-sm font-bold text-white mb-4">Équipements essentiels</p>

            {/* Eau */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-3">💧 Source d&apos;eau</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                {([
                  { id: "robinet", icon: "💧", label: "Robinet" },
                  { id: "forage",  icon: "💧", label: "Forage" },
                  { id: "citerne", icon: "💧", label: "Citerne" },
                  { id: "none",    icon: "❌", label: "Aucune" },
                ] as const).map((opt) => (
                  <button key={opt.id} type="button" onClick={() => update("waterSource", opt.id)}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      gap: 4, padding: "12px 8px", borderRadius: 10, minHeight: 70, minWidth: 70,
                      border: form.waterSource === opt.id ? "2px solid #c8901e" : "1px solid rgba(240,230,204,0.12)",
                      background: form.waterSource === opt.id ? "rgba(200,144,30,0.12)" : "#1a2e1e",
                      color: form.waterSource === opt.id ? "#c8901e" : "rgba(240,230,204,0.60)",
                      fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "border-color 0.15s",
                    }}>
                    <span style={{ fontSize: 24 }}>{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Électricité */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-3">⚡ Électricité</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                {([
                  { id: "edg",     icon: "⚡", label: "EDG" },
                  { id: "solaire", icon: "☀️", label: "Solaire" },
                  { id: "groupe",  icon: "🔋", label: "Groupe" },
                  { id: "none",    icon: "❌", label: "Aucune" },
                ] as const).map((opt) => (
                  <button key={opt.id} type="button" onClick={() => update("electricity", opt.id)}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      gap: 4, padding: "12px 8px", borderRadius: 10, minHeight: 70, minWidth: 70,
                      border: form.electricity === opt.id ? "2px solid #c8901e" : "1px solid rgba(240,230,204,0.12)",
                      background: form.electricity === opt.id ? "rgba(200,144,30,0.12)" : "#1a2e1e",
                      color: form.electricity === opt.id ? "#c8901e" : "rgba(240,230,204,0.60)",
                      fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "border-color 0.15s",
                    }}>
                    <span style={{ fontSize: 24 }}>{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Internet */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-3">📶 Internet <span className="text-white/25 font-normal normal-case tracking-normal">(optionnel)</span></label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
                {([
                  { id: "wifi", icon: "📶", label: "WiFi / Fibre" },
                  { id: "none", icon: "❌", label: "Aucun" },
                ] as const).map((opt) => (
                  <button key={opt.id} type="button" onClick={() => update("internet", opt.id)}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      gap: 4, padding: "12px 8px", borderRadius: 10, minHeight: 70,
                      border: form.internet === opt.id ? "2px solid #c8901e" : "1px solid rgba(240,230,204,0.12)",
                      background: form.internet === opt.id ? "rgba(200,144,30,0.12)" : "#1a2e1e",
                      color: form.internet === opt.id ? "#c8901e" : "rgba(240,230,204,0.60)",
                      fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "border-color 0.15s",
                    }}>
                    <span style={{ fontSize: 24 }}>{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Autres équipements */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Autres équipements <span className="text-white/25 font-normal normal-case tracking-normal">(optionnel)</span></label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                {([
                  { key: "hasParking",      icon: "🚗", label: "Parking" },
                  { key: "hasSecurity",     icon: "👮", label: "Gardien" },
                  { key: "hasFence",        icon: "🧱", label: "Clôture" },
                  { key: "hasAc",           icon: "❄️", label: "Climatisation" },
                  { key: "kitchenEquipped", icon: "🍳", label: "Cuisine équipée" },
                ] as { key: "hasParking" | "hasSecurity" | "hasFence" | "hasAc" | "kitchenEquipped"; icon: string; label: string }[]).map((opt) => {
                  const active = form[opt.key];
                  return (
                    <button key={opt.key} type="button" onClick={() => update(opt.key, !active)}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        gap: 4, padding: "12px 8px", borderRadius: 10, minHeight: 70,
                        border: active ? "2px solid #c8901e" : "1px solid rgba(240,230,204,0.12)",
                        background: active ? "rgba(200,144,30,0.12)" : "#1a2e1e",
                        color: active ? "#c8901e" : "rgba(240,230,204,0.60)",
                        fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "border-color 0.15s",
                      }}>
                      <span style={{ fontSize: 24 }}>{opt.icon}</span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Étage */}
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Étage</label>
              <select
                value={form.floorNumber}
                onChange={(e) => update("floorNumber", Number(e.target.value))}
                className="w-full rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:ring-2 focus:ring-white/20 appearance-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
              >
                <option value={0}>RDC (rez-de-chaussée)</option>
                <option value={1}>1er étage</option>
                <option value={2}>2ème étage</option>
                <option value={3}>3ème étage et plus</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3 : Quartier ── */}
      {step === 3 && (
        <div className="space-y-7 animate-fadeIn">
          <div>
            <h1 className="text-2xl font-black text-white mb-1">
              Où se trouve le bien ?
            </h1>
            <p className="text-white/50 text-sm">
              Sélectionnez le quartier à Conakry
            </p>
          </div>

          {/* Neighborhood select */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              Quartier <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                id="neighborhood"
                name="neighborhood"
                value={form.neighborhood}
                onChange={(e) => update("neighborhood", e.target.value)}
                className="w-full rounded-xl pl-9 pr-4 py-3 text-white font-medium focus:outline-none focus:ring-2 focus:ring-white/20 appearance-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
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
            <label className="block text-sm font-bold text-white mb-2">
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
                  ? "border-[#6ec97a] bg-[rgba(110,201,122,0.12)] text-[#6ec97a]"
                  : geoState === "error"
                  ? "border-red-400 bg-[rgba(239,68,68,0.10)] text-red-400"
                  : "text-white/70 hover:border-white/40 hover:text-white"
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
            <label className="block text-sm font-bold text-white mb-2">
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
                className="w-full rounded-xl px-4 py-3 pr-12 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
              />
              <button
                onClick={() => toggleMic("location")}
                title="Dicter la description"
                className={cn(
                  "absolute right-3 top-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                  micActive && micField === "location"
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-white/10 text-white/50 hover:text-white"
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
            <h1 className="text-2xl font-black text-white mb-1">
              Contact &amp; publication
            </h1>
            <p className="text-white/50 text-sm">
              Le numéro que les locataires verront
            </p>
          </div>

          {/* Summary */}
          <div className="rounded-2xl p-4 border border-[rgba(200,144,30,0.25)]" style={{ background: "rgba(200,144,30,0.08)" }}>
            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-3">
              Récapitulatif
            </p>
            <div className="flex flex-wrap gap-2">
              {form.type && (
                <span className="text-white text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.10)" }}>
                  {typeEmoji} {typeLabel}
                </span>
              )}
              {form.txType && (
                <span className="text-white text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.10)" }}>
                  {form.txType === "rent" ? "🔑 Location" : "💰 Vente"}
                </span>
              )}
              {form.neighborhood && (
                <span className="text-white text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.10)" }}>
                  📍 {neighborhoodName}
                </span>
              )}
              {priceFormatted && (
                <span className="text-white/80 text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.20)" }}>
                  {priceFormatted}{form.txType === "rent" ? "/mois" : ""}
                </span>
              )}
              {form.photos.length > 0 && (
                <span className="text-white text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.10)" }}>
                  📸 {form.photos.length} photo{form.photos.length > 1 ? "s" : ""}
                </span>
              )}
              {form.rooms > 0 && form.type !== "land" && (
                <span className="text-white text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.10)" }}>
                  🛏️ {form.rooms === 5 ? "5+" : form.rooms} ch.
                </span>
              )}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">
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
                className="w-full rounded-xl pl-9 pr-4 py-3 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-white/20"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
              />
            </div>
          </div>

          {/* Contact method */}
          <div>
            <label className="block text-sm font-bold text-white mb-3">
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
                      ? "border-white/40 text-white"
                      : "text-white/70 hover:border-white/30"
                  )}
                >
                  <span className="text-2xl">{c.emoji}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="rounded-xl p-4 text-sm font-mono break-all" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
              <p className="font-bold mb-1 text-red-400">Erreur Supabase :</p>
              {error}
            </div>
          )}

          {/* Test insert buttons (debug) */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={testInsert}
              className="flex-1 text-xs py-2 rounded-xl font-mono transition-colors"
              style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              [DEV] Test INSERT
            </button>
            <button
              type="button"
              onClick={testInsertSansPhotos}
              className="flex-1 text-xs py-2 rounded-xl font-mono transition-colors"
              style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              [DEV] Test sans photos
            </button>
          </div>

          {/* Publish button */}
          <button
            onClick={handleSubmit}
            disabled={!form.phone || submitting}
            className="w-full bg-[#c8901e] hover:bg-[#b87c18] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 px-6 rounded-2xl text-base transition-colors shadow-[0_8px_32px_rgba(249,115,22,0.35)] flex items-center justify-center gap-2"
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
            En publiant, vous acceptez que votre annonce soit visible par tous les visiteurs de BienLoger.
          </p>
        </div>
      )}

      {/* ── Bottom navigation bar ── */}
      <div className="fixed bottom-16 left-0 right-0 px-4 py-3 z-40" style={{ background: "rgba(10,10,15,0.95)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="max-w-xl mx-auto flex gap-3">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-white/70 font-semibold text-sm hover:border-white/40 hover:text-white transition-colors disabled:opacity-40" style={{ border: "1px solid rgba(255,255,255,0.12)" }}
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
                  ? "bg-[#c8901e] hover:bg-[#b87c18] text-white shadow-[0_4px_20px_rgba(249,115,22,0.3)]"
                  : "bg-white/5 text-white/30 cursor-not-allowed"
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
