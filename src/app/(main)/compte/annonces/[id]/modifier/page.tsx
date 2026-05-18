"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Save } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/toast";

const PRICE_PERIODS = [
  { value: "month", label: "/mois" },
  { value: "year", label: "/an" },
  { value: "total", label: "total" },
];

export default function ModifierAnnoncePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const listing = useAppStore((s) => s.publishedListings.find((p) => p.id === id));
  const updatePublishedListing = useAppStore((s) => s.updatePublishedListing);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; price?: string; phone?: string }>({});

  const [form, setForm] = useState({
    title: listing?.title ?? "",
    description: listing?.description ?? "",
    price: listing?.price ? String(listing.price) : "",
    pricePeriod: listing?.pricePeriod ?? "month",
    availableNow: listing?.availableNow ?? true,
    phone: listing?.owner?.phone ?? "",
    whatsapp: listing?.owner?.whatsapp ?? "",
  });

  if (!listing) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-center">
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Annonce introuvable.</p>
        <Link href="/compte/annonces" className="text-[#E9E900] font-semibold text-sm hover:underline">
          ← Retour à mes annonces
        </Link>
      </div>
    );
  }

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!form.title.trim()) errs.title = "Le titre est obligatoire";
    if (!form.price) errs.price = "Le prix est obligatoire";
    if (!form.phone.trim()) errs.phone = "Le téléphone est obligatoire";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate() || !listing) return;
    setSaving(true);
    try {
      updatePublishedListing(id, {
        title: form.title.trim(),
        description: form.description,
        price: parseInt(form.price) || 0,
        pricePeriod: form.pricePeriod as "month" | "year" | "total",
        availableNow: form.availableNow,
        owner: {
          ...listing.owner,
          phone: form.phone,
          whatsapp: form.whatsapp || form.phone,
        },
      });
      toast("Annonce mise à jour !", "success");
      router.push("/compte/annonces");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/compte/annonces"
          className="w-9 h-9 rounded-xl border border-[#1e2a30] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:border-[#E9E900] hover:text-[#E9E900] transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-lg font-black text-slate-900 dark:text-white">Modifier l&apos;annonce</h1>
          <p className="text-xs text-slate-400 line-clamp-1">{listing.title}</p>
        </div>
      </div>

      <div className="bg-[#2c2f36] rounded-2xl p-6 border border-[#1e2a30] space-y-5">
        {/* Title */}
        <div>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
            Titre de l&apos;annonce *
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => { setForm((f) => ({ ...f, title: e.target.value })); setErrors((er) => ({ ...er, title: undefined })); }}
            maxLength={80}
            className={cn(
              "w-full bg-[#2c2f36] border rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E9E900] text-sm",
              errors.title ? "border-red-500" : "border-slate-200 dark:border-[#2a3040]"
            )}
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Description</label>
          <textarea
            rows={5}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full bg-[#2c2f36] border border-[#1e2a30] rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E9E900] text-sm resize-none"
          />
        </div>

        {/* Price */}
        <div>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Prix *</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                value={form.price}
                onChange={(e) => { setForm((f) => ({ ...f, price: e.target.value })); setErrors((er) => ({ ...er, price: undefined })); }}
                className={cn(
                  "w-full bg-[#2c2f36] border rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#E9E900]",
                  errors.price ? "border-red-500" : "border-slate-200 dark:border-[#2a3040]"
                )}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">GNF</span>
            </div>
            <select
              value={form.pricePeriod}
              onChange={(e) => setForm((f) => ({ ...f, pricePeriod: e.target.value as "month" | "year" | "total" }))}
              className="bg-[#2c2f36] border border-[#1e2a30] rounded-xl px-3 py-3 text-slate-700 dark:text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#E9E900]"
            >
              {PRICE_PERIODS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
        </div>

        {/* Available now */}
        <div>
          <button
            onClick={() => setForm((f) => ({ ...f, availableNow: !f.availableNow }))}
            className={cn(
              "w-full py-3 rounded-xl text-sm font-semibold border transition-colors",
              form.availableNow
                ? "bg-green-50 dark:bg-green-900/20 border-green-500 text-green-600 dark:text-yellow-400"
                : "bg-[#2c2f36] border-slate-200 dark:border-[#2a3040] text-slate-500 dark:text-slate-400"
            )}
          >
            {form.availableNow ? "✅ Disponible maintenant" : "Non disponible"}
          </button>
        </div>

        {/* Phone */}
        <div>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">📞 Téléphone *</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => { setForm((f) => ({ ...f, phone: e.target.value })); setErrors((er) => ({ ...er, phone: undefined })); }}
            placeholder="+224 620 000 000"
            className={cn(
              "w-full bg-[#2c2f36] border rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E9E900] text-sm",
              errors.phone ? "border-red-500" : "border-slate-200 dark:border-[#2a3040]"
            )}
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>

        {/* WhatsApp */}
        <div>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
            💬 WhatsApp <span className="font-normal text-slate-400">(si différent)</span>
          </label>
          <input
            type="tel"
            value={form.whatsapp}
            onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
            placeholder="+224 620 000 000"
            className="w-full bg-[#2c2f36] border border-[#1e2a30] rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E9E900] text-sm"
          />
        </div>
      </div>

      {/* Save button */}
      <div className="mt-4 flex gap-3">
        <Link
          href="/compte/annonces"
          className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-[#1e2a30] text-slate-600 dark:text-slate-300 text-sm font-semibold hover:border-[#E9E900] hover:text-[#E9E900] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Annuler
        </Link>
        <Button onClick={handleSave} loading={saving} variant="brand" size="lg" className="flex-1 gap-2">
          <Save className="w-4 h-4" /> Enregistrer
        </Button>
      </div>
    </div>
  );
}
