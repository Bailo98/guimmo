"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ChevronLeft, ChevronRight, Home } from "lucide-react";
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
const AVAIL_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  urgent:    { label: "⚡ Urgent",               color: "#ff4d4d", bg: "rgba(255,77,77,0.18)",    border: "rgba(255,77,77,0.45)" },
  today:     { label: "🔥 Dispo aujourd'hui",     color: "#ff8c00", bg: "rgba(255,140,0,0.18)",    border: "rgba(255,140,0,0.45)" },
  immediate: { label: "🏃 Libre immédiatement",   color: "#25D366", bg: "rgba(37,211,102,0.18)",  border: "rgba(37,211,102,0.45)" },
  flexible:  { label: "", color: "", bg: "", border: "" }, // no badge for default
};

// ── Feature 3: Timestamp label ─────────────────────────────────────────────────
function freshLabel(createdAt: string | undefined): { label: string; color: string } | null {
  if (!createdAt) return null;
  const diff = Date.now() - new Date(createdAt).getTime();
  const hours = diff / 3_600_000;
  const days  = diff / 86_400_000;
  if (hours < 24) {
    const h = Math.max(1, Math.round(hours));
    return { label: `il y a ${h}h`, color: "#22c55e" };
  }
  if (days < 7) {
    const d = Math.round(days);
    return { label: `il y a ${d}j`, color: "#eab308" };
  }
  return null;
}

// ── Feature 4: Trust badge display ────────────────────────────────────────────
const TRUST_BADGE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  proprietaire_direct: { label: "🏠 Proprio direct",  color: "#60a5fa", bg: "rgba(96,165,250,0.18)" },
  sans_commission:     { label: "💰 Sans commission",  color: "var(--accent-gold)", bg: "rgba(212,175,55,0.18)" },
  verifie:             { label: "✅ Vérifié",           color: "#22c55e", bg: "rgba(34,197,94,0.18)"  },
  nouveau:             { label: "🆕 Nouveau",           color: "#a78bfa", bg: "rgba(167,139,250,0.18)" },
};

const CARD_NOW = Date.now();

