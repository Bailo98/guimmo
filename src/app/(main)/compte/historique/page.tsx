"use client";
import { useState } from "react";
import { Clock, Trash2, MapPin, Eye, AlertTriangle, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { MOCK_PROPERTIES } from "@/data/mock-properties";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { formatPrice } from "@/lib/utils";
import { toast } from "@/lib/toast";
import type { Property } from "@/types";
import type { PublishedProperty } from "@/lib/store";

function asProperty(p: PublishedProperty): Property {
  return p as unknown as Property;
}

const MOCK_TIME_LABELS = [
  "À l'instant",
  "Il y a 12 min",
  "Il y a 1h",
  "Il y a 2h",
  "Il y a 5h",
  "Hier",
  "Hier",
  "Il y a 2 jours",
  "Il y a 3 jours",
  "Il y a 5 jours",
];

const NEIGHBORHOOD_LABELS: Record<string, string> = {
  kipe: "Kipé", lambanyi: "Lambanyi", ratoma: "Ratoma", sonfonia: "Sonfonia",
  cosa: "Cosa", hamdallaye: "Hamdallaye", nongo: "Nongo", taouyah: "Taouyah",
  dixinn: "Dixinn", matam: "Matam", madina: "Madina", kaloum: "Kaloum",
};

export default function HistoriquePage() {
  const recentViews = useAppStore((s) => s.recentViews);
  const clearRecentViews = useAppStore((s) => s.clearRecentViews);
  const publishedListings = useAppStore((s) => s.publishedListings);

  const [showConfirm, setShowConfirm] = useState(false);

  const allProperties: Property[] = [
    ...publishedListings.map(asProperty),
    ...MOCK_PROPERTIES,
  ];

  const recentProperties = recentViews
    .map((id) => allProperties.find((p) => p.id === id))
    .filter((p): p is Property => Boolean(p));

  function handleClear() {
    clearRecentViews();
    setShowConfirm(false);
    toast("Historique effacé", "info");
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Historique de navigation</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Vos {recentProperties.length > 0 ? recentProperties.length : "10"} dernières annonces consultées
          </p>
        </div>
        {recentProperties.length > 0 && (
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-600 transition-colors flex-shrink-0 mt-1"
          >
            <Trash2 className="w-4 h-4" />
            Effacer l&apos;historique
          </button>
        )}
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
          <div className="bg-[var(--bg-card-light)] rounded-2xl p-6 max-w-sm w-full border border-[var(--border)] shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">Effacer l&apos;historique</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Cette action est irréversible.</p>
              </div>
              <button
                onClick={() => setShowConfirm(false)}
                className="ml-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
              Voulez-vous vraiment supprimer les {recentProperties.length} annonce{recentProperties.length !== 1 ? "s" : ""} de votre historique ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleClear}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                Effacer
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 border border-[var(--border)] text-slate-700 dark:text-slate-300 font-semibold py-2.5 rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-[#2a3040] transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {recentProperties.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-[#1e2430] flex items-center justify-center mx-auto mb-5">
            <Clock className="w-10 h-10 text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Aucune annonce consultée
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-xs mx-auto">
            Les annonces que vous consultez apparaîtront ici pour y revenir facilement
          </p>
          <Link
            href="/annonces"
            className="bg-[var(--accent-gold)] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#B8963A] transition-colors inline-block"
          >
            Parcourir les annonces
          </Link>
        </div>
      ) : (
        <>
          {/* Timeline list */}
          <div className="bg-[var(--bg-card-light)] rounded-2xl border border-[var(--border)] overflow-hidden mb-8">
            {recentProperties.map((property, index) => {
              const primaryImage = property.property_images?.find((i) => i.is_primary) ?? property.property_images?.[0];
              const neighborhoodLabel = NEIGHBORHOOD_LABELS[property.neighborhood] ?? property.neighborhood;
              const timeLabel = MOCK_TIME_LABELS[index] ?? "Récemment";

              return (
                <Link
                  key={property.id}
                  href={`/annonces/${property.id}`}
                  className={`flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-[#2a3040] transition-colors group ${
                    index !== recentProperties.length - 1
                      ? "border-b border-[var(--border)]"
                      : ""
                  }`}
                >
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center self-stretch pt-1 flex-shrink-0">
                    <div className={`w-2.5 h-2.5 rounded-full border-2 ${
                      index === 0
                        ? "bg-[var(--accent-gold)] border-[var(--accent-gold)]"
                        : "bg-transparent border-slate-300 dark:border-slate-600"
                    }`} />
                    {index !== recentProperties.length - 1 && (
                      <div className="w-px flex-1 bg-slate-200 dark:bg-slate-700 mt-1" />
                    )}
                  </div>

                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 flex-shrink-0">
                    {primaryImage ? (
                      <Image
                        src={primaryImage.url}
                        alt={property.title}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Eye className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-[var(--accent-gold)] transition-colors">
                      {property.title}
                    </p>
                    <div className="flex items-center gap-1 text-slate-400 text-xs mt-0.5">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span>{neighborhoodLabel}, {property.city}</span>
                    </div>
                    <p className="text-[var(--accent-gold)] font-bold text-sm mt-1">
                      {formatPrice(property.price)}
                      {property.price_period === "month" && (
                        <span className="text-xs font-normal text-slate-400">/mois</span>
                      )}
                    </p>
                  </div>

                  {/* Time */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-slate-400 whitespace-nowrap">{timeLabel}</p>
                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5 justify-end">
                      <Eye className="w-3 h-3" />
                      <span>{property.views} vues</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Grid view */}
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Consulter à nouveau</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentProperties.slice(0, 6).map((p, i) => (
                <PropertyCard key={p.id} property={p} index={i} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
