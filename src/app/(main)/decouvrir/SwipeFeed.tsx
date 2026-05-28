"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import TinderCard from "react-tinder-card";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useAppStore } from "@/lib/store";
import { toast } from "@/lib/toast";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";
import { getNeighborhoodName, NEIGHBORHOOD_COORDINATES } from "@/data/neighborhoods";
import { haversineKm, formatDistance } from "@/lib/haversine";
import type { Property } from "@/types";

const SEEN_KEY = "lb_swipe_seen";

function getSeenIds(): string[] {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]"); }
  catch { return []; }
}
function addSeenId(id: string) {
  try {
    const seen = getSeenIds();
    if (!seen.includes(id)) {
      seen.push(id);
      if (seen.length > 200) seen.splice(0, seen.length - 200);
      localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
    }
  } catch { /* silent */ }
}

type TinderAPI = {
  swipe: (dir: "left" | "right" | "up" | "down") => Promise<void>;
  restoreCard: () => Promise<void>;
};

export function SwipeFeed({ properties }: { properties: Property[] }) {
  const router             = useRouter();
  const { user }           = useAuth();
  const { toggleFavorite } = useAppStore();

  const [mounted,         setMounted]         = useState(false);
  const [cards,           setCards]           = useState<Property[]>([]);
  const [userLocation,    setUserLocation]    = useState<{ lat: number; lng: number } | null>(null);
  const [reloading,       setReloading]       = useState(false);
  const [everHadCards,    setEverHadCards]    = useState(false);

  // ── Overlay refs — pure DOM manipulation, ZERO React re-renders during drag ──
  const overlayRightRef = useRef<HTMLDivElement>(null);
  const overlayLeftRef  = useRef<HTMLDivElement>(null);
  const touchStartX     = useRef(0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topCardRef = useRef<TinderAPI>(null as any);
  const cardsRef   = useRef(cards);
  cardsRef.current = cards;

  // ── Mount ──────────────────────────────────────────────────────────────────
  useEffect(() => { setMounted(true); }, []);

  // ── Geolocation ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { /* silent */ },
      { timeout: 5000, maximumAge: 300_000 }
    );
  }, []);

  // ── Filter seen + sort ─────────────────────────────────────────────────────
  useEffect(() => {
    if (properties.length === 0) return;
    const seen = getSeenIds();
    let list = properties.filter((p) => !seen.includes(p.id));

    if (list.length === 0 || list.length < Math.max(1, properties.length * 0.2)) {
      try { localStorage.removeItem(SEEN_KEY); } catch { /* silent */ }
      list = [...properties];
    }

    if (userLocation) {
      list = list.sort((a, b) => {
        const aLat = a.lat ?? a.latitude ?? NEIGHBORHOOD_COORDINATES[a.neighborhood]?.[0];
        const aLng = a.lng ?? a.longitude ?? NEIGHBORHOOD_COORDINATES[a.neighborhood]?.[1];
        const bLat = b.lat ?? b.latitude ?? NEIGHBORHOOD_COORDINATES[b.neighborhood]?.[0];
        const bLng = b.lng ?? b.longitude ?? NEIGHBORHOOD_COORDINATES[b.neighborhood]?.[1];
        if (!aLat || !bLat) return 0;
        return (
          haversineKm(userLocation.lat, userLocation.lng, aLat, aLng) -
          haversineKm(userLocation.lat, userLocation.lng, bLat, bLng)
        );
      });
    } else {
      list = list.sort((a, b) => {
        const score = (p: Property) =>
          (p.is_featured ? 1000 : 0) +
          (Date.now() - new Date(p.created_at ?? 0).getTime() < 48 * 3_600_000 ? 500 : 0) +
          (p.is_boosted ? 200 : 0);
        return score(b) - score(a);
      });
    }
    setCards(list);
    if (list.length > 0) setEverHadCards(true);
  }, [properties, userLocation]);

  // ── Auto-reload when all cards swiped ─────────────────────────────────────
  useEffect(() => {
    if (!mounted || !everHadCards || cards.length > 0 || reloading) return;
    setReloading(true);
    const t = setTimeout(() => {
      try { localStorage.removeItem(SEEN_KEY); } catch { /* silent */ }
      setCards([...properties]);
      setReloading(false);
    }, 1500);
    return () => clearTimeout(t);
  }, [mounted, everHadCards, cards.length, reloading, properties]);

  // ── Progressive overlay: pure DOM — no setState ────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const abs    = Math.abs(deltaX);
    const opacity = abs < 15 ? 0 : Math.min(1, (abs - 15) / 50);

    if (deltaX > 15) {
      if (overlayRightRef.current) overlayRightRef.current.style.opacity = String(opacity);
      if (overlayLeftRef.current)  overlayLeftRef.current.style.opacity  = "0";
    } else if (deltaX < -15) {
      if (overlayLeftRef.current)  overlayLeftRef.current.style.opacity  = String(opacity);
      if (overlayRightRef.current) overlayRightRef.current.style.opacity = "0";
    } else {
      if (overlayRightRef.current) overlayRightRef.current.style.opacity = "0";
      if (overlayLeftRef.current)  overlayLeftRef.current.style.opacity  = "0";
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (overlayRightRef.current) overlayRightRef.current.style.opacity = "0";
    if (overlayLeftRef.current)  overlayLeftRef.current.style.opacity  = "0";
  }, []);

  // ── Swipe callbacks ────────────────────────────────────────────────────────
  // CRITICAL: onSwipe must NOT call setState (would cause double-swipe bug)
  const onSwipe = useCallback(async (dir: string, property: Property) => {
    addSeenId(property.id);
    if (overlayRightRef.current) overlayRightRef.current.style.opacity = "0";
    if (overlayLeftRef.current)  overlayLeftRef.current.style.opacity  = "0";

    if (dir === "right") {
      if (!user) {
        router.push("/connexion?redirect=/decouvrir");
        return;
      }
      toggleFavorite(property.id);
      toast("❤️ Ajouté aux favoris", "success");
      if (isSupabaseConfigured && supabase) {
        try {
          const { error } = await supabase
            .from("favorites")
            .upsert(
              { user_id: user.id, property_id: property.id },
              { onConflict: "user_id,property_id", ignoreDuplicates: true }
            );
          if (error) console.error("[SwipeFeed] favorites upsert:", error.message, error.code);
        } catch (e) {
          console.error("[SwipeFeed] favorites upsert exception:", e);
        }
      }
    }
  }, [user, toggleFavorite, router]);

  // onCardLeftScreen fires AFTER fly-off — safe to setState here
  const onCardLeft = useCallback((property: Property) => {
    setCards((prev) => prev.filter((p) => p.id !== property.id));
  }, []);

  const triggerSwipe = useCallback(async (dir: "left" | "right") => {
    await topCardRef.current?.swipe(dir);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!mounted) return null;

  // ── Reloading transition ───────────────────────────────────────────────────
  if (reloading) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 10, background: "var(--bg-primary)",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "0 32px",
      }}>
        <p style={{ fontSize: 52, marginBottom: 16, animation: "spin 1s linear infinite" }}>🔄</p>
        <p style={{ color: "#D4AF37", fontWeight: 700, fontSize: 20, textAlign: "center", marginBottom: 8 }}>
          On recommence depuis le début…
        </p>
        <p style={{ color: "var(--bl-cream-faint)", fontSize: 13, textAlign: "center" }}>
          Toutes les annonces vont réapparaître
        </p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Empty briefly before reload triggers ──────────────────────────────────
  if (cards.length === 0 && everHadCards) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 10, background: "var(--bg-primary)",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "0 32px",
      }}>
        <p style={{ fontSize: 52, marginBottom: 16 }}>⏳</p>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, textAlign: "center" }}>
          Chargement…
        </p>
        <a href="/annonces" style={{
          display: "block", textAlign: "center", width: "100%", maxWidth: 320,
          marginTop: 24, padding: "14px 0", borderRadius: 14,
          background: "var(--border-subtle)", border: "1px solid rgba(255,255,255,0.12)",
          color: "var(--bl-cream)", fontWeight: 600, fontSize: 15, textDecoration: "none",
        }}>
          Voir toutes les annonces
        </a>
      </div>
    );
  }

  if (cards.length === 0) return null;

  const topCard = cards[0];
  const topImg  = topCard.property_images?.find((i) => i.is_primary) ?? topCard.property_images?.[0];

  // Distance string
  let topDistStr: string | null = null;
  if (userLocation) {
    const pLat = topCard.lat ?? topCard.latitude;
    const pLng = topCard.lng ?? topCard.longitude;
    if (pLat && pLng) {
      topDistStr = formatDistance(haversineKm(userLocation.lat, userLocation.lng, pLat, pLng));
    } else {
      const coords = NEIGHBORHOOD_COORDINATES[topCard.neighborhood];
      if (coords) topDistStr = `~${formatDistance(haversineKm(userLocation.lat, userLocation.lng, coords[0], coords[1]))}`;
    }
  }

  // Remaining-card dots (max 15)
  const dotsTotal = Math.min(cards.length, 15);

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════════
          FIXED HEADER — z-200, above everything
          Back (←) · "Découvrir / Conakry, Guinée" · Filter (⚙️)
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px",
          background: "linear-gradient(rgba(0,0,0,0.50) 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      >
        {/* Back button */}
        <button
          onClick={() => router.back()}
          aria-label="Retour"
          style={{
            pointerEvents: "auto",
            width: 32, height: 32,
            background: "rgba(255,255,255,0.12)",
            border: "none",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            color: "var(--bl-cream)",
            flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Title + sub-title */}
        <div style={{ textAlign: "center", flex: 1 }}>
          <p style={{ margin: 0, color: "var(--bl-cream)", fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>
            Découvrir
          </p>
          <p style={{ margin: 0, color: "var(--bl-cream-dim)", fontSize: 11, lineHeight: 1.4 }}>
            Conakry, Guinée
          </p>
        </div>

        {/* Filter button */}
        <button
          aria-label="Filtres"
          style={{
            pointerEvents: "auto",
            width: 32, height: 32,
            background: "rgba(255,255,255,0.12)",
            border: "none",
            borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          ⚙️
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          FULL-SCREEN FIXED CONTAINER (z-10)
          overflow:hidden prevents scroll interference with react-tinder-card
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          overflow: "hidden",
          zIndex: 10,
          background: "#000",
          touchAction: "none",
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        {/* ── TinderCard ─────────────────────────────────────────────────────── */}
        <TinderCard
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ref={topCardRef as any}
          key={topCard.id}
          onSwipe={(dir) => onSwipe(dir, topCard)}
          onCardLeftScreen={() => onCardLeft(topCard)}
          preventSwipe={["up", "down"]}
          swipeRequirementType="position"
          swipeThreshold={40}
          className="tc-swipe"
        >
          <div
            className="pressable"
            style={{
              position: "absolute",
              inset: 0,
              background: "#161B26",
              cursor: "grab",
              userSelect: "none",
              WebkitUserSelect: "none",
              touchAction: "none",
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={() => router.push(`/annonces/${topCard.id}`)}
          >
            {/* ── Full-screen photo ─────────────────────────────────────────── */}
            {topImg ? (
              <Image
                src={topImg.url}
                alt={topCard.title}
                fill
                style={{ objectFit: "cover", objectPosition: "center" }}
                sizes="100vw"
                quality={85}
                priority
                draggable={false}
              />
            ) : (
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(135deg, #1a252b 0%, #0a1216 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 96, opacity: 0.10 }}>🏠</span>
              </div>
            )}

            {/* ── Bottom gradient scrim ──────────────────────────────────────── */}
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "linear-gradient(transparent 30%, rgba(0,0,0,0.30) 52%, rgba(0,0,0,0.92) 100%)",
            }} />

            {/* ── ❤️ INTÉRESSÉ overlay (swipe right) ──────────────────────────── */}
            <div
              ref={overlayRightRef}
              style={{ position: "absolute", top: 108, left: 24, pointerEvents: "none", opacity: 0 }}
            >
              <div style={{
                border: "3px solid #D4AF37", borderRadius: 8,
                padding: "8px 16px", color: "var(--bl-cream)",
                fontSize: 32, fontWeight: 900, letterSpacing: 2,
                textTransform: "uppercase", transform: "rotate(-15deg)",
                textShadow: "0 2px 8px rgba(0,0,0,0.6)", whiteSpace: "nowrap",
              }}>
                ❤️ INTÉRESSÉ
              </div>
            </div>

            {/* ── ✕ PASSÉ overlay (swipe left) ────────────────────────────────── */}
            <div
              ref={overlayLeftRef}
              style={{ position: "absolute", top: 108, right: 24, pointerEvents: "none", opacity: 0 }}
            >
              <div style={{
                border: "3px solid #FF4D4D", borderRadius: 8,
                padding: "8px 16px", color: "var(--bl-cream)",
                fontSize: 32, fontWeight: 900, letterSpacing: 2,
                textTransform: "uppercase", transform: "rotate(15deg)",
                textShadow: "0 2px 8px rgba(0,0,0,0.6)", whiteSpace: "nowrap",
              }}>
                ✕ PASSÉ
              </div>
            </div>

            {/* ── Badges — top left (below header) ────────────────────────────── */}
            <div style={{
              position: "absolute", top: 72, left: 14,
              display: "flex", flexDirection: "column", gap: 6,
              pointerEvents: "none",
            }}>
              {topCard.is_featured && (
                <span style={{
                  background: "rgba(212,175,55,0.20)", color: "#D4AF37",
                  border: "1px solid rgba(212,175,55,0.5)", borderRadius: 20,
                  padding: "3px 10px", fontSize: 11, fontWeight: 600,
                  backdropFilter: "blur(8px)",
                }}>
                  ⭐ Premium
                </span>
              )}
              {topCard.is_diaspora && (
                <span style={{
                  background: "rgba(74,158,255,0.25)", color: "#4A9EFF",
                  border: "1px solid rgba(74,158,255,0.5)", borderRadius: 20,
                  padding: "3px 10px", fontSize: 11, fontWeight: 600,
                  backdropFilter: "blur(8px)",
                }}>
                  ✈️ Diaspora
                </span>
              )}
            </div>

            {/* ── Distance badge — top right ───────────────────────────────────── */}
            {topDistStr && (
              <div style={{ position: "absolute", top: 72, right: 14, pointerEvents: "none" }}>
                <span style={{
                  background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)",
                  color: "rgba(255,255,255,0.85)", borderRadius: 20,
                  padding: "3px 10px", fontSize: 11, fontWeight: 600,
                }}>
                  📍 {topDistStr}
                </span>
              </div>
            )}

            {/* ── Property info — bottom left ──────────────────────────────────── */}
            {/*
             * bottom: 82 → sits above progress dots (bottom: 68)
             * right: 72  → clears the action buttons (right: 16, width: 54px)
             */}
            <div style={{
              position: "absolute",
              bottom: 82,
              left: 18,
              right: 72,
              pointerEvents: "none",
            }}>
              {/* Prix — grand, sans badge, texte brut */}
              <p style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 800,
                color: "var(--bl-cream)",
                lineHeight: 1.1,
                textShadow: "0 2px 8px rgba(0,0,0,0.5)",
              }}>
                {formatPrice(topCard.price)}
              </p>
              {topCard.price_period === "month" && (
                <p style={{
                  margin: "2px 0 8px",
                  fontSize: 13,
                  color: "var(--bl-cream-dim)",
                  lineHeight: 1,
                }}>
                  /mois
                </p>
              )}

              {/* Titre */}
              <p style={{
                margin: "0 0 5px",
                color: "var(--bl-cream)",
                fontWeight: 700,
                fontSize: 17,
                lineHeight: 1.3,
                textShadow: "0 1px 6px rgba(0,0,0,0.6)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {topCard.title}
              </p>

              {/* Quartier · Type · Chambres */}
              <div style={{
                display: "flex",
                gap: 5,
                alignItems: "center",
                overflow: "hidden",
              }}>
                <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, whiteSpace: "nowrap" }}>
                  📍 {getNeighborhoodName(topCard.neighborhood)}
                </span>
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>·</span>
                <span style={{ color: "var(--bl-cream-dim)", fontSize: 13, whiteSpace: "nowrap" }}>
                  {topCard.transaction_type === "rent" ? "Location" : "Vente"}
                </span>
                {(topCard.rooms ?? 0) > 0 && (
                  <>
                    <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>·</span>
                    <span style={{ color: "var(--bl-cream-dim)", fontSize: 13, whiteSpace: "nowrap" }}>
                      🛏 {topCard.rooms}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </TinderCard>

        {/* ══════════════════════════════════════════════════════════════════════
            ACTION BUTTONS — right side, column layout
            Order top→bottom: ✕ (pass) · 🔖 (save) · ❤️ (like, bigger)
        ══════════════════════════════════════════════════════════════════════ */}
        <div style={{
          position: "absolute",
          right: 16,
          bottom: 120,
          zIndex: 20,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          alignItems: "center",
        }}>
          {/* ✕ Passer */}
          <button
            onClick={() => triggerSwipe("left")}
            aria-label="Passer"
            style={{
              width: 48, height: 48,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.12)",
              border: "1.5px solid rgba(255,255,255,0.25)",
              color: "var(--bl-cream)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              WebkitTapHighlightColor: "transparent",
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6"  y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* ❤️ J'adore — plus grand, fond doré */}
          <button
            onClick={() => triggerSwipe("right")}
            aria-label="J'adore"
            style={{
              width: 54, height: 54,
              borderRadius: "50%",
              background: "#C8973A",
              border: "none",
              color: "var(--bl-cream)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              WebkitTapHighlightColor: "transparent",
              flexShrink: 0,
              boxShadow: "0 4px 16px rgba(200,151,58,0.50)",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            PROGRESS DOTS — bottom center
            Active: white pill 16×5px · Inactive: round 5×5 rgba(255,255,255,0.3)
        ══════════════════════════════════════════════════════════════════════ */}
        <div style={{
          position: "absolute",
          bottom: 68,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 5,
          zIndex: 20,
          pointerEvents: "none",
        }}>
          {Array.from({ length: dotsTotal }, (_, i) => (
            <div
              key={i}
              style={{
                width:        i === 0 ? 16 : 5,
                height:       5,
                borderRadius: i === 0 ? 3 : "50%",
                background:   i === 0 ? "#ffffff" : "rgba(255,255,255,0.30)",
                transition:   "width 0.2s ease, background 0.2s ease",
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
