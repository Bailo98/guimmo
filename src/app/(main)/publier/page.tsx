"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ChevronLeft, X, Mic, MicOff, MapPin, Phone,
  Upload, Camera, ArrowRight, Locate, CheckCircle2, Loader2,
  Armchair, Banknote, Battery, Bed, BrickWall, Building2, Calendar, Car,
  DoorOpen, Droplets, Flame, Home, KeyRound, Leaf, Lock, MessageCircle,
  Rocket, Shield, Sofa, Sun, Utensils, Video, Wifi, Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import { NEIGHBORHOODS } from "@/data/neighborhoods";
import { cn, formatPrice } from "@/lib/utils";

type PType = "apartment" | "house" | "studio" | "villa" | "room" | "land";
type TxType = "rent" | "sale";
type ContactMethod = "whatsapp" | "call" | "both";
type AvailMode = "flexible" | "immediate" | "today" | "urgent";

const AVAIL_OPTIONS: { id: AvailMode; Icon: typeof Calendar; label: string; sub: string }[] = [
  { id: "flexible",  Icon: Calendar, label: "Flexible",           sub: "À convenir" },
  { id: "immediate", Icon: Zap,      label: "Libre immédiatement", sub: "Dispo maintenant" },
  { id: "today",     Icon: Flame,    label: "Dispo aujourd'hui",   sub: "Même jour" },
  { id: "urgent",    Icon: Zap,      label: "Urgent",              sub: "À louer vite" },
];

const OWNER_BADGE_OPTIONS: { id: string; Icon: typeof Home; label: string }[] = [
  { id: "proprietaire_direct", Icon: Home,     label: "Proprio direct" },
  { id: "sans_commission",     Icon: Banknote, label: "Sans commission" },
];

const TYPE_OPTIONS: { id: PType; label: string; Icon: typeof Home }[] = [
  { id: "apartment", label: "Appartement", Icon: Building2 },
  { id: "house",     label: "Maison",      Icon: Home },
  { id: "studio",    label: "Studio",      Icon: Bed },
  { id: "villa",     label: "Villa",       Icon: Home },
  { id: "room",      label: "Chambre",     Icon: DoorOpen },
  { id: "land",      label: "Terrain",     Icon: Leaf },
];

const ROOM_OPTIONS = [0, 1, 2, 3, 4, "5+"] as const;
const COMMUNES = ["Ratoma", "Dixinn", "Matam", "Kaloum", "Matoto", "Coyah"];
const STEP_LABELS = ["Type & transaction", "Photos & prix", "Quartier", "Contact"];
const FREE_ACTIVE_LISTING_LIMIT = 3;

interface TourRoom {
  id: string;
  name: string;
  file: File | null;
  preview: string | null;
}

