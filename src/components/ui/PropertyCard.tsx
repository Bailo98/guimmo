"use client";
import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin, Bed, Bath, Square, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { toast } from "@/lib/toast";
import { WhatsAppShare } from "@/components/ui/WhatsAppShare";
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

  // Trust signals
  const isVerifiedOwner = property.owner.verified;
  const hasRealPhotos   = property.images.length > 0;
  const hasPhone        = !!(property.owner.phone || property.owner.whatsapp);
  const hasVideo        = !!property.videoUrl;

  const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://guimmo.gn";
  const shareUrl = `${siteUrl}/annonces/${property.id}`;
  const sharePrice = property.pricePeriod === "month"
    ? `${formatPrice(property.price)}/mois`
    : formatPrice(property.price);
  const createdAt = property.createdAt instanceof Date
    ? property.createdAt
    : new Date(property.createdAt as unknown as string);
  const isNew = Date.now() - createdAt.getTime() < 7 * 24 * 60 * 60 * 1000;

  // ── Horizontal variant ──────────────────────────────────────────
  if (variant === "horizontal") {
    return (
      <div
        className={cn("group flex gap-3 rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5", className)}
        style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <Link href={`/annonces/${property.id}`} className="relative w-28 flex-shrink-0">
          <div className="relative w-full h-full min-h-[100px]">
            {primaryImage ? (
              <Image src={primaryImage.url} alt={primaryImage.alt} fill className="object-cover" sizes="112px" />
            ) : (
              <div className="w-full h-full bg-white/5" />
            )}
          </div>
        </Link>
        <div className="flex-1 p-3 min-w-0">
          <Link href={`/annonces/${property.id}`}>
            <p className="font-bold text-sm text-white line-clamp-1">{property.title}</p>
            <div className="flex items-center gap-1 text-white/50 text-xs mt-0.5">
              <MapPin className="w-3 h-3 flex-shrink-0 text-white/40" />
              <span>{neighborhoodLabel}</span>
            </div>
            <p className="text-white font-bold text-sm mt-1">
              {formatPrice(property.price)}
              {property.pricePeriod === "month" && (
                <span className="text-xs font-normal text-white/40">/mois</span>
              )}
            </p>
          </Link>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-white/40">
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
    <div
      className={cn("group relative rounded-[20px] overflow-hidden hover:-translate-y-1 active:scale-[0.99] transition-all duration-300", className)}
      style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", border: "1px solid rgba(255,255,255,0.10)" }}
    >
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
          <div className="w-full h-full bg-white/5 flex items-center justify-center">
            <Square className="w-12 h-12 text-white/20" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

        {/* Top-left: type + badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          <span className="text-white/80 text-[11px] font-bold px-2.5 py-1 rounded-full leading-none" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
            {TYPE_LABELS[property.type] ?? property.type}
          </span>
          {hasVideo && (
            <span className="text-white text-[11px] font-bold px-2.5 py-1 rounded-full leading-none" style={{ background: "rgba(139,92,246,0.70)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
              🎥 Vidéo
            </span>
          )}
          {isNew && (
            <span className="text-white text-[11px] font-bold px-2.5 py-1 rounded-full leading-none" style={{ background: "rgba(255,255,255,0.20)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
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
                : "bg-black/40 backdrop-blur-sm text-white hover:bg-black/60"
            )}
          >
            <Heart className={cn("w-4 h-4", fav && "fill-white")} />
          </button>
          <div className="rounded-xl shadow-md px-2.5 py-1.5 text-right" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.20)" }}>
            <p className="text-white font-bold text-xs leading-tight">{formatPrice(property.price)}</p>
            {property.pricePeriod === "month" && (
              <p className="text-white/60 text-[10px] leading-tight">/mois</p>
            )}
          </div>
        </div>

        {/* Bottom overlay: title + location + specs */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-bold text-white text-sm leading-snug line-clamp-2 mb-0.5">
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
      {/* Trust badges */}
      {(isVerifiedOwner || hasRealPhotos || hasPhone || hasVideo) && (
        <div className="px-3 pb-1 flex flex-wrap gap-1">
          {isVerifiedOwner && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(110,201,122,0.15)", color: "#6ec97a", border: "1px solid rgba(110,201,122,0.25)" }}>
              ✓ Vérifié
            </span>
          )}
          {hasRealPhotos && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(200,144,30,0.15)", color: "#daa84a", border: "1px solid rgba(200,144,30,0.25)" }}>
              📷 Photos réelles
            </span>
          )}
          {hasPhone && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(37,211,102,0.12)", color: "#25D366", border: "1px solid rgba(37,211,102,0.25)" }}>
              💬 Contact direct
            </span>
          )}
          {hasVideo && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.25)" }}>
              🎥 Vidéo
            </span>
          )}
        </div>
      )}
      {/* WhatsApp share strip */}
      <div className="px-3 pb-3 pt-1">
        <WhatsAppShare
          title={property.title}
          neighborhood={neighborhoodLabel}
          price={sharePrice}
          url={shareUrl}
          size="sm"
          className="w-full"
        />
      </div>
    </div>
  );
}