export function PropertyCard({
  property,
  variant = "default",
  className,
  index = 0,
  userLocation = null,
  showDiasporaPrice = false,
}: PropertyCardProps) {
  const router                               = useRouter();
  const { toggleFavorite, isFavorite, _hasHydrated } = useAppStore();
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
  const createdAt         = new Date(property.created_at ?? CARD_NOW);
  const isNew             = CARD_NOW - createdAt.getTime() < 48 * 60 * 60 * 1000;

  // Feature 3: fresh timestamp
  const fresh = freshLabel(property.created_at);
  const availability = availabilitySignal(property);
  const published = publishedSignal(property.created_at);
  const advance = advanceSignal(property);

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

  // Feature 7: trust dot
  const reportsCount = (property as Property & { reports_count?: number }).reports_count ?? 0;
  let trustDot: { color: string; label: string } | null = null;
  if (reportsCount > 0) {
    trustDot = { color: "#ef4444", label: "Signalement(s) en attente" };
  } else if (property.is_verified) {
    trustDot = { color: "#22c55e", label: "Annonce vérifiée" };
  } else if (isNew) {
    trustDot = { color: "#eab308", label: "Annonce récente (< 48h)" };
  }

  // Feature 1: availability mode badge
  const availMode = property.availability_mode ?? "flexible";
  const availCfg = AVAIL_CONFIG[availMode] ?? AVAIL_CONFIG.flexible;

  // Feature 4: trust badges array
  const trustBadges = Array.isArray(property.badges) ? property.badges : [];

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
          await supabase.from("favorites").delete()
            .eq("user_id", user.id).eq("property_id", property.id);
        }
      } catch { /* silent */ }
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

  // ════════════════════════════════════════════════════════════════════════════
  //  HORIZONTAL VARIANT
  // ════════════════════════════════════════════════════════════════════════════
  if (variant === "horizontal") {
    return (
      <div
        className={cn("group flex gap-3 rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5", className)}
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
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
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-shrink-0 dark:text-white/40 text-[rgba(18,18,18,0.4)]">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
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
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(0,0,0,0.30)",
        background: "#111820",
        flexShrink: 0,
        transition: "transform 0.22s ease, box-shadow 0.22s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform  = "translateY(-4px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 20px 44px rgba(0,0,0,0.55)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform  = "";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.30)";
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
        background: "linear-gradient(transparent 45%, rgba(0,0,0,0.88) 100%)",
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

      {/* ── Feature 3: Fresh timestamp — top right corner (above fav btn) ──────── */}
      {fresh && (
        <div style={{
          position: "absolute", top: 10, right: 56, zIndex: 5, pointerEvents: "none",
        }}>
          <span style={{
            background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)",
            color: fresh.color, fontSize: 16, fontWeight: 800,
            padding: "4px 9px", borderRadius: 20, whiteSpace: "nowrap",
          }}>
            {fresh.label}
          </span>
        </div>
      )}

      {/* ── Type + status badges — top left (z-5) ────────────────────────────── */}
      <div style={{
        position: "absolute", top: 12, left: 12, zIndex: 5,
        display: "flex", gap: 4, flexWrap: "wrap",
        maxWidth: "calc(100% - 56px)",
        pointerEvents: "none",
      }}>
        <TypeBadge propertyType={property.type} />
        {property.is_featured && <PropertyBadge type="premium" />}
        {property.is_diaspora && <PropertyBadge type="diaspora" />}
        {property.is_verified && !property.is_featured && <PropertyBadge type="verified" />}
        {isNew && !property.is_featured && !property.is_diaspora && <PropertyBadge type="new" />}
        {property.is_boosted && (
          <span style={{
            background: "var(--accent-gold)", color: "var(--bg-primary)",
            fontSize: 16, padding: "4px 10px", borderRadius: 20, fontWeight: 800, whiteSpace: "nowrap",
          }}>★ Pro</span>
        )}
        {property.video_url && (
          <span style={{
            background: "rgba(212,175,55,0.90)", color: "var(--bg-primary)",
            fontSize: 16, padding: "4px 10px", borderRadius: 20, fontWeight: 800, whiteSpace: "nowrap",
          }}>▶ Vidéo</span>
        )}
      </div>

      {/* ── Feature 1: Availability mode badge — below type badges ──────────── */}
      {availCfg.label && (
        <div style={{
          position: "absolute", top: 40, left: 12, zIndex: 5, pointerEvents: "none",
        }}>
          <span style={{
            background: availCfg.bg, color: availCfg.color,
            border: `1px solid ${availCfg.border}`,
            fontSize: 16, fontWeight: 800, padding: "4px 10px",
            borderRadius: 20, whiteSpace: "nowrap",
            backdropFilter: "blur(6px)",
          }}>
            {availCfg.label}
          </span>
        </div>
      )}

      <div style={{
        position: "absolute",
        top: availCfg.label ? 68 : 40,
        left: 12,
        right: 56,
        zIndex: 5,
        display: "flex",
        flexWrap: "wrap",
        gap: 4,
        pointerEvents: "none",
      }}>
        <span style={{
          background: availability.bg,
          color: availability.color,
          border: `1px solid ${availability.border}`,
          fontSize: 16,
          fontWeight: 800,
          padding: "3px 8px",
          borderRadius: 20,
          whiteSpace: "nowrap",
          backdropFilter: "blur(6px)",
        }}>
          {availability.label}
        </span>
        {published && (
          <span style={{
            background: "rgba(0,0,0,0.48)",
            color: published.color,
            fontSize: 16,
            fontWeight: 800,
            padding: "3px 8px",
            borderRadius: 20,
            whiteSpace: "nowrap",
            backdropFilter: "blur(6px)",
          }}>
            {published.label}
          </span>
        )}
      </div>

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
          <span style={{
            fontSize: 30,
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

        {/* Titre */}
        <p style={{
          margin: "4px 0 0",
          fontSize: 16,
          fontWeight: 800,
          color: "var(--photo-text)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          lineHeight: 1.3,
        }}>
          {property.title}
        </p>

        {/* Quartier + distance */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 3,
          marginTop: 2,
          overflow: "hidden",
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
            stroke="var(--photo-text-dim)" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0 }}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span style={{
            fontSize: 16,
            color: "var(--photo-text-dim)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
            {neighborhoodLabel}
            {(property.rooms ?? 0) > 0 && ` · 🛏 ${property.rooms}`}
            {distanceStr && ` · ${distanceStr}`}
          </span>
        </div>

        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 5 }}>
          <span style={{
            fontSize: 16,
            fontWeight: 800,
            color: "#ffffff",
            background: "rgba(0,0,0,0.45)",
            padding: "3px 7px",
            borderRadius: 12,
            whiteSpace: "nowrap",
          }}>
            {advance}
          </span>
        </div>

        {/* Feature 4: Trust badges row */}
        {trustBadges.length > 0 && (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 5 }}>
            {trustBadges.slice(0, 3).map((badge) => {
              const cfg = TRUST_BADGE_CONFIG[badge];
              if (!cfg) return null;
              return (
                <span key={badge} style={{
                  fontSize: 9, fontWeight: 700,
                  color: cfg.color, background: cfg.bg,
                  padding: "2px 6px", borderRadius: 12, whiteSpace: "nowrap",
                }}>
                  {cfg.label}
                </span>
              );
            })}
          </div>
        )}

        {/* Feature 7: Trust dot indicator */}
        {trustDot && (
          <div
            title={trustDot.label}
            style={{
              position: "absolute", bottom: -20, left: 0,
              display: "flex", alignItems: "center", gap: 4,
              cursor: "default",
            }}
          >
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: trustDot.color,
              display: "inline-block",
              boxShadow: `0 0 6px ${trustDot.color}99`,
            }} />
          </div>
        )}
      </div>

      {/* ── WhatsApp button — bottom right (z-6) ─────────────────────────────── */}
      <button
        onClick={handleWhatsApp}
        aria-label="Contacter sur WhatsApp"
        style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          zIndex: 6,
          width: 46,
          height: 46,
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
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.555 4.118 1.528 5.845L0 24l6.338-1.505A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.892 0-3.667-.5-5.2-1.373l-.373-.22-3.863.917.976-3.77-.243-.387A9.938 9.938 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
        </svg>
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
