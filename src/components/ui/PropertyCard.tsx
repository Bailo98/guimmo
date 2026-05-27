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
import { AuthPromptModal } from "@/components/AuthPromptModal";
import { PropertyBadge, TypeBadge } from "@/components/PropertyBadge";
import { ReactionBar } from "@/components/property/ReactionBar";
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

const NEIGHBORHOOD_LABELS: Record<string, string> = {
  kipe: "Kipé", lambanyi: "Lambanyi", ratoma: "Ratoma", sonfonia: "Sonfonia",
  cosa: "Cosa", hamdallaye: "Hamdallaye", nongo: "Nongo", taouyah: "Taouyah",
  dixinn: "Dixinn", matam: "Matam", madina: "Madina", kaloum: "Kaloum",
};

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
  const createdAt = new Date(property.created_at ?? Date.now());
  const isNew = Date.now() - createdAt.getTime() < 48 * 60 * 60 * 1000;

  // Distance from user
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

  // ── Horizontal variant ────────────────────────────────────────────────────────
  if (variant === "horizontal") {
    return (
      <div
        className={cn("group flex gap-3 rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5", className)}
        style={{
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
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

  // ── Default : immersive full-bleed photo card ─────────────────────────────────
  return (
    <div
      className={cn("group property-card-default", className)}
      style={{
        position: "relative",
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

      {/* ── Gradient overlay ── */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 1,
        background: "linear-gradient(transparent 20%, rgba(0,0,0,0.75) 60%, rgba(0,0,0,0.97) 100%)",
        pointerEvents: "none",
      }} />

      {/* ── Full-card navigation link ── */}
      <Link
        href={`/annonces/${property.id}`}
        aria-label={property.title}
        onClick={(e) => { if (didSwipe.current) { didSwipe.current = false; e.preventDefault(); } }}
        style={{ position: "absolute", inset: 0, zIndex: 2 }}
      />

      {/* ── Image dot indicators ── */}
      {imgCount > 1 && (
        <div style={{
          position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
          zIndex: 5, display: "flex", gap: 4, pointerEvents: "none",
        }}>
          {images.map((_, i) => (
            <div key={i} style={{
              height: 3,
              width: i === currentImg ? 20 : 6,
              borderRadius: 2,
              background: i === currentImg ? "#fff" : "rgba(255,255,255,0.40)",
              transition: "width 0.2s ease",
            }} />
          ))}
        </div>
      )}

      {/* ── Arrow nav (desktop hover) ── */}
      {imgCount > 1 && (
        <button onClick={prev} aria-label="Image précédente"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            position: "absolute", left: 10, top: "40%", transform: "translateY(-50%)", zIndex: 5,
            width: 32, height: 32, background: "rgba(0,0,0,0.50)", border: "none",
            borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#fff", backdropFilter: "blur(4px)",
          }}>
          <ChevronLeft style={{ width: 16, height: 16 }} />
        </button>
      )}
      {imgCount > 1 && (
        <button onClick={next} aria-label="Image suivante"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            position: "absolute", right: 10, top: "40%", transform: "translateY(-50%)", zIndex: 5,
            width: 32, height: 32, background: "rgba(0,0,0,0.50)", border: "none",
            borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#fff", backdropFilter: "blur(4px)",
          }}>
          <ChevronRight style={{ width: 16, height: 16 }} />
        </button>
      )}

      {/* ── Badges — top left ── */}
      <div style={{
        position: "absolute", top: 12, left: 12, zIndex: 5,
        display: "flex", gap: 4, flexWrap: "wrap", maxWidth: "calc(100% - 60px)",
        pointerEvents: "none",
      }}>
        <TypeBadge propertyType={property.type} />
        {property.is_featured && <PropertyBadge type="premium" />}
        {property.is_diaspora && <PropertyBadge type="diaspora" />}
        {property.is_verified && !property.is_featured && <PropertyBadge type="verified" />}
        {isNew && !property.is_featured && !property.is_diaspora && <PropertyBadge type="new" />}
        {property.is_boosted && (
          <span style={{
            background: "#E9E900", color: "#0A1216",
            fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 700, whiteSpace: "nowrap",
          }}>★ Pro</span>
        )}
        {property.video_url && (
          <span style={{
            background: "rgba(233,233,0,0.90)", color: "#0A1216",
            fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 700, whiteSpace: "nowrap",
          }}>▶ Vidéo</span>
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

      {/* ── Bottom info overlay (100% photo, no external text zone) ── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 3,
        padding: "10px 14px 14px",
        pointerEvents: "none",
      }}>

        {/* Reaction bar — always visible mobile, hover on desktop */}
        <div
          className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200"
          style={{ marginBottom: 8, pointerEvents: "auto" }}
        >
          <ReactionBar propertyId={property.id} compact />
        </div>

        {/* Prix badge doré + transaction chip */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
          <span style={{
            background: "var(--accent-gold, #C8A97E)",
            borderRadius: 12,
            padding: "6px 12px",
            display: "inline-flex",
            alignItems: "baseline",
            gap: 3,
            flexShrink: 0,
          }}>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 17, lineHeight: 1 }}>
              {formatPrice(property.price)}
            </span>
            {property.price_period === "month" && (
              <span style={{ color: "rgba(255,255,255,0.80)", fontSize: 11 }}>/mois</span>
            )}
          </span>
          <span style={{
            flexShrink: 0, fontSize: 10, fontWeight: 700,
            padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap",
            ...(property.transaction_type === "rent"
              ? { background: "rgba(37,211,102,0.20)", color: "#25D366", border: "1px solid rgba(37,211,102,0.40)" }
              : { background: "rgba(74,158,255,0.20)", color: "#4A9EFF", border: "1px solid rgba(74,158,255,0.40)" }),
          }}>
            {property.transaction_type === "rent" ? "Location" : "Vente"}
          </span>
        </div>

        {/* Prix USD (mode diaspora) */}
        {showDiasporaPrice && (
          <p style={{ fontSize: 11, color: "#8A8FA8", margin: "0 0 4px", lineHeight: 1, fontWeight: 500 }}>
            ~{Math.round(property.price / 8600).toLocaleString("en-US")} USD
            {property.price_period === "month" ? "/mois" : ""}
          </p>
        )}

        {/* Titre */}
        <p style={{
          fontSize: 15, fontWeight: 600, color: "#FFFFFF",
          margin: "0 0 3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          lineHeight: 1.3, textShadow: "0 1px 6px rgba(0,0,0,0.6)",
        }}>
          {property.title}
        </p>

        {/* Quartier + chambres + distance */}
        <p style={{
          fontSize: 12, color: "rgba(255,255,255,0.75)",
          margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          📍 {neighborhoodLabel}
          {(property.rooms ?? 0) > 0 && ` · 🛏️ ${property.rooms} ch.`}
          {distanceStr && <span style={{ color: "#4A9EFF", marginLeft: 4 }}>· {distanceStr}</span>}
        </p>
      </div>

      {showAuthModal && (
        <AuthPromptModal
          onClose={() => setShowAuthModal(false)}
          redirectUrl={`/annonces/${property.id}`}
          action="ajouter aux favoris"
        />
      )}
    </div>
  );
}
