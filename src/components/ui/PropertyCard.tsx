"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Banknote, Bed, Calendar, CheckCircle2, Flame, Heart, MapPin, ChevronLeft, ChevronRight, Home, MessageCircle, Phone, ShieldCheck, Zap } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/lib/toast";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { AuthPromptModal } from "@/components/AuthPromptModal";
import { TypeBadge, PropertyBadge } from "@/components/PropertyBadge";
import { haversineKm, formatDistance } from "@/lib/haversine";
import { NEIGHBORHOOD_COORDINATES } from "@/data/neighborhoods";
import { advanceSignal, availabilitySignal, publishedSignal } from "@/lib/property-signals";
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

// ── Feature 1: Availability mode badge config ──────────────────────────────────
const AVAIL_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; Icon?: typeof Zap }> = {
  urgent:    { label: "Urgent",      color: "#ff4d4d", bg: "rgba(255,77,77,0.18)",    border: "rgba(255,77,77,0.45)", Icon: Zap },
  today:     { label: "Aujourd'hui", color: "#ff8c00", bg: "rgba(255,140,0,0.18)",    border: "rgba(255,140,0,0.45)", Icon: Flame },
  immediate: { label: "Libre",       color: "#25D366", bg: "rgba(37,211,102,0.18)",  border: "rgba(37,211,102,0.45)", Icon: Zap },
  flexible:  { label: "", color: "", bg: "", border: "" }, // no badge for default
};

