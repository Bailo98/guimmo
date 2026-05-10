"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Home, Camera, Phone, CheckCircle, ChevronRight, ChevronLeft,
  Upload, X, Wind, Car, Wifi, Zap, Droplets, Sun, Trees, Waves,
  Shield, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PROPERTY_TYPES } from "@/lib/constants";
import { POPULAR_NEIGHBORHOODS } from "@/data/neighborhoods";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/lib/store";
import { toast } from "@/lib/toast";
import { publishProperty } from "@/lib/properties";

const WIZARD_STEPS = [
  { id: 1, label: "Votre bien", icon: Home },
  { id: 2, label: "Photos & Équipements", icon: Camera },
  { id: 3, label: "Contact & Publication", icon: Phone },
];

const TRANSACTION_TYPES = [
  { value: "rent", label: "À louer", emoji: "🔑" },
  { value: "sale", label: "À vendre", emoji: "🏷️" },
];

const PRICE_PERIODS = [
  { value: "month", label: "/mois" },
  { value: "year", label: "/an" },
  { value: "total", label: "total" },
];

const FEATURES_LIST = [
  { value: "balcon", label: "Balcon", icon: Sun },
  { value: "parking", label: "Parking", icon: Car },
  { value: "ascenseur", label: "Ascenseur", icon: ChevronUp },
  { value: "jardin", label: "Jardin", icon: Trees },
  { value: "piscine", label: "Piscine", icon: Waves },
  { value: "climatisation", label: "Climatisation", icon: Wind },
  { value: "gardiennage", label: "Gardiennage", icon: Shield },
  { value: "eau-courante", label: "Eau courante", icon: Droplets },
  { value: "groupe-électrogène", label: "Groupe élec.", icon: Zap },
  { value: "internet-fibre", label: "Internet fibre", icon: Wifi },
];

interface ImagePreview {
  file: File;
  url: string;
  id: string;
}

interface FormState {
  title: string;
  type: string;
  transactionType: string;
  neighborhood: string;
  city: string;
  surface: string;
  rooms: string;
  bathrooms: string;
  price: string;
  pricePeriod: string;
  description: string;
  features: string[];
  furnished: boolean;
  availableNow: boolean;
  ownerName: string;
  phone: string;
  whatsapp: string;
  email: string;
  videoUrl: string;
}

const INITIAL_FORM: FormState = {
  title: "",
  type: "",
  transactionType: "rent",
  neighborhood: "",
  city: "Conakry",
  surface: "",
  rooms: "",
  bathrooms: "",
  price: "",
  pricePeriod: "month",
  description: "",
  features: [],
  furnished: false,
  availableNow: true,
  ownerName: "",
  phone: "",
  whatsapp: "",
  email: "",
  videoUrl: "",
};

const DRAFT_KEY = "guimmo-draft";

