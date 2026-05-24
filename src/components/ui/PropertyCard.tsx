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

const WA_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="white" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export function PropertyCard({ property, variant = "default", className, index = 0 }: PropertyCardProps) {
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
  const isNew = Date.now() - createdAt.getTime() < 7 * 24 * 60 * 60 * 1000;

  function prev(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImg((i) => (i - 1 + imgCount) % imgCount);
  }

  function next(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImg((i) => (i + 1) % imgCount);
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) setCurrentImg((i) => (i + 1) % imgCount);
    else setCurrentImg((i) => (i - 1 + imgCount) % imgCount);
  }

  // ── Horizontal variant (unchanged) ─────────────────────────────
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
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-shrink-0 text-white/40">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              <span>{neighborhoodLabel}</span>
            </div>
            <p className="text-white font-bold text-sm mt-1">
              {formatPrice(property.price)}
              {property.price_period === "month" && (
                <span className="text-xs font-normal text-white/40">/mois</span>
              )}
            </p>
          </Link>
        </div>
      </div>
    );
  }

  // ── Default variant — Dark card with image slider ──────────────────────────────
  return (
    <div
      className={cn("group flex flex-col", className)}
      style={{
        background: "#2c2f36",
        borderRadius: 20,
        overflow: "hidden",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 40px rgba(0,0,0,0.35)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "";
      }}
    >
      {/* ── Slider section ── */}
      <Link
        href={`/annonces/${property.id}`}
        className="relative block flex-shrink-0 group/img"
        style={{ height: 210, overflow: "hidden" }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Current image or placeholder */}
        {imgCount > 0 ? (
          <Image
            src={images[currentImg].url}
            alt={property.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            quality={65}
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

        {/* Left arrow */}
        {imgCount > 1 && (
          <button
            onClick={prev}
            aria-label="Image précédente"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover/img:opacity-100 transition-opacity"
            style={{
              width: 32, height: 32,
              background: "rgba(0,0,0,0.55)",
              border: "none", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#fff",
              backdropFilter: "blur(4px)",
            }}
          >
            <ChevronLeft style={{ width: 16, height: 16 }} />
          </button>
        )}

        {/* Right arrow */}
        {imgCount > 1 && (
          <button
            onClick={next}
            aria-label="Image suivante"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover/img:opacity-100 transition-opacity"
            style={{
              width: 32, height: 32,
              background: "rgba(0,0,0,0.55)",
              border: "none", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#fff",
              backdropFilter: "blur(4px)",
            }}
          >
            <ChevronRight style={{ width: 16, height: 16 }} />
          </button>
        )}

        {/* Dot indicators */}
        {imgCount > 1 && (
          <div
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 z-10"
            style={{ bottom: 10 }}
          >
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentImg(i); }}
                aria-label={`Image ${i + 1}`}
                style={{
                  width: i === currentImg ? 16 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === currentImg ? "#fff" : "rgba(255,255,255,0.45)",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  transition: "width 0.2s ease, background 0.2s ease",
                }}
              />
            ))}
          </div>
        )}

        {/* Top-left badges */}
        <div className="absolute flex items-center gap-1.5 flex-wrap" style={{ top: 10, left: 10, maxWidth: "calc(100% - 56px)", zIndex: 10 }}>
          <span style={{ background: "rgba(10,18,22,0.75)", color: "#fff", fontSize: 10, padding: "3px 9px", borderRadius: 20, fontWeight: 600, whiteSpace: "nowrap", backdropFilter: "blur(4px)" }}>
            {TYPE_LABELS[property.type] ?? property.type}
          </span>
          {property.transaction_type === "rent" ? (
            <span style={{ background: "rgba(233,233,0,0.90)", color: "#0A1216", fontSize: 10, padding: "3px 9px", borderRadius: 20, fontWeight: 700, whiteSpace: "nowrap" }}>
              Location
            </span>
          ) : (
            <span style={{ background: "rgba(10,18,22,0.75)", color: "#fff", fontSize: 10, padding: "3px 9px", borderRadius: 20, fontWeight: 600, whiteSpace: "nowrap", backdropFilter: "blur(4px)" }}>
              Vente
            </span>
          )}
          {property.is_verified && (
            <span style={{ background: "#E9E900", color: "#0A1216", fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 700, whiteSpace: "nowrap" }}>
              ✓ Vérifié
            </span>
          )}
          {property.is_boosted && (
            <span style={{ background: "#E9E900", color: "#0A1216", fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 700, whiteSpace: "nowrap" }}>
              ★ Pro
            </span>
          )}
          {isNew && !property.is_boosted && (
            <span style={{ background: "rgba(10,18,22,0.65)", color: "#fff", fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 500, whiteSpace: "nowrap", backdropFilter: "blur(4px)" }}>
              Nouveau
            </span>
          )}
        </div>

        {/* Favorite button — top right */}
        <button
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!user) { setShowAuthModal(true); return; }
            const willBeFav = !fav;
            toggleFavorite(property.id); // mise à jour optimiste (Zustand / localStorage)
            toast(willBeFav ? "Ajouté aux favoris" : "Retiré des favoris", willBeFav ? "success" : "info");
            // Synchronisation avec Supabase
            if (isSupabaseConfigured && supabase) {
              try {
                if (willBeFav) {
                  await supabase.from("favorites")
                    .upsert(
                      { user_id: user.id, property_id: property.id },
                      { onConflict: "user_id,property_id" }
                    );
                } else {
                  await supabase.from("favorites")
                    .delete()
                    .eq("user_id", user.id)
                    .eq("property_id", property.id);
                }
              } catch {
                // Echec silencieux — l'état Zustand reste l'UI de référence
              }
            }
          }}
          aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
          style={{
            position: "absolute", top: 10, right: 10, zIndex: 10,
            width: 34, height: 34,
            background: "rgba(10,18,22,0.65)", border: "none", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            color: fav ? "#ef4444" : "rgba(255,255,255,0.8)",
            backdropFilter: "blur(4px)",
          }}
        >
          <Heart style={{ width: 15, height: 15, fill: fav ? "#ef4444" : "none", stroke: "currentColor" }} />
        </button>

        {/* Video badge */}
        {property.video_url && (
          <div style={{ position: "absolute", bottom: 10, left: 10, zIndex: 10 }}>
            <span style={{ background: "#E9E900", color: "#0A1216", fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 700 }}>
              ▶ Vidéo
            </span>
          </div>
        )}
      </Link>

      {/* ── Card body ── */}
      <div style={{ padding: "12px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        {/* Title */}
        <p style={{ fontSize: 15, fontWeight: 700, color: "#ffffff", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {property.title}
        </p>

        {/* Neighborhood */}
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", display: "flex", alignItems: "center", gap: 3 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {neighborhoodLabel}, Conakry
        </div>

        {/* Price */}
        <div style={{ fontSize: 15, fontWeight: 700, color: "#E9E900", display: "flex", alignItems: "baseline", gap: 4 }}>
          {formatPrice(property.price)}
          {property.price_period === "month" && (
            <span style={{ fontSize: 11, fontWeight: 400, color: "rgba(255,255,255,0.4)" }}>/mois</span>
          )}
          {property.transaction_type === "sale" && property.price_period !== "month" && (
            <span style={{ fontSize: 11, fontWeight: 400, color: "rgba(255,255,255,0.4)" }}>/vente</span>
          )}
        </div>

        {/* Specs row */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {(property.rooms ?? 0) > 0 && (
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", display: "flex", alignItems: "center", gap: 3, fontWeight: 500 }}>
              🛏 {property.rooms} ch.
            </span>
          )}
          {(property.surface ?? 0) > 0 && (
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", display: "flex", alignItems: "center", gap: 3, fontWeight: 500 }}>
              📐 {property.surface} m²
            </span>
          )}
          {property.water_source && property.water_source !== "none" && (
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>💧</span>
          )}
          {property.electricity && property.electricity !== "none" && (
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>⚡</span>
          )}
          {property.internet === "wifi" && (
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>📶</span>
          )}
        </div>

        {/* Score bar */}
        <div style={{ margin: "2px 0" }}>
          <ListingScore
            images={(property.property_images ?? []).length}
            description={property.description}
            phone={property.contact_phone}
            surface={property.surface}
            rooms={property.rooms}
            compact
          />
        </div>

        {/* Contact button */}
        {phone ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!user) { setShowAuthModal(true); return; }
              const cleaned = phone.replace(/\D/g, "");
              const ref = property.ref ? ` (${property.ref})` : "";
              const msg = `Bonjour, je suis intéressé par votre annonce : ${property.title}${ref}`;
              fetch("/api/track/whatsapp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ propertyId: property.id }) }).catch(() => null);
              window.open(`https://wa.me/${cleaned}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
            }}
            style={{
              width: "100%", background: "#25D366", color: "white", border: "none",
              borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              cursor: "pointer", marginTop: 4,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#1ebe5d"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#25D366"; }}
          >
            {WA_ICON}
            Contacter
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
