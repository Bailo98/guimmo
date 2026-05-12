"use client";
import Image from "next/image";
import Link from "next/link";
import { Heart, Eye, MapPin, Bed, Bath, Square, MessageCircle, Phone, Scale, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice, timeAgo, getWhatsAppUrl, getWhatsAppMessage } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { toast } from "@/lib/toast";
import { TrustBadge } from "./Badge";
import type { Property } from "@/types";

interface PropertyCardProps {
  property: Property;
  variant?: "default" | "compact" | "horizontal";
  className?: string;
  index?: number;
}

const TYPE_LABELS: Record<string, string> = {
  apartment: "Appartement",
  house: "Maison",
  studio: "Studio",
  villa: "Villa",
  room: "Chambre",
  office: "Bureau",
  shop: "Boutique",
  land: "Terrain",
};

const NEIGHBORHOOD_LABELS: Record<string, string> = {
  kipe: "Kipé", lambanyi: "Lambanyi", ratoma: "Ratoma", sonfonia: "Sonfonia",
  cosa: "Cosa", hamdallaye: "Hamdallaye", nongo: "Nongo", taouyah: "Taouyah",
  dixinn: "Dixinn", matam: "Matam", madina: "Madina", kaloum: "Kaloum",
};

export function PropertyCard({ property, variant = "default", className, index = 0 }: PropertyCardProps) {
  const { toggleFavorite, isFavorite, _hasHydrated, addToCompare, compareList } = useAppStore();
  const fav = _hasHydrated && isFavorite(property.id);
  const primaryImage = property.images.find((i) => i.isPrimary) ?? property.images[0];
  const neighborhoodLabel = NEIGHBORHOOD_LABELS[property.neighborhood] ?? property.neighborhood;

  const whatsappUrl = getWhatsAppUrl(
    property.owner.whatsapp ?? property.owner.phone,
    getWhatsAppMessage(property.title, property.id)
  );
  const phoneUrl = `tel:${property.owner.phone}`;

  if (variant === "horizontal") {
    return (
      <div
        className={cn("group flex gap-3 bg-white dark:bg-[#1e2430] rounded-2xl overflow-hidden border border-slate-100 dark:border-[#2a3040] hover:shadow-lg transition-shadow duration-200 animate-fadeIn", className)}
      >
        <Link href={`/annonces/${property.id}`} className="relative w-28 flex-shrink-0">
          <div className="relative w-full h-full min-h-[100px]">
            {primaryImage ? (
              <Image src={primaryImage.url} alt={primaryImage.alt} fill className="object-cover" sizes="112px" />
            ) : (
              <div className="w-full h-full bg-slate-200 dark:bg-slate-700" />
            )}
          </div>
          {property.isBoosted && (
            <span className="absolute top-1 left-1 bg-[#F97316] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <Star className="w-2.5 h-2.5 fill-white" /> Sponsorisé
            </span>
          )}
        </Link>
        <div className="flex-1 p-3 min-w-0">
          <Link href={`/annonces/${property.id}`}>
            <p className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-1">{property.title}</p>
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span>{neighborhoodLabel}, {property.city}</span>
            </div>
            <p className="text-[#F97316] font-bold text-sm mt-1">
              {formatPrice(property.price)}
              {property.pricePeriod === "month" && <span className="text-xs font-normal text-slate-400">/mois</span>}
            </p>
          </Link>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            {property.rooms && <span className="flex items-center gap-0.5"><Bed className="w-3 h-3" />{property.rooms}</span>}
            {property.bathrooms && <span className="flex items-center gap-0.5"><Bath className="w-3 h-3" />{property.bathrooms}</span>}
            {property.surface && <span className="flex items-center gap-0.5"><Square className="w-3 h-3" />{property.surface}m²</span>}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <a
              href={phoneUrl}
              className="flex items-center gap-1 text-[10px] font-semibold py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#F97316] hover:text-[#F97316] transition-colors"
            >
              <Phone className="w-3 h-3" />
              Appeler
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] font-bold py-1.5 px-2 rounded-lg bg-[#25D366] text-white hover:bg-[#22c55e] transition-colors"
            >
              <MessageCircle className="w-3 h-3" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group bg-white dark:bg-[#1e2430] rounded-2xl overflow-hidden border border-slate-100 dark:border-[#2a3040] hover:shadow-xl transition-shadow duration-200 animate-fadeIn",
        property.availableNow && "border-l-2 border-l-green-400",
        className
      )}
    >
      {/* Image */}
      <Link href={`/annonces/${property.id}`} className="block relative aspect-[4/3] overflow-hidden">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
            <Square className="w-12 h-12 text-slate-400" />
          </div>
        )}

        {/* Overlay badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Top badges */}
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
          <div className="flex flex-wrap gap-1">
            {property.isBoosted && (
              <span className="bg-[#F97316] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 fill-white" /> Sponsorisé
              </span>
            )}
            {property.availableNow ? (
              <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                ✅ Disponible
              </span>
            ) : (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                ❌ Déjà loué
              </span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleFavorite(property.id);
              toast(fav ? "Retiré des favoris" : "Ajouté aux favoris ❤️", fav ? "info" : "success");
            }}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all",
              fav ? "bg-red-500 text-white" : "bg-black/30 text-white hover:bg-black/50"
            )}
          >
            <Heart className={cn("w-4 h-4", fav && "fill-white")} />
          </button>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between">
          <span className="text-white/90 text-xs bg-black/30 rounded-full px-2 py-0.5">
            {TYPE_LABELS[property.type] ?? property.type}
          </span>
          <span className="text-white/70 text-xs flex items-center gap-1">
            <Eye className="w-3 h-3" /> {property.views}
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-3">
        <Link href={`/annonces/${property.id}`}>
          <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-2 text-sm leading-snug">
            {property.title}
          </h3>
        </Link>

        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs mt-1">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span>{neighborhoodLabel}, {property.city}</span>
        </div>

        {/* Price */}
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-[#F97316] font-bold text-lg">{formatPrice(property.price)}</span>
          {property.pricePeriod === "month" && (
            <span className="text-slate-400 text-xs">/mois</span>
          )}
        </div>

        {/* Specs */}
        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          {property.rooms && (
            <span className="flex items-center gap-1"><Bed className="w-3 h-3" />{property.rooms} ch.</span>
          )}
          {property.bathrooms && (
            <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{property.bathrooms} sdb</span>
          )}
          {property.surface && (
            <span className="flex items-center gap-1"><Square className="w-3 h-3" />{property.surface}m²</span>
          )}
          {property.furnished && (
            <span className="text-green-600 dark:text-green-400 font-medium">Meublé</span>
          )}
        </div>

        {/* Availability tag */}
        {property.availableNow && (
          <p className="text-[10px] font-bold text-orange-500 mt-1.5">⚡ Disponible immédiatement</p>
        )}

        {/* Trust badges */}
        {property.badges.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {property.badges.slice(0, 2).map((b) => (
              <TrustBadge key={b.id} badge={b} size="sm" />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <a
            href={phoneUrl}
            className="flex items-center justify-center gap-1 text-xs font-semibold py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#F97316] hover:text-[#F97316] transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            Appeler
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center text-xs font-bold py-2 px-3 rounded-xl bg-[#25D366] text-white hover:bg-[#22c55e] transition-colors flex items-center justify-center gap-1"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp
          </a>
          <button
            onClick={(e) => {
              e.preventDefault();
              if (compareList.includes(property.id)) {
                toast("Déjà dans le comparateur", "info");
              } else if (compareList.length >= 3) {
                toast("Maximum 3 annonces à comparer", "error");
              } else {
                addToCompare(property.id);
                toast("Ajouté au comparateur", "success");
              }
            }}
            className={cn(
              "flex items-center justify-center gap-1 text-xs font-semibold py-2 px-2.5 rounded-xl border transition-colors",
              compareList.includes(property.id)
                ? "border-[#F97316] text-[#F97316] bg-orange-50 dark:bg-orange-900/20"
                : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-[#F97316] hover:text-[#F97316]"
            )}
            title="Ajouter au comparateur"
          >
            <Scale className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-slate-400 text-[10px] mt-2">{timeAgo(property.createdAt)}</p>
      </div>
    </div>
  );
}