interface FormState {
  type: PType | "";
  txType: TxType | "";
  availabilityMode: AvailMode;
  selectedBadges: string[];
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
  return formatPrice(n);
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

async function countFreeActiveListings(ownerId: string): Promise<number> {
  if (!supabase) return 0;
  const baseQuery = supabase
    .from("properties")
    .select("id,status,available_now,availability_status")
    .eq("owner_id", ownerId);
  let { data, error } = await baseQuery;
  if (error && /availability_status/i.test(error.message ?? "")) {
    const fallback = await supabase
      .from("properties")
      .select("id,status,available_now")
      .eq("owner_id", ownerId);
    data = fallback.data as typeof data;
    error = fallback.error;
  }
  if (error || !data) return 0;
  return data.filter((row) => {
    const status = String(row.status ?? "");
    const availability = String((row as { availability_status?: string | null }).availability_status ?? "");
    if (status !== "active") return false;
    if (availability) return availability === "available_now" || availability === "available_soon";
    return row.available_now !== false;
  }).length;
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
  const [photoProgress, setPhotoProgress] = useState<number | null>(null); // 0-100 during compress
  const tourInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const [form, setForm] = useState<FormState>({
    type: "", txType: "", availabilityMode: "flexible", selectedBadges: [],
    photos: [], price: "",
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
  const isSeekerAccount = !!user && ["chercheur", "seeker"].includes(profile?.account_type ?? profile?.role ?? "");

  async function becomeOwner() {
    if (!user || !supabase) return;
    let { error: updateError } = await supabase
      .from("profiles")
      .update({ account_type: "owner", role: "owner" })
      .eq("id", user.id);
    if (updateError) {
      const legacy = await supabase
        .from("profiles")
        .update({ account_type: "proprietaire", role: "owner" })
        .eq("id", user.id);
      updateError = legacy.error;
    }
    if (updateError) {
      toast("Impossible de changer le type de compte", "error");
      return;
    }
    toast("Compte propriétaire activé", "success");
    window.location.reload();
  }

  // Pre-fill phone from profile
  useEffect(() => {
    if (!profile?.phone) return;
    const id = window.setTimeout(() => {
      setForm((f) => ({ ...f, phone: profile.phone! }));
    }, 0);
    return () => window.clearTimeout(id);
  }, [profile]);

  const [roomsError, setRoomsError] = useState<string | null>(null);

  if (isSeekerAccount) {
    return (
      <div className="min-h-screen px-4 py-14 flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <div className="max-w-md w-full rounded-3xl p-6 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <Home className="mx-auto mb-4 h-10 w-10 text-[var(--accent-gold)]" strokeWidth={1.8} />
          <h1 className="text-2xl font-black mb-3" style={{ color: "var(--text-primary)" }}>
            Tu veux publier un logement ?
          </h1>
          <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
            Passe en compte propriétaire pour publier et recevoir des contacts directement sur WhatsApp.
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

  function update<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => {
      const next = { ...f, [key]: val };
      // Si le type devient Studio, forcer max 1 chambre
      if (key === "type" && val === "studio" && f.rooms > 1) {
        next.rooms = 1;
      }
      return next;
    });
  }

  /** Compress a File to a JPEG Blob — max 1200px wide, quality 0.82, max 800 KB */
  function compressImage(file: File): Promise<File> {
    return new Promise((resolve) => {
      const MAX_PX = 1200;
      const QUALITY = 0.82;
      const MAX_BYTES = 800 * 1024;

      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width > MAX_PX) {
          height = Math.round((height * MAX_PX) / width);
          width = MAX_PX;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(file); return; }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size > MAX_BYTES) {
              // If still too large, re-compress with lower quality
              canvas.toBlob(
                (blob2) => resolve(blob2 ? new File([blob2], file.name, { type: "image/jpeg" }) : file),
                "image/jpeg",
                0.65
              );
            } else {
              resolve(new File([blob], file.name, { type: "image/jpeg" }));
            }
          },
          "image/jpeg",
          QUALITY
        );
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }

  async function addPhotos(files: FileList | null) {
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

    // Enforce max 10 total
    const currentCount = form.photos.length;
    const slots = Math.max(0, 10 - currentCount);
    const toProcess = accepted.slice(0, slots);
    if (accepted.length > slots) {
      toast(`Maximum 10 photos — ${accepted.length - slots} photo(s) ignorée(s).`, "error");
    }
    if (!toProcess.length) return;

    // Compress each file
    setPhotoProgress(0);
    const compressed: File[] = [];
    for (let i = 0; i < toProcess.length; i++) {
      const c = await compressImage(toProcess[i]);
      compressed.push(c);
      setPhotoProgress(Math.round(((i + 1) / toProcess.length) * 100));
    }
    setPhotoProgress(null);

    const previews = compressed.map((f) => URL.createObjectURL(f));
    setForm((f) => ({ ...f, photos: [...f.photos, ...compressed] }));
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

  function getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        const duration = video.duration;
        URL.revokeObjectURL(url);
        resolve(duration);
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("video-metadata"));
      };
      video.src = url;
    });
  }

  async function handleVideoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (file.size > 50 * 1024 * 1024) { toast("Vidéo trop lourde (max 50 Mo)", "error"); return; }
    try {
      const duration = await getVideoDuration(file);
      if (duration > 60.5) {
        toast("Vidéo trop longue : 1 minute maximum.", "error");
        return;
      }
    } catch {
      toast("Impossible de vérifier la durée de la vidéo.", "error");
      return;
    }
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
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

  async function handleSubmit() {
    if (!supabase) {
      toast("Service non disponible, réessayez plus tard", "error");
      return;
    }

    // Re-fetch user fresh from Supabase (context cache may be stale on mobile)
    const { data: { user: freshUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !freshUser) {
      setError("Vous devez être connecté pour publier");
      router.push("/connexion?redirect=/publier");
      return;
    }

    if (form.photos.length < 3) {
      toast("Veuillez ajouter au moins 3 photos", "error");
      return;
    }
    if (form.type === "studio" && form.rooms > 1) {
      setRoomsError("Un Studio ne peut pas avoir plus d'une chambre.");
      toast("Studio : maximum 1 chambre autorisée", "error");
      return;
    }
    const priceNum = parseInt(form.price.replace(/\D/g, ""), 10);
    if (!priceNum || isNaN(priceNum) || priceNum <= 0) {
      toast("Veuillez saisir un prix valide", "error");
      return;
    }

    if (form.phone) {
      const digitsOnly = form.phone.replace(/[\s+\-().]/g, "");
      if (!/^\d{7,15}$/.test(digitsOnly)) {
        toast("Numéro de téléphone invalide (7–15 chiffres)", "error");
        return;
      }
    }

    if ((form.locationDetail ?? "").length > 2000) {
      toast("Description trop longue (max 2000 caractères)", "error");
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

    const activeListings = await countFreeActiveListings(freshUser.id);
    if (!profile?.is_verified_pro && activeListings >= FREE_ACTIVE_LISTING_LIMIT) {
      const msg = "Vous avez atteint la limite gratuite de 3 annonces actives.";
      setError(`${msg} Abonnement bientôt disponible.`);
      toast(msg, "error");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Upload photos to Supabase Storage
      const uploadedUrls: string[] = [];
      for (let i = 0; i < form.photos.length; i++) {
        const file = form.photos[i];
        const ext  = file.name.split(".").pop() ?? "jpg";
        const path = `${freshUser.id}/${Date.now()}-${i}.${ext}`;
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
        status:              "pending",
        expires_at:          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        contact_phone:       form.phone,
        contact_preference:  form.contactMethod,
        video_url:           videoUrl,
        owner_id:            freshUser.id,
        features:            [],
        availability_mode:   form.availabilityMode || "flexible",
        badges:              form.selectedBadges,
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

      toast("Annonce soumise — elle sera publiée sous 24h après vérification.", "success");
      router.push("/compte");
    } catch (err) {
      console.error("ERREUR INATTENDUE:", err);
      toast("Une erreur inattendue est survenue", "error");
      setSubmitting(false);
    }
  }

  const canAdvance =
    step === 1 ? !!form.type && !!form.txType :
    step === 2 ? form.photos.length >= 3 && !!form.price :
    step === 3 ? !!form.neighborhood :
    !!form.phone;

  if (authLoading) {
    return (
      <div className="publish-page-light min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full animate-spin" style={{ border: "2px solid rgba(185,138,46,0.34)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="publish-page-light min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "rgba(212,175,55,0.10)", border: "1px solid rgba(212,175,55,0.20)" }}>
            <Lock className="h-8 w-8 text-[var(--accent-gold)]" strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl font-black app-text mb-2">Connexion requise</h1>
          <p className="app-text-muted text-sm mb-8 leading-relaxed">
            Connectez-vous pour publier une annonce sur LogerBien.
          </p>
          <div className="flex flex-col gap-3">
            <a
              href="/connexion?redirect=/publier"
              className="w-full flex items-center justify-center gap-2 bg-[var(--accent-gold)] hover:bg-[#B8963A] text-[var(--bg-primary)] font-black py-3.5 px-6 rounded-2xl transition-colors text-sm"
            >
              Se connecter
            </a>
            <a
              href="/inscription?redirect=/publier"
              className="w-full flex items-center justify-center gap-2 font-semibold py-3.5 px-6 rounded-2xl transition-colors text-sm app-button-secondary"
            >
              Créer un compte
            </a>
          </div>
        </div>
      </div>
    );
  }

  const typeLabel        = TYPE_OPTIONS.find((t) => t.id === form.type)?.label ?? "";
  const TypeIcon         = TYPE_OPTIONS.find((t) => t.id === form.type)?.Icon ?? Home;
  const neighborhoodName = NEIGHBORHOODS.find((n) => n.id === form.neighborhood)?.name ?? "";
  const priceFormatted   = formatGNF(form.price);

  return (
    <div className="publish-page-light max-w-xl mx-auto px-4 pt-4 pb-40">

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
            {TYPE_OPTIONS.map((t) => {
              const Icon = t.Icon;
              const active = form.type === t.id;
              return (
              <button
                key={t.id}
                onClick={() => update("type", t.id)}
                className={cn(
                  "relative flex flex-col items-center gap-2 p-5 rounded-2xl border-2 font-semibold text-sm transition-all active:scale-95",
                  active
                    ? "border-[var(--accent-gold)] bg-[rgba(212,175,55,0.16)] text-[var(--accent-gold)] shadow-[0_10px_26px_rgba(185,138,46,0.18)]"
                    : "hover:border-white/30 text-white"
                )}
              >
                {active && (
                  <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent-gold)] text-[var(--bg-primary)]">
                    <CheckCircle2 className="h-4 w-4" strokeWidth={2.8} />
                  </span>
                )}
                <Icon className="h-9 w-9" strokeWidth={2.1} />
                {t.label}
              </button>
            )})}
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-3">
              Location ou vente ?
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {([
                { id: "rent" as TxType, label: "Location", sub: "Louer mon bien", Icon: KeyRound },
                { id: "sale" as TxType, label: "Vente",    sub: "Vendre mon bien", Icon: Banknote },
              ] as const).map((tx) => {
                const active = form.txType === tx.id;
                return (
                <button
                  key={tx.id}
                  onClick={() => update("txType", tx.id)}
                  className={cn(
                    "relative flex flex-col items-start p-4 rounded-2xl border-2 text-left transition-all active:scale-95",
                    active
                      ? "border-[var(--accent-gold)] bg-[rgba(212,175,55,0.16)] shadow-[0_10px_26px_rgba(185,138,46,0.18)]"
                      : "hover:border-white/30"
                  )}
                >
                  {active && (
                    <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent-gold)] text-[var(--bg-primary)]">
                      <CheckCircle2 className="h-4 w-4" strokeWidth={2.8} />
                    </span>
                  )}
                  <p className="inline-flex items-center gap-2 font-bold text-base text-white">
                    <tx.Icon className="h-4 w-4" strokeWidth={2.4} />
                    {tx.label}
                  </p>
                  <p className="text-xs text-white/50 mt-0.5">{tx.sub}</p>
                </button>
              )})}
            </div>
          </div>

          {/* ── Mode de disponibilité ── */}
          <div>
            <h2 className="text-lg font-bold text-white mb-3">
              Disponibilité
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {AVAIL_OPTIONS.map((opt) => {
                const Icon = opt.Icon;
                const active = form.availabilityMode === opt.id;
                return (
                <button
                  key={opt.id}
                  onClick={() => update("availabilityMode", opt.id)}
                  className={cn(
                    "relative flex flex-col items-start p-4 rounded-2xl border-2 text-left transition-all active:scale-95",
                    active
                      ? "border-[var(--accent-gold)] bg-[rgba(212,175,55,0.16)] shadow-[0_10px_26px_rgba(185,138,46,0.18)]"
                      : "hover:border-white/30"
                  )}
                >
                  {active && (
                    <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent-gold)] text-[var(--bg-primary)]">
                      <CheckCircle2 className="h-4 w-4" strokeWidth={2.8} />
                    </span>
                  )}
                  <Icon className="mb-1 h-6 w-6" strokeWidth={2.3} />
                  <p className="font-bold text-sm text-white">{opt.label}</p>
                  <p className="text-xs text-white/50">{opt.sub}</p>
                </button>
              )})}
            </div>
          </div>

          {/* ── Badges de confiance ── */}
          <div>
            <h2 className="text-lg font-bold text-white mb-1">
              Badges de confiance{" "}
              <span className="text-white/40 font-normal text-sm">(optionnel)</span>
            </h2>
            <p className="text-white/40 text-xs mb-3">
              Ces badges apparaissent sur votre annonce pour rassurer les locataires.
            </p>
            <div className="flex gap-3">
              {OWNER_BADGE_OPTIONS.map((b) => {
                const active = form.selectedBadges.includes(b.id);
                const Icon = b.Icon;
                return (
                  <button
                    key={b.id}
                    onClick={() => {
                      const current = form.selectedBadges;
                      update(
                        "selectedBadges",
                        active ? current.filter((x) => x !== b.id) : [...current, b.id]
                      );
                    }}
                    className={cn(
                      "relative flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 font-semibold text-sm transition-all active:scale-95",
                      active
                        ? "border-[var(--accent-gold)] bg-[rgba(212,175,55,0.16)] text-[var(--accent-gold)] shadow-[0_10px_26px_rgba(185,138,46,0.18)]"
                        : "text-white/70 hover:border-white/30"
                    )}
                  >
                    {active && <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-[var(--accent-gold)]" strokeWidth={2.8} />}
                    <Icon className="h-6 w-6" strokeWidth={2.3} />
                    {b.label}
                  </button>
                );
              })}
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
              Minimum 3 photos — max 10 · les photos sont compressées automatiquement
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

          {/* Compression progress */}
          {photoProgress !== null && (
            <div style={{ background: "rgba(212,175,55,0.10)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: 10, padding: "10px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ width: 14, height: 14, border: "2px solid var(--accent-gold)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "var(--accent-gold)", fontWeight: 600 }}>Compression en cours… {photoProgress}%</span>
              </div>
              <div style={{ height: 4, background: "rgba(212,175,55,0.15)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${photoProgress}%`, background: "var(--accent-gold)", borderRadius: 4, transition: "width 0.2s" }} />
              </div>
            </div>
          )}

          {/* Photo count indicator */}
          {form.photos.length > 0 && (
            <p className="text-xs" style={{ color: form.photos.length >= 3 ? "var(--accent-gold)" : "#f87171", fontWeight: 600 }}>
              {form.photos.length < 3
                ? `${form.photos.length}/3 photos — encore ${3 - form.photos.length} requise(s)`
                : `${form.photos.length}/10 photos ✓`}
            </p>
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
              <span className="inline-flex items-center gap-2">
                <Video className="h-4 w-4" strokeWidth={2.4} />
                Vidéo de visite <span className="text-white/40 font-normal">(optionnel — max 60 s, 50 Mo)</span>
              </span>
            </label>
            {videoUploading && (
              <div style={{ background: "rgba(212,175,55,0.10)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: 10, padding: "10px 14px", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 14, height: 14, border: "2px solid var(--accent-gold)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "var(--accent-gold)", fontWeight: 600 }}>Upload vidéo en cours…</span>
                </div>
                <div style={{ height: 4, background: "rgba(212,175,55,0.15)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: "60%", background: "var(--accent-gold)", borderRadius: 4, animation: "progressPulse 1.5s ease-in-out infinite" }} />
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
                <Video className="h-4 w-4" strokeWidth={2.4} />
                Ajouter une vidéo
              </button>
            )}
          </div>

          {/* Virtual Tour */}
          <div>
            <div style={{
              background: "linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-primary) 100%)",
              border: "1px solid rgba(212,175,55,0.30)",
              borderRadius: 14, padding: "14px 16px",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: form.hasVirtualTour ? 14 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Home style={{ width: 20, height: 20, color: "var(--accent-gold)" }} strokeWidth={2.2} />
                  <div>
                    <p style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 13, marginBottom: 1 }}>Visite virtuelle</p>
                    <p style={{ color: "#666666", fontSize: 11 }}>Photos par pièce · max 10 pièces</p>
                  </div>
                </div>
                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, hasVirtualTour: !f.hasVirtualTour }))}
                  style={{
                    width: 44, height: 24, borderRadius: 12, border: "none",
                    background: form.hasVirtualTour ? "var(--accent-gold)" : "rgba(255,255,255,0.12)",
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
                      background: "var(--bg-secondary)", border: "1px solid var(--border)",
                      borderRadius: 10, padding: "10px 12px",
                      display: "flex", alignItems: "center", gap: 10,
                    }}>
                      {/* Thumb or upload button */}
                      <button
                        type="button"
                        onClick={() => tourInputRefs.current[room.id]?.click()}
                        style={{
                          width: 52, height: 52, borderRadius: 8, flexShrink: 0,
                          background: room.preview ? "transparent" : "rgba(212,175,55,0.10)",
                          border: room.preview ? "none" : "1px dashed rgba(212,175,55,0.40)",
                          overflow: "hidden", cursor: "pointer", position: "relative",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        {room.preview
                          /* eslint-disable-next-line @next/next/no-img-element */
                          ? <img src={room.preview} alt={room.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <Camera style={{ width: 20, height: 20, color: "var(--accent-gold)" }} strokeWidth={2.2} />
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
                          flex: 1, background: "var(--border-subtle)",
                          border: "1px solid rgba(255,255,255,0.10)", borderRadius: 8,
                          padding: "8px 10px", color: "var(--text-primary)", fontSize: 13,
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
                        width: "100%", background: "transparent", border: "1px dashed rgba(212,175,55,0.30)",
                        borderRadius: 10, padding: "10px", color: "var(--accent-gold)", fontSize: 13, fontWeight: 600,
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
                style={{ background: "var(--border-subtle)", border: "1px solid rgba(255,255,255,0.10)" }}
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
                const isStudio = form.type === "studio";
                const disabled = isStudio && val > 1;
                return (
                  <button
                    key={String(r)}
                    onClick={() => {
                      if (disabled) {
                        setRoomsError("Un Studio ne peut pas avoir plus d’une chambre.");
                        return;
                      }
                      setRoomsError(null);
                      update("rooms", val);
                    }}
                    disabled={disabled}
                    title={disabled ? "Studio : max 1 chambre" : undefined}
                    className={cn(
                      "w-12 h-12 rounded-xl border-2 font-bold text-sm transition-all",
                      disabled
                        ? "opacity-30 cursor-not-allowed border-white/10 text-white/30"
                        : form.rooms === val
                          ? "border-[var(--accent-gold)] bg-[rgba(212,175,55,0.16)] text-[var(--accent-gold)] shadow-[0_8px_20px_rgba(185,138,46,0.18)]"
                          : "text-white/70 hover:border-white/30"
                    )}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
            {roomsError && (
              <p className="mt-2 text-xs font-semibold" style={{ color: "#ef4444" }}>
                {roomsError}
              </p>
            )}
            {form.type === "studio" && (
              <p className="mt-1.5 text-xs text-white/40">
                Studio : maximum 1 chambre
              </p>
            )}
          </div>

          {/* Furnished */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              Meublé ?
            </label>
            <div className="flex gap-3">
              {([
                { val: true,  label: "Oui", Icon: Sofa },
                { val: false, label: "Non", Icon: Armchair },
              ] as const).map((f) => (
                <button
                  key={String(f.val)}
                  onClick={() => update("furnished", f.val)}
                  className={cn(
                    "flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all",
                    form.furnished === f.val
                      ? "border-[var(--accent-gold)] bg-[rgba(212,175,55,0.16)] text-[var(--accent-gold)] shadow-[0_8px_20px_rgba(185,138,46,0.18)]"
                      : "text-white/70 hover:border-white/30"
                  )}
                >
                  <f.Icon className="mr-2 inline h-4 w-4" strokeWidth={2.4} />
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
              <label className="flex items-center gap-2 text-xs font-bold text-white/50 uppercase tracking-wider mb-3">
                <Droplets className="h-4 w-4" strokeWidth={2.4} />
                Source d&apos;eau
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                {([
                  { id: "robinet", Icon: Droplets, label: "Robinet" },
                  { id: "forage",  Icon: Droplets, label: "Forage" },
                  { id: "citerne", Icon: Droplets, label: "Citerne" },
                  { id: "none",    Icon: X, label: "Aucune" },
                ] as const).map((opt) => {
                  const active = form.waterSource === opt.id;
                  return (
                  <button key={opt.id} type="button" onClick={() => update("waterSource", opt.id)}
                    style={{
                      position: "relative",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      gap: 4, padding: "12px 8px", borderRadius: 10, minHeight: 70, minWidth: 70,
                      border: active ? "2px solid var(--accent-gold)" : "1px solid var(--border)",
                      background: active ? "rgba(212,175,55,0.16)" : "var(--bg-card)",
                      color: active ? "var(--accent-gold)" : "#666666",
                      fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                      boxShadow: active ? "0 8px 20px rgba(185,138,46,0.18)" : "none",
                    }}>
                    {active && <CheckCircle2 className="absolute right-2 top-2 h-4 w-4 text-[var(--accent-gold)]" strokeWidth={2.8} />}
                    <opt.Icon style={{ width: 24, height: 24 }} strokeWidth={2.2} />
                    {opt.label}
                  </button>
                  );
                })}
              </div>
            </div>

            {/* Électricité */}
            <div className="mb-4">
              <label className="flex items-center gap-2 text-xs font-bold text-white/50 uppercase tracking-wider mb-3">
                <Zap className="h-4 w-4" strokeWidth={2.4} />
                Électricité
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                {([
                  { id: "edg",     Icon: Zap, label: "EDG" },
                  { id: "solaire", Icon: Sun, label: "Solaire" },
                  { id: "groupe",  Icon: Battery, label: "Groupe" },
                  { id: "none",    Icon: X, label: "Aucune" },
                ] as const).map((opt) => {
                  const active = form.electricity === opt.id;
                  return (
                  <button key={opt.id} type="button" onClick={() => update("electricity", opt.id)}
                    style={{
                      position: "relative",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      gap: 4, padding: "12px 8px", borderRadius: 10, minHeight: 70, minWidth: 70,
                      border: active ? "2px solid var(--accent-gold)" : "1px solid var(--border)",
                      background: active ? "rgba(212,175,55,0.16)" : "var(--bg-card)",
                      color: active ? "var(--accent-gold)" : "#666666",
                      fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                      boxShadow: active ? "0 8px 20px rgba(185,138,46,0.18)" : "none",
                    }}>
                    {active && <CheckCircle2 className="absolute right-2 top-2 h-4 w-4 text-[var(--accent-gold)]" strokeWidth={2.8} />}
                    <opt.Icon style={{ width: 24, height: 24 }} strokeWidth={2.2} />
                    {opt.label}
                  </button>
                  );
                })}
              </div>
            </div>

            {/* Internet */}
            <div className="mb-4">
              <label className="flex items-center gap-2 text-xs font-bold text-white/50 uppercase tracking-wider mb-3">
                <Wifi className="h-4 w-4" strokeWidth={2.4} />
                Internet <span className="text-white/25 font-normal normal-case tracking-normal">(optionnel)</span>
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
                {([
                  { id: "wifi", Icon: Wifi, label: "WiFi / Fibre" },
                  { id: "none", Icon: X, label: "Aucun" },
                ] as const).map((opt) => {
                  const active = form.internet === opt.id;
                  return (
                  <button key={opt.id} type="button" onClick={() => update("internet", opt.id)}
                    style={{
                      position: "relative",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      gap: 4, padding: "12px 8px", borderRadius: 10, minHeight: 70,
                      border: active ? "2px solid var(--accent-gold)" : "1px solid var(--border)",
                      background: active ? "rgba(212,175,55,0.16)" : "var(--bg-card)",
                      color: active ? "var(--accent-gold)" : "#666666",
                      fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                      boxShadow: active ? "0 8px 20px rgba(185,138,46,0.18)" : "none",
                    }}>
                    {active && <CheckCircle2 className="absolute right-2 top-2 h-4 w-4 text-[var(--accent-gold)]" strokeWidth={2.8} />}
                    <opt.Icon style={{ width: 24, height: 24 }} strokeWidth={2.2} />
                    {opt.label}
                  </button>
                  );
                })}
              </div>
            </div>

            {/* Autres équipements */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Autres équipements <span className="text-white/25 font-normal normal-case tracking-normal">(optionnel)</span></label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                {([
                  { key: "hasParking",      Icon: Car, label: "Parking" },
                  { key: "hasSecurity",     Icon: Shield, label: "Gardien" },
                  { key: "hasFence",        Icon: BrickWall, label: "Clôture" },
                  { key: "hasAc",           Icon: Zap, label: "Climatisation" },
                  { key: "kitchenEquipped", Icon: Utensils, label: "Cuisine équipée" },
                ] as { key: "hasParking" | "hasSecurity" | "hasFence" | "hasAc" | "kitchenEquipped"; Icon: typeof Car; label: string }[]).map((opt) => {
                  const active = form[opt.key];
                  return (
                    <button key={opt.key} type="button" onClick={() => update(opt.key, !active)}
                      style={{
                        position: "relative",
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        gap: 4, padding: "12px 8px", borderRadius: 10, minHeight: 70,
                        border: active ? "2px solid var(--accent-gold)" : "1px solid var(--border)",
                        background: active ? "rgba(212,175,55,0.16)" : "var(--bg-card)",
                        color: active ? "var(--accent-gold)" : "#666666",
                        fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                        boxShadow: active ? "0 8px 20px rgba(185,138,46,0.18)" : "none",
                      }}>
                      {active && <CheckCircle2 className="absolute right-2 top-2 h-4 w-4 text-[var(--accent-gold)]" strokeWidth={2.8} />}
                      <opt.Icon style={{ width: 24, height: 24 }} strokeWidth={2.2} />
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
                style={{ background: "var(--border-subtle)", border: "1px solid rgba(255,255,255,0.10)" }}
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
                style={{ background: "var(--border-subtle)", border: "1px solid rgba(255,255,255,0.10)" }}
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
                  ? "border-[var(--accent-gold)] bg-[rgba(212,175,55,0.12)] text-[var(--accent-gold)]"
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
                style={{ background: "var(--border-subtle)", border: "1px solid rgba(255,255,255,0.10)" }}
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
          <div className="rounded-2xl p-4 border border-[rgba(212,175,55,0.25)]" style={{ background: "rgba(212,175,55,0.08)" }}>
            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-3">
              Récapitulatif
            </p>
            <div className="flex flex-wrap gap-2">
              {form.type && (
                <span className="inline-flex items-center gap-1.5 text-white text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "var(--border-subtle)", border: "1px solid rgba(255,255,255,0.10)" }}>
                  <TypeIcon className="h-3.5 w-3.5" strokeWidth={2.4} />
                  {typeLabel}
                </span>
              )}
              {form.txType && (
                <span className="inline-flex items-center gap-1.5 text-white text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "var(--border-subtle)", border: "1px solid rgba(255,255,255,0.10)" }}>
                  {form.txType === "rent" ? <KeyRound className="h-3.5 w-3.5" strokeWidth={2.4} /> : <Banknote className="h-3.5 w-3.5" strokeWidth={2.4} />}
                  {form.txType === "rent" ? "Location" : "Vente"}
                </span>
              )}
              {form.neighborhood && (
                <span className="inline-flex items-center gap-1.5 text-white text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "var(--border-subtle)", border: "1px solid rgba(255,255,255,0.10)" }}>
                  <MapPin className="h-3.5 w-3.5" strokeWidth={2.4} />
                  {neighborhoodName}
                </span>
              )}
              {priceFormatted && (
                <span className="text-white/80 text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.20)" }}>
                  {priceFormatted}{form.txType === "rent" ? "/mois" : ""}
                </span>
              )}
              {form.photos.length > 0 && (
                <span className="inline-flex items-center gap-1.5 text-white text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "var(--border-subtle)", border: "1px solid rgba(255,255,255,0.10)" }}>
                  <Camera className="h-3.5 w-3.5" strokeWidth={2.4} />
                  {form.photos.length} photo{form.photos.length > 1 ? "s" : ""}
                </span>
              )}
              {form.rooms > 0 && form.type !== "land" && (
                <span className="inline-flex items-center gap-1.5 text-white text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "var(--border-subtle)", border: "1px solid rgba(255,255,255,0.10)" }}>
                  <Bed className="h-3.5 w-3.5" strokeWidth={2.4} />
                  {form.rooms === 5 ? "5+" : form.rooms} ch.
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
                style={{ background: "var(--border-subtle)", border: "1px solid rgba(255,255,255,0.10)" }}
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
                { id: "whatsapp" as ContactMethod, label: "WhatsApp", Icon: MessageCircle },
                { id: "call"     as ContactMethod, label: "Appel",    Icon: Phone },
                { id: "both"     as ContactMethod, label: "Les deux", Icon: CheckCircle2 },
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
                  <c.Icon className="h-6 w-6" strokeWidth={2.3} />
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

          {/* Publish button */}
          <button
            onClick={handleSubmit}
            disabled={!form.phone || submitting}
            className="w-full bg-[var(--accent-gold)] hover:bg-[#B8963A] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 px-6 rounded-2xl text-base transition-colors shadow-[0_8px_32px_rgba(249,115,22,0.35)] flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
                Publication en cours…
              </>
            ) : (
              <>
                <Rocket className="h-5 w-5" strokeWidth={2.4} />
                Publier mon annonce
              </>
            )}
          </button>

          <p className="text-slate-400 text-xs text-center leading-relaxed">
            En publiant, vous acceptez que votre annonce soit visible par tous les visiteurs de LogerBien.
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
                  ? "bg-[var(--accent-gold)] hover:bg-[#B8963A] text-white shadow-[0_4px_20px_rgba(212,175,55,0.25)]"
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
