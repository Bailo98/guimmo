"use client";
import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin, Bed, Bath, Square, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { toast } from "@/lib/toast";
import type { Property } from "@/types";

interface PropertyCardProps {
  property: Property;
  variant?: "default" | "compact" | "horizontal";
  className?: string;
  index?: number;
}

const TYPE_LABELS: Record<string, string> = {
  apartment: "Appartement", house: "Maison", studio: "Studio",
  villa: "Villa", room: "Chambre", office: "Bureau", shop: "Boutique", land: "Terrain",
};

const NEIGHBORHOOD_LABELS: Record<string, string> = {
  kipe: "Kipé", lambanyi: "Lambanyi", ratoma: "Ratoma", sonfonia: "Sonfonia",
  cosa: "Cosa", hamdallaye: "Hamdallaye", nongo: "Nongo", taouyah: "Taouyah",
  dixinn: "Dixinn", matam: "Matam", madina: "Madina", kaloum: "Kaloum",
};

export function PropertyCard({ property, variant = "default", className, index = 0 }: PropertyCardProps) {
  const { toggleFavorite, isFavorite, _hasHydrated } = useAppStore();
  const fav = _hasHydrated && isFavorite(property.id);
  const primaryImage = property.images.find((i) => i.isPrimary) ?? property.images[0];
  const neighborhoodLabel = NEIGHBORHOOD_LABELS[property.neighborhood] ?? property.neighborhood;
  const createdAt = property.createdAt instanceof Date
    ? property.createdAt
    : new Date(property.createdAt as unknown as string);
  const isNew = Date.now() - createdAt.getTime() < 7 * 24 * 60 * 60 * 1000;

  // ── Horizontal variant (NearbySection, etc.) ────────────────────
  if (variant === "horizontal") {
    return (
      <div className={cn(
        "group flex gap-3 bg-white rounded-2xl overflow-hidden",
        "shadow-[0_2px_16px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.12)]",
        "transition-shadow duration-200",
        className
      )}>
        <Link href={`/annonces/${property.id}`} className="relative w-28 flex-shrink-0">
          <div className="relative w-full h-full min-h-[100px]">
            {primaryImage ? (
              <Image src={primaryImage.url} alt={primaryImage.alt} fill className="object-cover" sizes="112px" />
            ) : (
              <div className="w-full h-full bg-slate-100" />
            )}
          </div>
        </Link>
        <div className="flex-1 p-3 min-w-0">
          <Link href={`/annonces/${property.id}`}>
            <p className="font-bold text-sm text-[#1A1A1A] line-clamp-1">{property.title}</p>
            <div className="flex items-center gap-1 text-[#6B7280] text-xs mt-0.5">
              <MapPin className="w-3 h-3 flex-shrink-0 text-[#F97316]" />
              <span>{neighborhoodLabel}</span>
            </div>
            <p className="text-[#F97316] font-bold text-sm mt-1">
              {formatPrice(property.price)}
              {property.pricePeriod === "month" && (
                <span className="text-xs font-normal text-[#6B7280]">/mois</span>
              )}
            </p>
          </Link>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-[#6B7280]">
            {(property.rooms ?? 0) > 0 && (
              <span className="flex items-center gap-0.5"><Bed className="w-3 h-3" />{property.rooms}</span>
            )}
            {(property.bathrooms ?? 0) > 0 && (
              <span className="flex items-center gap-0.5"><Bath className="w-3 h-3" />{property.bathrooms}</span>
            )}
            {(property.surface ?? 0) > 0 && (
              <span className="flex items-center gap-0.5"><Square className="w-3 h-3" />{property.surface}m²</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Default variant — pure overlay card ─────────────────────────
  return (
    <div className={cn(
      "group relative rounded-[20px] overflow-hidden bg-white",
      "shadow-[0_4px_24px_rgba(0,0,0,0.10)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.18)]",
      "hover:-translate-y-1 transition-all duration-300",
      className
    )}>
      <Link href={`/annonces/${property.id}`} className="block relative h-[220px]">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={index < 4}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
            <Square className="w-12 h-12 text-slate-400" />
          </div>
        )}

        {/* Gradient overlay — stronger at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

        {/* Top-left: type + badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          <span className="bg-white/90 backdrop-blur-sm text-[#1A1A1A] text-[11px] font-bold px-2.5 py-1 rounded-full leading-none">
            {TYPE_LABELS[property.type] ?? property.type}
          </span>
          {isNew && (
            <span className="bg-[#F97316] text-white text-[11px] font-bold px-2.5 py-1 rounded-full leading-none">
              Nouveau
            </span>
          )}
          {property.isBoosted && (
            <span className="bg-amber-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 leading-none">
              <Star className="w-2.5 h-2.5 fill-white" /> Sponsorisé
            </span>
          )}
        </div>

        {/* Top-right: heart + price badge */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(property.id);
              toast(fav ? "Retiré des favoris" : "Ajouté aux favoris", fav ? "info" : "success");
            }}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md",
              fav
                ? "bg-red-500 text-white"
                : "bg-white/90 backdrop-blur-sm text-[#1A1A1A] hover:bg-white"
            )}
          >
            <Heart className={cn("w-4 h-4", fav && "fill-white")} />
          </button>
          <div className="bg-white rounded-xl shadow-md px-2.5 py-1.5 text-right">
            <p className="text-[#F97316] font-bold text-xs leading-tight">{formatPrice(property.price)}</p>
            {property.pricePeriod === "month" && (
              <p className="text-[#6B7280] text-[10px] leading-tight">/mois</p>
            )}
          </div>
        </div>

        {/* Bottom overlay: title + location + specs */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-bold text-white text-sm leading-snug line-clamp-1 mb-0.5">
            {property.title}
          </h3>
          <div className="flex items-center gap-1 text-white/80 mb-2">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="text-[11px] truncate">{neighborhoodLabel}, {property.city}</span>
          </div>
          <div className="flex items-center gap-3 text-white/70 text-[11px]">
            {(property.rooms ?? 0) > 0 && (
              <span className="flex items-center gap-1"><Bed className="w-3 h-3" />{property.rooms} ch.</span>
            )}
            {(property.bathrooms ?? 0) > 0 && (
              <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{property.bathrooms} sdb</span>
            )}
            {(property.surface ?? 0) > 0 && (
              <span className="flex items-center gap-1"><Square className="w-3 h-3" />{property.surface}m²</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
