"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ChevronLeft, ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/lib/toast";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { WhatsAppShare } from "@/components/ui/WhatsAppShare";
import { AuthPromptModal } from "@/components/AuthPromptModal";
import { ListingScore } from "@/components/ListingScore";
import { PropertyBadge } from "@/components/PropertyBadge";
import { formatUsd } from "@/lib/config";
import { haversineKm, formatDistance } from "@/lib/haversine";
import { NEIGHBORHOOD_COORDINATES } from "@/data/neighborhoods";
import type { Property } from "@/types";

interface PropertyCardProps {
  property: Property;
  variant?: "default" | "compact" | "horizontal";
  className?: string;
  index?: number;
  userLocation?: { lat: number; lng: number } | null;
  showDiasporaPrice?: boolean;
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

const WA_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="white" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export function PropertyCard({
  property,
  variant = "default",
  className,
  index = 0,
  userLocation = null,
  showDiasporaPrice = false,
}: PropertyCardProps) {
  const { toggleFavorite, isFavorite, _hasHydrated } = useAppStore();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentImg, setCurrentImg] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const fav = _hasHydrated && isFavorite(property.id);
  const images = [...(property.property_images ?? [])].sort((a, b) =>
    a.is_primary === b.is_primary ? 0 : a.is_primary ? -1 : 1
  );
  const imgCount = images.length;
  const primaryImage = images[0];

  const neighborhoodLabel = NEIGHBORHOOD_LABELS[property.neighborhood] ?? property.neighborhood;
  const phone = property.contact_phone;
  const sharePrice = property.price_period === "month"
    ? `${formatPrice(property.price)}/mois`
    : formatPrice(property.price);
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://LogerBien.gn";
  const shareUrl = `${siteUrl}/annonces/${property.id}`;
  const createdAt = new Date(property.created_at ?? Date.now());
  const isNew = Date.now() - createdAt.getTime() < 48 * 60 * 60 * 1000;

  // Distance
  let distanceStr: string | null = null;
  const pLat = property.lat ?? property.latitude ?? null;
  const pLng = property.lng ?? property.longitude ?? null;
  if (userLocation && pLat && pLng) {
    distanceStr = formatDistance(haversineKm(userLocation.lat, userLocation.lng, pLat, pLng));
  } else if (userLocation) {
    const coords = NEIGHBORHOOD_COORDINATES[property.neighborhood];
    if (coords) distanceStr = `~${formatDistance(haversineKm(userLocation.lat, userLocation.lng, coords[0], coords[1]))}`;
  }