export function PropertyCard({
  property,
  variant = "default",
  className,
  index = 0,
  userLocation = null,
  showDiasporaPrice = false,
}: PropertyCardProps) {
  const router                               = useRouter();
  const { setFavorite, isFavorite, _hasHydrated } = useAppStore();
  const { user }                             = useAuth();
  const [showAuthModal, setShowAuthModal]    = useState(false);
  const [currentImg,    setCurrentImg]       = useState(0);
  const touchStartX = useRef<number | null>(null);
  const didSwipe    = useRef(false);

  const fav    = _hasHydrated && isFavorite(property.id);
  const images = [...(property.property_images ?? [])].sort((a, b) =>
    a.is_primary === b.is_primary ? 0 : a.is_primary ? -1 : 1
  );
  const imgCount     = images.length;
  const primaryImage = images[0];

  const neighborhoodLabel = NEIGHBORHOOD_LABELS[property.neighborhood] ?? property.neighborhood;
  const availability = availabilitySignal(property);
  const advance = advanceSignal(property);
  const published = publishedSignal(property.created_at);

  // Distance from user location
  let distanceStr: string | null = null;
  const pLat = property.lat ?? property.latitude ?? null;
  const pLng = property.lng ?? property.longitude ?? null;
  if (userLocation && pLat && pLng) {
    distanceStr = formatDistance(haversineKm(userLocation.lat, userLocation.lng, pLat, pLng));
  } else if (userLocation) {
    const coords = NEIGHBORHOOD_COORDINATES[property.neighborhood];
    if (coords) distanceStr = `~${formatDistance(haversineKm(userLocation.lat, userLocation.lng, coords[0], coords[1]))}`;
  }

  // Feature 1: availability mode badge
  const availMode = property.availability_mode ?? "flexible";
  const availCfg = AVAIL_CONFIG[availMode] ?? AVAIL_CONFIG.flexible;

  // ── Image nav ───────────────────────────────────────────────────────────────
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
    else        setCurrentImg((i) => (i - 1 + imgCount) % imgCount);
  }

  // ── Favorite ──────────────────────────────────────────────────────────────────
  async function handleFavorite(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    if (!user) { setShowAuthModal(true); return; }
    const willBeFav = !fav;
    setFavorite(property.id, willBeFav);
    toast(willBeFav ? "Ajouté aux favoris" : "Retiré des favoris", willBeFav ? "success" : "info");
    if (isSupabaseConfigured && supabase) {
      try {
        let error: unknown = null;
        if (willBeFav) {
          ({ error } = await supabase.from("favorites").upsert(
            { user_id: user.id, property_id: property.id },
            { onConflict: "user_id,property_id", ignoreDuplicates: true }
          ));
        } else {
          ({ error } = await supabase.from("favorites").delete()
            .eq("user_id", user.id).eq("property_id", property.id));
        }
        if (error) throw error;
      } catch {
        setFavorite(property.id, !willBeFav);
      }
    }
  }

  // ── WhatsApp contact ─────────────────────────────────────────────────────────
  function handleWhatsApp(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    if (!user) {
      router.push(`/connexion?redirect=/annonces/${property.id}`);
      return;
    }
    const phone = (property as Property & { contact_phone?: string }).contact_phone?.replace(/\D/g, "");
    if (!phone) return;
    const msg = encodeURIComponent(`Bonjour, je suis intéressé par "${property.title}" sur LogerBien`);
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank", "noopener");
  }

  function handleCall(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    if (!user) {
      router.push(`/connexion?redirect=/annonces/${property.id}`);
      return;
    }
    const phone = (property as Property & { contact_phone?: string }).contact_phone?.replace(/\D/g, "");
    if (!phone) return;
    window.location.href = `tel:${phone}`;
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  HORIZONTAL VARIANT
  // ════════════════════════════════════════════════════════════════════════════
  if (variant === "horizontal") {
    return (
      <div
        className={cn("group flex gap-3 overflow-hidden transition-all hover:-translate-y-0.5", className)}
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 24, boxShadow: "var(--shadow-soft)" }}
      >
        <Link href={`/annonces/${property.id}`} className="relative w-28 flex-shrink-0">
          <div className="relative w-full h-full min-h-[100px]">
            {primaryImage ? (
              <Image src={primaryImage.url} alt={property.title} fill className="object-cover" sizes="112px" loading="lazy" />
            ) : (
              <div className="w-full h-full" style={{ background: "var(--bg-secondary)" }} />
            )}
          </div>
        </Link>
        <div className="flex-1 p-3 min-w-0">
          <Link href={`/annonces/${property.id}`}>
            <p className="font-black text-base dark:text-white text-[#121212] line-clamp-1">{property.title}</p>
            <div className="flex items-center gap-1 dark:text-white/60 text-[rgba(18,18,18,0.62)] text-base mt-0.5">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0 dark:text-white/40 text-[rgba(18,18,18,0.4)]" strokeWidth={2.4} />
              <span>{neighborhoodLabel}</span>
            </div>
            <p className="dark:text-white text-[#121212] font-black text-xl mt-1">
              {formatPrice(property.price)}
              {property.price_period === "month" && <span className="text-base font-bold dark:text-white/55 text-[rgba(18,18,18,0.58)]">/mois</span>}
            </p>
          </Link>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  DEFAULT VARIANT — immersive full-bleed photo card
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div
      className={cn("group property-card-default", className)}
      style={{
        position: "relative",
        borderRadius: 24,
        overflow: "hidden",
        boxShadow: "0 16px 42px rgba(24,21,16,0.22)",
        background: "var(--media-card-bg)",
        flexShrink: 0,
        transition: "transform 0.22s ease, box-shadow 0.22s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform  = "translateY(-4px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 22px 56px rgba(24,21,16,0.34)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform  = "";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 16px 42px rgba(24,21,16,0.22)";
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Full-bleed photo ─────────────────────────────────────────────────── */}
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
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: 8, background: "var(--bg-secondary)",
        }}>
          <Home style={{ width: 40, height: 40, color: "var(--text-primary-faint)", strokeWidth: 1.2 }} />
          <span style={{ color: "var(--text-primary-faint)", fontSize: 16 }}>Aucune photo</span>
        </div>
      )}

      {/* ── Bottom-only gradient scrim ────────────────────────────────────────── */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 1,
        background: "linear-gradient(transparent 36%, rgba(0,0,0,0.42) 62%, rgba(0,0,0,0.92) 100%)",
        pointerEvents: "none",
      }} />

      {/* ── Full-card navigation link (z-2) ──────────────────────────────────── */}
      <Link
        href={`/annonces/${property.id}`}
        aria-label={property.title}
        onClick={(e) => { if (didSwipe.current) { didSwipe.current = false; e.preventDefault(); } }}
        style={{ position: "absolute", inset: 0, zIndex: 2 }}
      />

      {/* ── Image-count pill dots ─────────────────────────────────────────────── */}
      {imgCount > 1 && (
        <div style={{
          position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
          zIndex: 5, display: "flex", gap: 4, pointerEvents: "none",
        }}>
          {images.map((_, i) => (
            <div key={i} style={{
              height: 3,
              width: i === currentImg ? 18 : 6,
              borderRadius: 2,
              background: i === currentImg ? "#fff" : "rgba(255,255,255,0.38)",
              transition: "width 0.2s ease",
            }} />
          ))}
        </div>
      )}

      {/* ── Arrow nav (desktop hover only) ───────────────────────────────────── */}
      {imgCount > 1 && (
        <button onClick={prev} aria-label="Image précédente"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            position: "absolute", left: 10, top: "40%", transform: "translateY(-50%)", zIndex: 5,
            width: 30, height: 30, background: "rgba(0,0,0,0.50)", border: "none",
            borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#ffffff", backdropFilter: "blur(4px)",
          }}>
          <ChevronLeft style={{ width: 15, height: 15 }} />
        </button>
      )}
      {imgCount > 1 && (
        <button onClick={next} aria-label="Image suivante"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            position: "absolute", right: 10, top: "40%", transform: "translateY(-50%)", zIndex: 5,
            width: 30, height: 30, background: "rgba(0,0,0,0.50)", border: "none",
            borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#ffffff", backdropFilter: "blur(4px)",
          }}>
          <ChevronRight style={{ width: 15, height: 15 }} />
        </button>
      )}

      {/* ── Type + main trust badge — top left (z-5) ─────────────────────────── */}
      <div style={{
        position: "absolute", top: 12, left: 12, zIndex: 5,
        display: "flex", gap: 4, flexWrap: "wrap",
        maxWidth: "calc(100% - 56px)",
        pointerEvents: "none",
      }}>
        <TypeBadge propertyType={property.type} />
        {property.is_verified && <PropertyBadge type="verified" />}
        {!property.is_verified && property.is_featured && <PropertyBadge type="premium" />}
        {property.contact_phone && (
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            background: "rgba(37,211,102,0.18)",
            color: "#ffffff",
            border: "1px solid rgba(37,211,102,0.38)",
            borderRadius: 999,
            padding: "4px 8px",
            fontSize: 12,
            fontWeight: 900,
            backdropFilter: "blur(6px)",
          }}>
            <Phone style={{ width: 13, height: 13 }} strokeWidth={2.4} />
            Tél.
          </span>
        )}
      </div>

      {/* ── Urgency badge — below type badges ───────────────────────────────── */}
      {availCfg.label && (
        <div style={{
          position: "absolute", top: 40, left: 12, zIndex: 5, pointerEvents: "none",
        }}>
          <span style={{
            background: availCfg.bg, color: availCfg.color,
            border: `1px solid ${availCfg.border}`,
            fontSize: 14, fontWeight: 900, padding: "5px 10px",
            borderRadius: 20, whiteSpace: "nowrap",
            backdropFilter: "blur(6px)",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
          }}>
            {availCfg.Icon && <availCfg.Icon style={{ width: 15, height: 15 }} strokeWidth={2.4} />}
            {availCfg.label}
          </span>
        </div>
      )}

      {/* ── Favorite button — top right (z-6) ────────────────────────────────── */}
      <button
        onClick={handleFavorite}
        aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
        style={{
          position: "absolute", top: 12, right: 12, zIndex: 6,
          width: 36, height: 36,
          background: "rgba(0,0,0,0.40)",
          border: "none",
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          transition: "background 0.2s",
        }}
      >
        <Heart style={{
          width: 16, height: 16,
          fill: fav ? "#ef4444" : "none",
          stroke: fav ? "#ef4444" : "rgba(255,255,255,0.90)",
          strokeWidth: fav ? 0 : 1.8,
        }} />
      </button>

      {/* ── Info overlay — bottom left (z-3) ─────────────────────────────────── */}
      <div style={{
        position: "absolute",
        bottom: 16,
        left: 16,
        right: 70,
        zIndex: 3,
        pointerEvents: "none",
      }}>
        {/* Prix sans badge */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <Banknote style={{ width: 22, height: 22, color: "var(--photo-text)", alignSelf: "center" }} strokeWidth={2.4} />
          <span style={{
            fontSize: 32,
            fontWeight: 900,
            color: "var(--photo-text)",
            lineHeight: 1.1,
            textShadow: "0 2px 6px rgba(0,0,0,0.50)",
          }}>
            {formatPrice(property.price)}
          </span>
          {property.price_period === "month" && (
            <span style={{ fontSize: 16, color: "var(--photo-text-dim)", fontWeight: 800 }}>/mois</span>
          )}
        </div>

        {/* Prix USD diaspora */}
        {showDiasporaPrice && (
          <p style={{
            margin: "2px 0 0",
            fontSize: 16,
            color: "var(--photo-text-muted)",
            lineHeight: 1,
            fontWeight: 500,
          }}>
            ~{Math.round(property.price / 8600).toLocaleString("en-US")} USD
            {property.price_period === "month" ? "/mois" : ""}
          </p>
        )}

        {/* Quartier + distance */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 3,
          marginTop: 6,
          overflow: "hidden",
        }}>
          <span style={{
             fontSize: 17,
            fontWeight: 900,
            color: "var(--photo-text)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <MapPin style={{ width: 17, height: 17 }} strokeWidth={2.4} />
              {neighborhoodLabel}
            </span>
            {(property.rooms ?? 0) > 0 && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginLeft: 8 }}>
                <Bed style={{ width: 17, height: 17 }} strokeWidth={2.4} />
                {property.rooms}
              </span>
            )}
            {distanceStr && ` · ${distanceStr}`}
          </span>
        </div>

        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 7 }}>
          <span style={{
            fontSize: 14,
            fontWeight: 900,
            color: availability.color,
            background: availability.bg,
            border: `1px solid ${availability.border}`,
            padding: "4px 9px",
            borderRadius: 14,
            whiteSpace: "nowrap",
            backdropFilter: "blur(6px)",
          }}>
            <CheckCircle2 style={{ width: 14, height: 14, display: "inline", marginRight: 4, verticalAlign: "-2px" }} strokeWidth={2.4} />
            {availability.label}
          </span>
          {property.is_verified && (
            <span style={{
              fontSize: 14,
              fontWeight: 900,
              color: "#ffffff",
              background: "rgba(34,197,94,0.30)",
              border: "1px solid rgba(34,197,94,0.36)",
              padding: "4px 9px",
              borderRadius: 14,
              whiteSpace: "nowrap",
            }}>
              <ShieldCheck style={{ width: 14, height: 14, display: "inline", marginRight: 4, verticalAlign: "-2px" }} strokeWidth={2.4} />
              Vérifié
            </span>
          )}
          {published && (
            <span style={{
              fontSize: 14,
              fontWeight: 900,
              color: "#ffffff",
              background: "rgba(0,0,0,0.45)",
              border: "1px solid rgba(255,255,255,0.20)",
              padding: "4px 9px",
              borderRadius: 14,
              whiteSpace: "nowrap",
            }}>
              <Calendar style={{ width: 14, height: 14, display: "inline", marginRight: 4, verticalAlign: "-2px" }} strokeWidth={2.4} />
              {published.label}
            </span>
          )}
          <span style={{
            fontSize: 14,
            fontWeight: 900,
            color: "#ffffff",
            background: "rgba(0,0,0,0.45)",
            border: "1px solid rgba(255,255,255,0.20)",
            padding: "4px 9px",
            borderRadius: 14,
            whiteSpace: "nowrap",
          }}>
            {advance}
          </span>
        </div>
      </div>

      {/* ── Call button — above WhatsApp (z-6) ──────────────────────────────── */}
      <button
        onClick={handleCall}
        aria-label="Appeler"
        style={{
          position: "absolute",
          bottom: 68,
          right: 16,
          zIndex: 6,
          width: 46,
          height: 46,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.94)",
          color: "#17120a",
          border: "1px solid rgba(255,255,255,0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(0,0,0,0.24)",
          WebkitTapHighlightColor: "transparent",
          flexShrink: 0,
        }}
      >
        <Phone style={{ width: 18, height: 18, strokeWidth: 2.4 }} />
      </button>

      {/* ── WhatsApp button — bottom right (z-6) ─────────────────────────────── */}
      <button
        onClick={handleWhatsApp}
        aria-label="Contacter sur WhatsApp"
        style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          zIndex: 6,
          width: 50,
          height: 50,
          borderRadius: "50%",
          background: "#25D366",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(37,211,102,0.45), 0 2px 8px rgba(0,0,0,0.25)",
          WebkitTapHighlightColor: "transparent",
          flexShrink: 0,
        }}
      >
        <MessageCircle style={{ width: 22, height: 22, color: "#ffffff", strokeWidth: 2.6 }} />
      </button>

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
