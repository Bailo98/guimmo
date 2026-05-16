"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin, Bed, Bath, Square, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/lib/toast";
import { WhatsAppShare } from "@/components/ui/WhatsAppShare";
import { AuthPromptModal } from "@/components/AuthPromptModal";
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

const WA_ICON_SM = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export function PropertyCard({ property, variant = "default", className, index = 0 }: PropertyCardProps) {
  const { toggleFavorite, isFavorite, _hasHydrated } = useAppStore();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const fav = _hasHydrated && isFavorite(property.id);
  const primaryImage = property.property_images?.find((i) => i.is_primary) ?? property.property_images?.[0];
  const neighborhoodLabel = NEIGHBORHOOD_LABELS[property.neighborhood] ?? property.neighborhood;
  const phone = property.contact_phone;
  const sharePrice = property.price_period === "month"
    ? `${formatPrice(property.price)}/mois`
    : formatPrice(property.price);
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://bienloger.gn";
  const shareUrl = `${siteUrl}/annonces/${property.id}`;
  const createdAt = new Date(property.created_at ?? Date.now());
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
              <Image src={primaryImage.url} alt={property.title} fill className="object-cover" sizes="112px" />
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
              {property.price_period === "month" && (
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

  // ── Default variant — redesigned dark card ──────────────────────
  return (
    <div
      className={cn("group flex flex-col rounded-[14px] overflow-hidden transition-all duration-200 hover:-translate-y-1", className)}
      style={{
        background: "#1a2e1e",
        border: "1px solid rgba(240,230,204,0.10)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      }}
    >
      {/* Image */}
      <Link href={`/annonces/${property.id}`} className="relative block flex-shrink-0" style={{ height: 200 }}>
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={property.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            quality={65}
            priority={index < 4}
            loading={index < 4 ? undefined : "lazy"}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "#0d1a10" }}>
            <Square className="w-10 h-10" style={{ color: "rgba(240,230,204,0.15)" }} />
          </div>
        )}

        {/* Gradient overlay at bottom */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(26,46,30,0.85) 0%, transparent 50%)" }} />

        {/* Top-left: type badge */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          <span
            className="text-white text-[11px] font-bold px-2.5 py-1 rounded-full leading-none"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
          >
            {TYPE_LABELS[property.type] ?? property.type}
          </span>
          {property.is_boosted && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full leading-none flex items-center gap-1" style={{ background: "rgba(200,144,30,0.20)", color: "#daa84a", border: "1px solid rgba(200,144,30,0.30)" }}>
              <Star className="w-2.5 h-2.5 fill-current" /> Sponsorisé
            </span>
          )}
          {isNew && !property.is_boosted && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full leading-none" style={{ background: "rgba(0,0,0,0.45)", color: "#f7f2e6" }}>
              Nouveau
            </span>
          )}
        </div>

        {/* Top-right: favorite + price badge */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!user) { setShowAuthModal(true); return; }
              toggleFavorite(property.id);
              toast(fav ? "Retiré des favoris" : "Ajouté aux favoris", fav ? "info" : "success");
            }}
            aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md",
              fav ? "bg-red-500 text-white" : "bg-black/50 backdrop-blur-sm text-white hover:bg-black/70"
            )}
          >
            <Heart className={cn("w-4 h-4", fav && "fill-white")} />
          </button>
          <div className="rounded-xl shadow-md px-2.5 py-1.5 text-right" style={{ background: "#c8901e" }}>
            <p className="text-white font-bold text-xs leading-tight">{formatPrice(property.price)}</p>
            {property.price_period === "month" && (
              <p className="text-white/70 text-[10px] leading-tight">/mois</p>
            )}
          </div>
        </div>

        {/* Video badge bottom-left */}
        {property.video_url && (
          <div className="absolute bottom-3 left-3">
            <span className="text-white text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(139,92,246,0.70)", backdropFilter: "blur(6px)" }}>
              🎥 Vidéo
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3.5 gap-0">
        {/* Title */}
        <Link href={`/annonces/${property.id}`}>
          <h3
            className="font-semibold line-clamp-2 leading-snug mb-1"
            style={{ fontSize: 15, color: "#f7f2e6" }}
          >
            {property.title}
          </h3>
        </Link>

        {/* Neighborhood */}
        <div className="flex items-center gap-1 mb-2.5" style={{ color: "rgba(240,230,204,0.60)", fontSize: 13 }}>
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{neighborhoodLabel}, {property.city}</span>
        </div>

        {/* Specs */}
        {((property.rooms ?? 0) > 0 || (property.bathrooms ?? 0) > 0 || (property.surface ?? 0) > 0) && (
          <div
            className="flex items-center gap-4 py-2.5 mb-2.5"
            style={{
              borderTop: "1px solid rgba(240,230,204,0.08)",
              borderBottom: "1px solid rgba(240,230,204,0.08)",
              fontSize: 13,
              color: "rgba(240,230,204,0.70)",
            }}
          >
            {(property.rooms ?? 0) > 0 && (
              <span className="flex items-center gap-1.5">
                <Bed className="w-3.5 h-3.5 flex-shrink-0" />
                {property.rooms} ch.
              </span>
            )}
            {(property.bathrooms ?? 0) > 0 && (
              <span className="flex items-center gap-1.5">
                <Bath className="w-3.5 h-3.5 flex-shrink-0" />
                {property.bathrooms} sdb
              </span>
            )}
            {(property.surface ?? 0) > 0 && (
              <span className="flex items-center gap-1.5">
                <Square className="w-3.5 h-3.5 flex-shrink-0" />
                {property.surface} m²
              </span>
            )}
          </div>
        )}

        {/* Micro-badges eau / électricité */}
        {((property.water_source && property.water_source !== "none") ||
          (property.electricity && property.electricity !== "none") ||
          property.internet === "wifi") && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
            {property.water_source && property.water_source !== "none" && (
              <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(240,230,204,0.60)", background: "rgba(240,230,204,0.07)", border: "1px solid rgba(240,230,204,0.12)", borderRadius: 999, padding: "3px 8px" }}>
                💧 {property.water_source === "robinet" ? "Robinet" : property.water_source === "forage" ? "Forage" : "Citerne"}
              </span>
            )}
            {property.electricity && property.electricity !== "none" && (
              <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(240,230,204,0.60)", background: "rgba(240,230,204,0.07)", border: "1px solid rgba(240,230,204,0.12)", borderRadius: 999, padding: "3px 8px" }}>
                ⚡ {property.electricity === "edg" ? "EDG" : property.electricity === "solaire" ? "Solaire" : "Groupe"}
              </span>
            )}
            {property.internet === "wifi" && (
              <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(240,230,204,0.60)", background: "rgba(240,230,204,0.07)", border: "1px solid rgba(240,230,204,0.12)", borderRadius: 999, padding: "3px 8px" }}>
                📶 WiFi
              </span>
            )}
          </div>
        )}

        {/* WhatsApp contact button */}
        <div className="mt-auto pt-1">
          {phone ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const cleaned = phone.replace(/\D/g, "");
                const ref = property.ref ? ` (${property.ref})` : "";
                const msg = `Bonjour, je suis intéressé par votre annonce : ${property.title}${ref}`;
                fetch("/api/track/whatsapp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ propertyId: property.id }) }).catch(() => null);
                window.open(`https://wa.me/${cleaned}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
              }}
              className="w-full flex items-center justify-center gap-2 font-bold text-white transition-opacity hover:opacity-85"
              style={{
                background: "#25D366",
                minHeight: 48,
                borderRadius: 10,
                fontSize: 13,
              }}
            >
              {WA_ICON_SM}
              Contacter sur WhatsApp
            </button>
          ) : (
            <WhatsAppShare
              title={property.title}
              neighborhood={neighborhoodLabel}
              price={sharePrice}
              url={shareUrl}
              size="sm"
              className="w-full"
            />
          )}
        </div>
      </div>

      {showAuthModal && (
        <AuthPromptModal
          onClose={() => setShowAuthModal(false)}
          redirectUrl={`/annonces/${property.id}`}
          action="sauvegarder cette annonce"
        />
      )}
    </div>
  );
}