  function prev(e: React.MouseEvent) { e.preventDefault(); e.stopPropagation(); setCurrentImg((i) => (i - 1 + imgCount) % imgCount); }
  function next(e: React.MouseEvent) { e.preventDefault(); e.stopPropagation(); setCurrentImg((i) => (i + 1) % imgCount); }
  function onTouchStart(e: React.TouchEvent) { touchStartX.current = e.touches[0].clientX; }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) setCurrentImg((i) => (i + 1) % imgCount);
    else setCurrentImg((i) => (i - 1 + imgCount) % imgCount);
  }

  async function handleFavorite(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    if (!user) { setShowAuthModal(true); return; }
    const willBeFav = !fav;
    toggleFavorite(property.id);
    toast(willBeFav ? "❤️ Ajouté aux favoris" : "Retiré des favoris", willBeFav ? "success" : "info");
    if (isSupabaseConfigured && supabase) {
      try {
        if (willBeFav) {
          await supabase.from("favorites").upsert(
            { user_id: user.id, property_id: property.id },
            { onConflict: "user_id,property_id", ignoreDuplicates: true }
          );
        } else {
          await supabase.from("favorites").delete().eq("user_id", user.id).eq("property_id", property.id);
        }
      } catch { /* silent */ }
    }
  }

  // ── Horizontal variant (search results sidebar, etc.) ─────────────────────
  if (variant === "horizontal") {
    return (
      <div
        className={cn("group flex gap-3 rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5", className)}
        style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <Link href={`/annonces/${property.id}`} className="relative w-28 flex-shrink-0">
          <div className="relative w-full h-full min-h-[100px]">
            {primaryImage ? (
              <Image src={primaryImage.url} alt={property.title} fill className="object-cover" sizes="112px" loading="lazy" />
            ) : (
              <div className="w-full h-full bg-white/5" />
            )}
          </div>
        </Link>
        <div className="flex-1 p-3 min-w-0">
          <Link href={`/annonces/${property.id}`}>
            <p className="font-bold text-sm text-white line-clamp-1">{property.title}</p>
            <div className="flex items-center gap-1 text-white/50 text-xs mt-0.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-shrink-0 text-white/40">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              <span>{neighborhoodLabel}</span>
            </div>
            <p className="text-white font-bold text-sm mt-1">
              {formatPrice(property.price)}
              {property.price_period === "month" && <span className="text-xs font-normal text-white/40">/mois</span>}
            </p>
          </Link>
        </div>
      </div>
    );
  }

  // ── Default (full) variant ─────────────────────────────────────────────────
  return (
    <div
      className={cn("group flex flex-col", className)}
      style={{
        background: "var(--bg-card, #161B26)",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
        border: "1px solid var(--border-subtle, rgba(255,255,255,0.06))",
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 16px 40px rgba(0,0,0,0.50)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.35)";
      }}
    >
      {/* ── Photo ──────────────────────────────────────────────────────────── */}
      <Link
        href={`/annonces/${property.id}`}
        className="relative block flex-shrink-0 group/img"
        style={{ height: 220, overflow: "hidden", borderRadius: "16px 16px 0 0" }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {imgCount > 0 ? (
          <Image
            src={images[currentImg].url}
            alt={property.title}
            fill
            className="object-cover group-hover/img:scale-[1.03] transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            quality={70}
            priority={index < 4}
            loading={index < 4 ? undefined : "lazy"}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2"
            style={{ background: "#1a2026" }}>
            <Home style={{ width: 40, height: 40, color: "rgba(255,255,255,0.18)", strokeWidth: 1.5 }} />
            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>Aucune photo</span>
          </div>
        )}

        {/* ── Left / Right arrows ── */}
        {imgCount > 1 && (
          <button onClick={prev} aria-label="Image précédente"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover/img:opacity-100 transition-opacity"
            style={{ width: 30, height: 30, background: "rgba(0,0,0,0.55)", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", backdropFilter: "blur(4px)" }}>
            <ChevronLeft style={{ width: 15, height: 15 }} />
          </button>
        )}
        {imgCount > 1 && (
          <button onClick={next} aria-label="Image suivante"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover/img:opacity-100 transition-opacity"
            style={{ width: 30, height: 30, background: "rgba(0,0,0,0.55)", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", backdropFilter: "blur(4px)" }}>
            <ChevronRight style={{ width: 15, height: 15 }} />
          </button>
        )}

        {/* ── Dot indicators ── */}
        {imgCount > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
            {images.map((_, i) => (
              <button key={i} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentImg(i); }}
                aria-label={`Image ${i + 1}`}
                style={{ width: i === currentImg ? 14 : 5, height: 5, borderRadius: 3, background: i === currentImg ? "#fff" : "rgba(255,255,255,0.45)", border: "none", cursor: "pointer", padding: 0, transition: "width 0.2s ease" }} />
            ))}
          </div>
        )}

        {/* ── Badges — top left ── */}
        <div className="absolute flex items-center gap-1 flex-wrap" style={{ top: 10, left: 10, maxWidth: "calc(100% - 50px)", zIndex: 10 }}>
          {property.is_featured && <PropertyBadge type="premium" />}
          {property.is_diaspora && <PropertyBadge type="diaspora" />}
          {property.is_verified && !property.is_featured && <PropertyBadge type="verified" />}
          {isNew && !property.is_featured && !property.is_diaspora && <PropertyBadge type="new" />}
          {!property.is_featured && !property.is_diaspora && !property.is_verified && !isNew && (
            <span style={{ background: "rgba(10,18,22,0.70)", color: "rgba(255,255,255,0.85)", fontSize: 10, padding: "3px 9px", borderRadius: 20, fontWeight: 600, whiteSpace: "nowrap", backdropFilter: "blur(6px)" }}>
              {TYPE_LABELS[property.type] ?? property.type}
            </span>
          )}
          {property.is_boosted && (
            <span style={{ background: "#E9E900", color: "#0A1216", fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 700, whiteSpace: "nowrap" }}>
              ★ Pro
            </span>
          )}
          {property.video_url && (
            <span style={{ background: "rgba(233,233,0,0.90)", color: "#0A1216", fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 700, whiteSpace: "nowrap" }}>
              ▶ Vidéo
            </span>
          )}
        </div>

        {/* ── Favorite button — top right ── */}
        <button
          onClick={handleFavorite}
          aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
          style={{
            position: "absolute", top: 10, right: 10, zIndex: 10,
            width: 36, height: 36,
            background: fav ? "rgba(239,68,68,0.20)" : "rgba(10,18,22,0.60)",
            border: fav ? "1.5px solid rgba(239,68,68,0.60)" : "1.5px solid rgba(255,255,255,0.15)",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            color: fav ? "#ef4444" : "rgba(255,255,255,0.75)",
            backdropFilter: "blur(6px)",
            transition: "background 0.2s, border-color 0.2s",
          }}
        >
          <Heart style={{ width: 16, height: 16, fill: fav ? "#ef4444" : "none", stroke: "currentColor", strokeWidth: fav ? 0 : 1.8 }} />
        </button>
      </Link>

      {/* ── Card body ──────────────────────────────────────────────────────── */}
      <div style={{
        padding: "14px 16px",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        background: "var(--bg-card, #161B26)",
        borderRadius: "0 0 16px 16px",
      }}>

        {/* ── Ligne 1 : Prix + Badge transaction ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <span style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: 20,
              fontWeight: 700,
              color: "var(--accent-gold, #C8A97E)",
              lineHeight: 1.2,
              display: "block",
            }}>
              {formatPrice(property.price)}
              {property.price_period === "month" && (
                <span style={{ fontSize: 12, fontWeight: 400, color: "rgba(200,169,126,0.75)" }}>/mois</span>
              )}
            </span>
            {showDiasporaPrice && property.is_diaspora && (
              <span style={{ fontSize: 11, color: "#4A9EFF", fontWeight: 500 }}>
                ≈ {formatUsd(property.price)} USD
              </span>
            )}
          </div>
          <span style={{
            flexShrink: 0,
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: 20,
            whiteSpace: "nowrap",
            ...(property.transaction_type === "rent"
              ? { background: "rgba(233,233,0,0.15)", color: "#E9E900", border: "1px solid rgba(233,233,0,0.30)" }
              : { background: "rgba(74,158,255,0.12)", color: "#4A9EFF", border: "1px solid rgba(74,158,255,0.25)" }
            ),
          }}>
            {property.transaction_type === "rent" ? "Location" : "Vente"}
          </span>
        </div>

        {/* ── Ligne 2 : Titre ── */}
        <p style={{
          fontSize: 16,
          fontWeight: 600,
          color: "#F5F5F5",
          margin: 0,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          lineHeight: 1.35,
        }}>
          {property.title}
        </p>

        {/* ── Ligne 3 : Quartier + distance ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 13,
          color: "var(--text-secondary-new, rgba(138,143,168,0.90))",
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 3, minWidth: 0 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, opacity: 0.7 }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {neighborhoodLabel}, Conakry
            </span>
          </span>
          {distanceStr && (
            <span style={{ flexShrink: 0, fontSize: 11, color: "#4A9EFF", fontWeight: 500 }}>
              · {distanceStr}
            </span>
          )}
        </div>

        {/* ── Ligne 4 : Specs ── */}
        {((property.rooms ?? 0) > 0 || (property.surface ?? 0) > 0 || (property.bathrooms ?? 0) > 0) && (
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {(property.rooms ?? 0) > 0 && (
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: 3 }}>
                🛏️ {property.rooms} ch.
              </span>
            )}
            {(property.surface ?? 0) > 0 && (
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: 3 }}>
                📐 {property.surface} m²
              </span>
            )}
            {(property.bathrooms ?? 0) > 0 && (
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: 3 }}>
                🚿 {property.bathrooms}
              </span>
            )}
          </div>
        )}

        {/* ── Ligne 5 : Score de confiance (barre fine) ── */}
        <ListingScore
          images={(property.property_images ?? []).length}
          description={property.description}
          phone={property.contact_phone}
          surface={property.surface}
          rooms={property.rooms}
          compact
        />

        {/* ── Bouton Contacter ── */}
        {phone ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!user) { setShowAuthModal(true); return; }
              const cleaned = phone.replace(/\D/g, "");
              const ref = property.ref ? ` (${property.ref})` : "";
              const msg = `Bonjour, je suis intéressé par votre annonce : ${property.title}${ref}`;
              fetch("/api/track/whatsapp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ propertyId: property.id }),
              }).catch(() => null);
              window.open(`https://wa.me/${cleaned}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
            }}
            style={{
              width: "100%",
              height: 44,
              background: "#25D366",
              color: "white",
              border: "none",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: "pointer",
              marginTop: 4,
              transition: "background 0.18s ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#1dbb5a"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#25D366"; }}
          >
            {WA_ICON}
            💬 Contacter
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
