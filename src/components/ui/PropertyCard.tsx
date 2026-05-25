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

const WA_ICON_SM = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="white" aria-hidden="true" style={{ flexShrink: 0 }}>
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
  const didSwipe = useRef(false);

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

  function prev(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    setCurrentImg((i) => (i - 1 + imgCount) % imgCount);
  }
  function next(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    setCurrentImg((i) => (i + 1) % imgCount);
  }

  // Touch swipe to cycle images (without triggering navigation)
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 40) { didSwipe.current = false; return; }
    didSwipe.current = true;
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

  function handleContact(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    if (!user) { setShowAuthModal(true); return; }
    if (!phone) return;
    const cleaned = phone.replace(/\D/g, "");
    const ref = property.ref ? ` (${property.ref})` : "";
    const msg = `Bonjour, je suis intéressé par votre annonce : ${property.title}${ref}`;
    fetch("/api/track/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: property.id }),
    }).catch(() => null);
    window.open(`https://wa.me/${cleaned}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  }

  // ── Horizontal variant (sidebar, search results, etc.) ────────────────────
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

  // ── Default : immersive photo full-bleed card ──────────────────────────────
  return (
    <div
      className={cn("group", className)}
      style={{
        position: "relative",
        height: "min(72vw, 420px)",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        background: "#1a2026",
        flexShrink: 0,
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 20px 48px rgba(0,0,0,0.60)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.4)";
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Background photo ── */}
      {imgCount > 0 ? (
        <Image
          src={images[currentImg].url}
          alt={property.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          quality={75}
          priority={index < 4}
          loading={index < 4 ? undefined : "lazy"}
          style={{ zIndex: 0 }}
        />
      ) : (
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
          background: "#111820",
        }}>
          <Home style={{ width: 44, height: 44, color: "rgba(255,255,255,0.15)", strokeWidth: 1.2 }} />
          <span style={{ color: "rgba(255,255,255,0.18)", fontSize: 11 }}>Aucune photo</span>
        </div>
      )}

      {/* ── Bottom gradient overlay ── */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 1,
        background: "linear-gradient(transparent 30%, rgba(0,0,0,0.85) 70%, rgba(0,0,0,0.95) 100%)",
        pointerEvents: "none",
      }} />

      {/* ── Transparent link — full card click navigates ── */}
      <Link
        href={`/annonces/${property.id}`}
        aria-label={property.title}
        onClick={(e) => { if (didSwipe.current) { didSwipe.current = false; e.preventDefault(); } }}
        style={{ position: "absolute", inset: 0, zIndex: 2 }}
      />

      {/* ── Dot indicators — top center ── */}
      {imgCount > 1 && (
        <div style={{
          position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
          zIndex: 5, display: "flex", gap: 4, pointerEvents: "none",
        }}>
          {images.map((_, i) => (
            <div
              key={i}
              style={{
                height: 3,
                width: i === currentImg ? 20 : 6,
                borderRadius: 2,
                background: i === currentImg ? "#fff" : "rgba(255,255,255,0.40)",
                transition: "width 0.2s ease",
              }}
            />
          ))}
        </div>
      )}

      {/* ── Arrow nav (desktop hover) ── */}
      {imgCount > 1 && (
        <button
          onClick={prev}
          aria-label="Image précédente"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", zIndex: 5,
            width: 32, height: 32, background: "rgba(0,0,0,0.50)", border: "none",
            borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#fff", backdropFilter: "blur(4px)",
          }}
        >
          <ChevronLeft style={{ width: 16, height: 16 }} />
        </button>
      )}
      {imgCount > 1 && (
        <button
          onClick={next}
          aria-label="Image suivante"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", zIndex: 5,
            width: 32, height: 32, background: "rgba(0,0,0,0.50)", border: "none",
            borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#fff", backdropFilter: "blur(4px)",
          }}
        >
          <ChevronRight style={{ width: 16, height: 16 }} />
        </button>
      )}

      {/* ── Badges — top left ── */}
      <div style={{
        position: "absolute", top: 12, left: 12, zIndex: 5,
        display: "flex", gap: 4, flexWrap: "wrap", maxWidth: "calc(100% - 60px)",
        pointerEvents: "none",
      }}>
        {property.is_featured && <PropertyBadge type="premium" />}
        {property.is_diaspora && <PropertyBadge type="diaspora" />}
        {property.is_verified && !property.is_featured && <PropertyBadge type="verified" />}
        {isNew && !property.is_featured && !property.is_diaspora && <PropertyBadge type="new" />}
        {!property.is_featured && !property.is_diaspora && !property.is_verified && !isNew && (
          <span style={{
            background: "rgba(10,18,22,0.70)", color: "rgba(255,255,255,0.85)",
            fontSize: 10, padding: "3px 9px", borderRadius: 20, fontWeight: 600,
            whiteSpace: "nowrap", backdropFilter: "blur(6px)",
          }}>
            {TYPE_LABELS[property.type] ?? property.type}
          </span>
        )}
        {property.is_boosted && (
          <span style={{
            background: "#E9E900", color: "#0A1216",
            fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 700, whiteSpace: "nowrap",
          }}>
            ★ Pro
          </span>
        )}
        {property.video_url && (
          <span style={{
            background: "rgba(233,233,0,0.90)", color: "#0A1216",
            fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 700, whiteSpace: "nowrap",
          }}>
            ▶ Vidéo
          </span>
        )}
      </div>

      {/* ── Favorite button — top right ── */}
      <button
        onClick={handleFavorite}
        aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
        style={{
          position: "absolute", top: 12, right: 12, zIndex: 6,
          width: 38, height: 38,
          background: fav ? "rgba(239,68,68,0.25)" : "rgba(0,0,0,0.40)",
          border: fav ? "1.5px solid rgba(239,68,68,0.60)" : "1.5px solid rgba(255,255,255,0.18)",
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          color: fav ? "#ef4444" : "rgba(255,255,255,0.85)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          transition: "background 0.2s, border-color 0.2s",
        }}
      >
        <Heart style={{ width: 16, height: 16, fill: fav ? "#ef4444" : "none", stroke: "currentColor", strokeWidth: fav ? 0 : 1.8 }} />
      </button>

      {/* ── Info overlay — bottom left (right padding leaves room for contact btn) ── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 3,
        padding: "16px 76px 16px 16px",
        pointerEvents: "none",
      }}>
        {/* Ligne 1 : Prix + badge transaction */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
          <span style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            fontSize: 22,
            fontWeight: 700,
            color: "#C8A97E",
            lineHeight: 1.1,
            textShadow: "0 1px 8px rgba(0,0,0,0.5)",
          }}>
            {formatPrice(property.price)}
            {property.price_period === "month" && (
              <span style={{ fontSize: 13, fontWeight: 400, color: "rgba(200,169,126,0.80)" }}>/mois</span>
            )}
          </span>
          <span style={{
            flexShrink: 0,
            fontSize: 10,
            fontWeight: 700,
            padding: "3px 9px",
            borderRadius: 20,
            whiteSpace: "nowrap",
            ...(property.transaction_type === "rent"
              ? { background: "rgba(37,211,102,0.20)", color: "#25D366", border: "1px solid rgba(37,211,102,0.40)" }
              : { background: "rgba(74,158,255,0.20)", color: "#4A9EFF", border: "1px solid rgba(74,158,255,0.40)" }
            ),
          }}>
            {property.transaction_type === "rent" ? "Location" : "Vente"}
          </span>
          {showDiasporaPrice && property.is_diaspora && (
            <span style={{ fontSize: 10, color: "#4A9EFF", fontWeight: 500, whiteSpace: "nowrap" }}>
              ≈ {formatUsd(property.price)} USD
            </span>
          )}
        </div>

        {/* Ligne 2 : Titre */}
        <p style={{
          fontSize: 16,
          fontWeight: 600,
          color: "#FFFFFF",
          margin: "0 0 5px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          lineHeight: 1.3,
          textShadow: "0 1px 6px rgba(0,0,0,0.6)",
        }}>
          {property.title}
        </p>

        {/* Ligne 3 : Quartier + chambres */}
        <p style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.78)",
          margin: "0 0 10px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          📍 {neighborhoodLabel}
          {(property.rooms ?? 0) > 0 && ` · 🛏️ ${property.rooms} ch.`}
          {distanceStr && <span style={{ color: "#4A9EFF", marginLeft: 4 }}>· {distanceStr}</span>}
        </p>

        {/* Barre de score 3px dorée */}
        <ListingScore
          images={(property.property_images ?? []).length}
          description={property.description}
          phone={property.contact_phone}
          surface={property.surface}
          rooms={property.rooms}
          compact
        />
      </div>

      {/* ── Contact button — bottom right ── */}
      {phone && (
        <button
          type="button"
          onClick={handleContact}
          aria-label="Contacter sur WhatsApp"
          style={{
            position: "absolute", bottom: 16, right: 16, zIndex: 6,
            display: "flex", alignItems: "center", gap: 6,
            background: "#25D366",
            color: "white",
            border: "none",
            borderRadius: 50,
            padding: "10px 16px",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(37,211,102,0.45)",
            transition: "background 0.18s ease, transform 0.12s ease",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#1dbb5a";
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#25D366";
            (e.currentTarget as HTMLButtonElement).style.transform = "";
          }}
        >
          {WA_ICON_SM}
          💬 Contacter
        </button>
      )}

      {showAuthModal && (
        <AuthPromptModal
          onClose={() => setShowAuthModal(false)}
          redirectUrl={`/annonces/${property.id}`}
          action="contacter le propriétaire"
        />
      )}
    </div>
  );
}