export default function PublierPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState(false);
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | "images", string>>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const addPublishedListing = useAppStore((s) => s.addPublishedListing);

  const [form, setFormState] = useState<FormState>(INITIAL_FORM);

  // Restore draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<FormState>;
        setFormState((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore
    }
  }, []);

  // Auto-save to localStorage on form change
  const setForm = useCallback((updater: Partial<FormState> | ((prev: FormState) => FormState)) => {
    setFormState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  function toggleFeature(value: string) {
    setForm((prev) => ({
      ...prev,
      features: prev.features.includes(value)
        ? prev.features.filter((f) => f !== value)
        : [...prev.features, value],
    }));
  }

  function addFiles(files: FileList | null) {
    if (!files) return;
    const valid = Array.from(files).filter(
      (f) => f.type.startsWith("image/") && f.size <= 5 * 1024 * 1024
    );
    const previews: ImagePreview[] = valid.map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
      id: `${f.name}-${f.size}-${Date.now()}`,
    }));
    setImages((prev) => [...prev, ...previews].slice(0, 10));
  }

  function removeImage(id: string) {
    setImages((prev) => {
      const removed = prev.find((i) => i.id === id);
      if (removed) URL.revokeObjectURL(removed.url);
      return prev.filter((i) => i.id !== id);
    });
  }

  function setPrimary(id: string) {
    setImages((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      return [item, ...next];
    });
  }

  function validateStep(s: number): boolean {
    const errs: typeof errors = {};
    if (s === 1) {
      if (!form.type) errs.type = "Sélectionnez un type de bien";
      if (!form.neighborhood) errs.neighborhood = "Sélectionnez un quartier";
      if (!form.price) errs.price = "Indiquez un prix";
    }
    if (s === 3) {
      if (!form.phone) errs.phone = "Le numéro de téléphone est obligatoire";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() {
    if (!validateStep(step)) return;
    if (step < 3) setStep(step + 1);
  }

  function prev() {
    if (step > 1) setStep(step - 1);
  }

  async function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  }

  async function handlePublish() {
    if (!validateStep(3)) return;
    setLoading(true);
    try {
      const typeLabel = PROPERTY_TYPES.find((t) => t.value === form.type)?.label ?? form.type;
      const neighborhoodLabel = POPULAR_NEIGHBORHOODS.find((n) => n.id === form.neighborhood)?.name ?? form.neighborhood;
      const autoTitle = form.title.trim() ||
        `${typeLabel}${form.rooms ? ` ${form.rooms}ch` : ""} à ${neighborhoodLabel}`;

      const imageDataUrls = await Promise.all(images.map((img) => fileToDataUrl(img.file)));
      const propertyImages = imageDataUrls.map((url, i) => ({
        id: `img-${Date.now()}-${i}`,
        url,
        alt: autoTitle,
        isPrimary: i === 0,
      }));

      const id = `user-${Date.now()}`;
      addPublishedListing({
        id,
        title: autoTitle,
        description: form.description,
        type: form.type || "apartment",
        transactionType: form.transactionType as "rent" | "sale",
        status: "active",
        price: parseInt(form.price) || 0,
        pricePeriod: form.pricePeriod as "month" | "year" | "total",
        surface: form.surface ? parseInt(form.surface) : undefined,
        rooms: form.rooms ? parseInt(form.rooms) : undefined,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : undefined,
        furnished: form.furnished,
        availableNow: form.availableNow,
        neighborhood: form.neighborhood,
        city: form.city || "Conakry",
        images: propertyImages,
        owner: {
          id: "current-user",
          name: form.ownerName || "Mon Compte",
          email: form.email || "user@guimmo.gn",
          phone: form.phone,
          whatsapp: form.whatsapp || form.phone,
          role: "owner",
          verified: false,
          badges: [],
          trustScore: 50,
          createdAt: new Date().toISOString(),
        },
        badges: [],
        views: 0,
        whatsappClicks: 0,
        isBoosted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        features: form.features,
        ...(form.videoUrl ? { videoUrl: form.videoUrl } : {}),
      });
      // Save to Supabase (runs in background, doesn't block UX)
      publishProperty(
        {
          title: autoTitle, description: form.description,
          type: form.type || "apartment", transactionType: form.transactionType,
          price: parseInt(form.price) || 0, pricePeriod: form.pricePeriod,
          surface: form.surface ? parseInt(form.surface) : undefined,
          rooms: form.rooms ? parseInt(form.rooms) : undefined,
          bathrooms: form.bathrooms ? parseInt(form.bathrooms) : undefined,
          furnished: form.furnished, availableNow: form.availableNow,
          neighborhood: form.neighborhood, city: form.city || "Conakry",
          features: form.features,
        },
        imageDataUrls
      ).catch(() => {}); // silent fail — local store is the fallback

      // Clear draft after successful publish
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      toast("Annonce publiée avec succès !", "success");
      setPublished(true);
      setTimeout(() => router.push("/compte/annonces"), 2000);
    } finally {
      setLoading(false);
    }
  }

  const progress = ((step - 1) / (WIZARD_STEPS.length - 1)) * 100;
  const neighborhoodLabel = POPULAR_NEIGHBORHOODS.find((n) => n.id === form.neighborhood)?.name ?? form.neighborhood;
  const typeLabel = PROPERTY_TYPES.find((t) => t.value === form.type)?.label ?? form.type;

  if (published) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6 flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-2">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Annonce publiée !</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs">
          Votre annonce GuImmo a été soumise avec succès. Elle sera vérifiée par notre équipe sous 24h.
        </p>
        <p className="text-xs text-slate-400">Redirection vers vos annonces...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-black text-slate-900 dark:text-white">Publier une annonce</h1>
          <span className="text-sm text-slate-400 font-medium">Étape {step}/{WIZARD_STEPS.length}</span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-slate-100 dark:bg-[#2a3040] rounded-full overflow-hidden mb-4">
          <div className="h-full bg-[#F97316] rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        {/* Step labels */}
        <div className="flex items-center gap-2">
          {WIZARD_STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isActive = s.id === step;
            const isDone = s.id < step;
            return (
              <div key={s.id} className="flex items-center gap-2 flex-1">
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    isActive ? "bg-[#F97316] text-white shadow-lg shadow-orange-500/30"
                      : isDone ? "bg-green-500 text-white"
                      : "bg-slate-100 dark:bg-[#2a3040] text-slate-400"
                  )}>
                    {isDone ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={cn(
                    "text-[10px] font-semibold text-center leading-tight whitespace-nowrap",
                    isActive ? "text-[#F97316]" : isDone ? "text-green-500" : "text-slate-400"
                  )}>
                    {s.label}
                  </span>
                </div>
                {idx < WIZARD_STEPS.length - 1 && (
                  <div className={cn(
                    "flex-1 h-0.5 rounded-full mb-4 transition-colors",
                    isDone ? "bg-green-500" : "bg-slate-100 dark:bg-[#2a3040]"
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-6 border border-slate-100 dark:border-[#2a3040] min-h-[300px]">

        {/* ── STEP 1: Votre bien ── */}
        {step === 1 && (
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white mb-1">Votre bien</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-5">Décrivez le logement que vous proposez</p>

            {/* Transaction type */}
            <div className="flex gap-2 mb-5">
              {TRANSACTION_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setForm({ transactionType: t.value })}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-sm font-bold transition-all border",
                    form.transactionType === t.value
                      ? "bg-[#F97316] text-white border-[#F97316]"
                      : "bg-slate-50 dark:bg-[#151922] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#2a3040]"
                  )}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>

            {/* Property type */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 block">Type de bien *</label>
              <div className="grid grid-cols-2 gap-2">
                {PROPERTY_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => { setForm({ type: t.value }); setErrors((e) => ({ ...e, type: undefined })); }}
                    className={cn(
                      "py-3 px-4 rounded-xl text-sm font-semibold transition-all border text-left",
                      form.type === t.value
                        ? "bg-[#F97316]/10 border-[#F97316] text-[#F97316]"
                        : "bg-slate-50 dark:bg-[#151922] border-slate-200 dark:border-[#2a3040] text-slate-600 dark:text-slate-300"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
            </div>

            {/* Neighborhood */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 block">Quartier *</label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                {POPULAR_NEIGHBORHOODS.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => { setForm({ neighborhood: n.id }); setErrors((e) => ({ ...e, neighborhood: undefined })); }}
                    className={cn(
                      "py-2.5 px-3 rounded-xl text-sm font-semibold transition-all border text-left",
                      form.neighborhood === n.id
                        ? "bg-[#F97316]/10 border-[#F97316] text-[#F97316]"
                        : "bg-slate-50 dark:bg-[#151922] border-slate-200 dark:border-[#2a3040] text-slate-600 dark:text-slate-300"
                    )}
                  >
                    📍 {n.name}
                  </button>
                ))}
              </div>
              {errors.neighborhood && <p className="text-red-500 text-xs mt-1">{errors.neighborhood}</p>}
            </div>

            {/* City */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 block">Ville</label>
              <input
                type="text"
                placeholder="Ex: Conakry"
                value={form.city}
                onChange={(e) => setForm({ city: e.target.value })}
                className="w-full bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F97316] text-sm"
              />
            </div>

            {/* Surface, rooms, bathrooms */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { key: "surface", label: "Surface (m²)", emoji: "📐" },
                { key: "rooms", label: "Chambres", emoji: "🛏️" },
                { key: "bathrooms", label: "Salles de bain", emoji: "🚿" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">{f.emoji} {f.label}</label>
                  <input
                    type="number"
                    value={form[f.key as keyof FormState] as string}
                    onChange={(e) => setForm({ [f.key]: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-center font-bold focus:outline-none focus:ring-2 focus:ring-[#F97316] text-sm"
                    min="0"
                  />
                </div>
              ))}
            </div>

            {/* Price */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 block">Prix *</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    placeholder="Ex: 2500000"
                    value={form.price}
                    onChange={(e) => { setForm({ price: e.target.value }); setErrors((e2) => ({ ...e2, price: undefined })); }}
                    className="w-full bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm font-bold placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">GNF</span>
                </div>
                <select
                  value={form.pricePeriod}
                  onChange={(e) => setForm({ pricePeriod: e.target.value })}
                  className="bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] rounded-xl px-3 py-3 text-slate-700 dark:text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                >
                  {PRICE_PERIODS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
              <div className="flex flex-wrap gap-2 mt-2">
                {["500000", "1000000", "2000000", "3000000", "5000000"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setForm({ price: p })}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
                      form.price === p ? "bg-[#F97316] text-white border-[#F97316]" : "bg-slate-50 dark:bg-[#151922] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-[#2a3040]"
                    )}
                  >
                    {parseInt(p).toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Titre de l&apos;annonce</label>
              <input
                type="text"
                placeholder="Ex: Bel appartement 3ch meublé à Kipé"
                value={form.title}
                onChange={(e) => setForm({ title: e.target.value })}
                maxLength={80}
                className="w-full bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F97316] text-sm"
              />
              <p className="text-xs text-slate-400 mt-1 text-right">{form.title.length}/80 · laissez vide pour un titre automatique</p>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Description</label>
              <textarea
                rows={4}
                placeholder="Décrivez votre logement : état, équipements, environnement..."
                value={form.description}
                onChange={(e) => setForm({ description: e.target.value })}
                className="w-full bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F97316] text-sm resize-none"
              />
              <p className={cn("text-xs mt-1 text-right", form.description.length < 50 ? "text-slate-400" : "text-green-500")}>
                {form.description.length} / 50 min.
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 2: Photos & Équipements ── */}
        {step === 2 && (
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white mb-1">Photos &amp; Équipements</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-5">Ajoutez des photos et sélectionnez les équipements</p>

            {/* Photo upload */}
            <div className="mb-6">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 block">Photos (max 10)</label>
              <label
                className={cn(
                  "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-colors",
                  dragOver
                    ? "border-[#F97316] bg-orange-50 dark:bg-orange-900/20"
                    : "border-[#F97316]/40 dark:border-[#F97316]/30 hover:border-[#F97316] hover:bg-orange-50 dark:hover:bg-orange-900/10"
                )}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
              >
                <Upload className="w-6 h-6 text-[#F97316] mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {dragOver ? "Déposez ici !" : "Appuyez ou glissez-déposez des photos"}
                </p>
                <p className="text-xs text-slate-400 mt-1">JPEG, PNG · Max 5 MB / photo</p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => addFiles(e.target.files)}
                  ref={fileInputRef}
                />
              </label>

              {images.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {images.length} photo{images.length > 1 ? "s" : ""} · <span className="text-[#F97316]">La 1ère sera la principale</span>
                    </p>
                    <button
                      onClick={() => { images.forEach((i) => URL.revokeObjectURL(i.url)); setImages([]); }}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      Tout supprimer
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((img, idx) => (
                      <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-[#151922]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 bg-[#F97316] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            Principale
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                          {idx !== 0 && (
                            <button
                              onClick={() => setPrimary(img.id)}
                              className="bg-white/90 text-slate-700 text-[10px] font-bold px-2 py-1 rounded-lg hover:bg-[#F97316] hover:text-white transition-colors"
                            >
                              Principale
                            </button>
                          )}
                          <button
                            onClick={() => removeImage(img.id)}
                            className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {images.length < 10 && (
                      <label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 dark:border-[#2a3040] flex flex-col items-center justify-center cursor-pointer hover:border-[#F97316] hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors">
                        <Upload className="w-5 h-5 text-slate-300 dark:text-slate-600 mb-1" />
                        <span className="text-[10px] text-slate-400">Ajouter</span>
                        <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => addFiles(e.target.files)} />
                      </label>
                    )}
                  </div>
                </div>
              )}
              {images.length === 0 && (
                <p className="text-xs text-slate-400 mt-2 text-center">
                  💡 Les annonces avec photos reçoivent 5x plus de contacts
                </p>
              )}
            </div>

            {/* Features */}
            <div className="mb-6">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 block">Équipements &amp; services</label>
              <div className="grid grid-cols-2 gap-2">
                {FEATURES_LIST.map(({ value, label, icon: Icon }) => {
                  const selected = form.features.includes(value);
                  return (
                    <button
                      key={value}
                      onClick={() => toggleFeature(value)}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all",
                        selected
                          ? "bg-[#F97316] border-[#F97316] text-white"
                          : "bg-slate-50 dark:bg-[#151922] border-slate-200 dark:border-[#2a3040] text-slate-600 dark:text-slate-300 hover:border-[#F97316]/50"
                      )}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Video URL */}
            <div className="mb-6">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 block">
                🎬 Vidéo de présentation <span className="font-normal text-slate-400">(optionnel)</span>
              </label>
              <input
                type="url"
                placeholder="https://youtube.com/embed/... ou https://drive.google.com/..."
                value={form.videoUrl}
                onChange={(e) => setForm({ videoUrl: e.target.value })}
                className="w-full bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F97316] text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">Collez un lien YouTube, Google Drive ou Vimeo pour ajouter une visite vidéo</p>
            </div>

            {/* Furnished & availableNow toggles */}
            <div className="flex gap-3">
              <button
                onClick={() => setForm((p) => ({ ...p, furnished: !p.furnished }))}
                className={cn(
                  "flex-1 py-3 rounded-xl text-sm font-semibold border transition-colors",
                  form.furnished ? "bg-[#F97316]/10 border-[#F97316] text-[#F97316]" : "bg-slate-50 dark:bg-[#151922] border-slate-200 dark:border-[#2a3040] text-slate-500 dark:text-slate-400"
                )}
              >
                {form.furnished ? "✅ Meublé" : "Meublé ?"}
              </button>
              <button
                onClick={() => setForm((p) => ({ ...p, availableNow: !p.availableNow }))}
                className={cn(
                  "flex-1 py-3 rounded-xl text-sm font-semibold border transition-colors",
                  form.availableNow ? "bg-green-50 dark:bg-green-900/20 border-green-500 text-green-600 dark:text-green-400" : "bg-slate-50 dark:bg-[#151922] border-slate-200 dark:border-[#2a3040] text-slate-500 dark:text-slate-400"
                )}
              >
                {form.availableNow ? "✅ Disponible" : "Disponible ?"}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Contact & Publication ── */}
        {step === 3 && (
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white mb-1">Contact &amp; Publication</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-5">Renseignez vos coordonnées et vérifiez le récapitulatif</p>

            {/* Contact fields */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">👤 Nom du propriétaire</label>
                <input
                  type="text"
                  placeholder="Ex: Mamadou Diallo"
                  value={form.ownerName}
                  onChange={(e) => setForm({ ownerName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F97316] text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">📞 Numéro de téléphone *</label>
                <input
                  type="tel"
                  placeholder="+224 620 000 000"
                  value={form.phone}
                  onChange={(e) => { setForm({ phone: e.target.value }); setErrors((er) => ({ ...er, phone: undefined })); }}
                  className={cn(
                    "w-full bg-slate-50 dark:bg-[#151922] border rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F97316] text-sm",
                    errors.phone ? "border-red-500" : "border-slate-200 dark:border-[#2a3040]"
                  )}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                  💬 WhatsApp <span className="font-normal text-slate-400">(si différent)</span>
                </label>
                <input
                  type="tel"
                  placeholder="+224 620 000 000"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ whatsapp: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F97316] text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                  ✉️ Email <span className="font-normal text-slate-400">(optionnel)</span>
                </label>
                <input
                  type="email"
                  placeholder="email@exemple.com"
                  value={form.email}
                  onChange={(e) => setForm({ email: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F97316] text-sm"
                />
              </div>
            </div>

            {/* Summary preview */}
            <div className="bg-slate-50 dark:bg-[#151922] rounded-2xl p-4 mb-6 space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Récapitulatif</p>
              {[
                { label: "Type", value: typeLabel || "—" },
                { label: "Transaction", value: form.transactionType === "rent" ? "À louer" : "À vendre" },
                { label: "Quartier", value: neighborhoodLabel || "—" },
                { label: "Ville", value: form.city || "—" },
                { label: "Surface", value: form.surface ? `${form.surface} m²` : "—" },
                { label: "Chambres", value: form.rooms || "—" },
                { label: "Prix", value: form.price ? `${parseInt(form.price).toLocaleString()} GNF` : "—" },
                { label: "Photos", value: `${images.length} photo${images.length !== 1 ? "s" : ""}` },
                { label: "Équipements", value: form.features.length > 0 ? form.features.join(", ") : "Aucun" },
                { label: "Contact", value: form.phone || "—" },
                { label: "Vidéo", value: form.videoUrl ? "✅ Oui" : "Non" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between text-sm gap-3">
                  <span className="text-slate-500 flex-shrink-0">{label}</span>
                  <span className="font-semibold text-slate-900 dark:text-white text-right line-clamp-2">{value}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-400 mb-4 text-center">
              Votre annonce sera vérifiée par notre équipe sous 24h avant d&apos;être publiée.
            </p>

            <Button onClick={handlePublish} loading={loading} variant="brand" size="lg" className="w-full">
              Publier mon annonce
            </Button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-4">
        {step > 1 && (
          <button
            onClick={prev}
            className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-slate-200 dark:border-[#2a3040] text-slate-600 dark:text-slate-300 text-sm font-semibold hover:border-[#F97316] hover:text-[#F97316] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Retour
          </button>
        )}
        {step < 3 && (
          <button
            onClick={next}
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#F97316] hover:bg-[#EA6C0A] text-white font-bold py-3 rounded-xl text-sm transition-colors active:scale-95"
          >
            Suivant <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
