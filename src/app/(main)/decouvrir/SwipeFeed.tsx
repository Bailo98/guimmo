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
  const [reloading,       setReloading]       = useState(false);   // true during 1.5s "on recommence" transition
  const [everHadCards,    setEverHadCards]    = useState(false);   // guards against false-empty on initial mount

  // ── Overlay refs — pure DOM manipulation, ZERO React re-renders during drag ──
  // This is the fix for the double-swipe bug: onSwipeRequirementFulfilled was
  // calling setState → React re-render → TinderCard's useLayoutEffect cleanup
  // ran mid-gesture → event listeners detached → card snapped back.
  const overlayRightRef = useRef<HTMLDivElement>(null); // INTÉRESSÉ (swipe right)
  const overlayLeftRef  = useRef<HTMLDivElement>(null); // PASSÉ     (swipe left)
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

  // ── Auto-reload when all cards have been swiped ────────────────────────────
  // Only triggers after cards have been populated at least once (everHadCards).
  // Shows a 1.5s transition message then resets the feed from the full list.
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

  // ── Progressive overlay: pure DOM — no setState, no re-render ─────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const abs    = Math.abs(deltaX);
    // Opacity starts at 15px, saturates at 65px — more reactive
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
    // Snap overlays to 0 — react-tinder-card will handle the fly-off or snap-back
    if (overlayRightRef.current) overlayRightRef.current.style.opacity = "0";
    if (overlayLeftRef.current)  overlayLeftRef.current.style.opacity  = "0";
  }, []);

  // ── Swipe callbacks ────────────────────────────────────────────────────────
  // CRITICAL: onSwipe must NOT call setState. Any state update here triggers a
  // React re-render which causes TinderCard's useLayoutEffect cleanup to run
  // mid-gesture, detaches the event listeners, and snaps the card back.
  // All overlay resets happen via DOM refs above.
  const onSwipe = useCallback(async (dir: string, property: Property) => {
    addSeenId(property.id);
    // Reset overlays via DOM (no setState)
    if (overlayRightRef.current) overlayRightRef.current.style.opacity = "0";
    if (overlayLeftRef.current)  overlayLeftRef.current.style.opacity  = "0";

    if (dir === "right") {
      // Gate: redirect to login if no session — we can't save to DB without auth
      if (!user) {
        router.push("/connexion?redirect=/decouvrir");
        return;
      }
      // Optimistic local update first (instant UX)
      toggleFavorite(property.id);
      toast("❤️ Ajouté aux favoris", "success");
      // Persist to DB. Use ignoreDuplicates:true so PostgREST generates
      // "ON CONFLICT DO NOTHING" instead of "ON CONFLICT DO UPDATE SET …"
      // The latter requires an UPDATE RLS policy which doesn't exist on favorites;
      // DO NOTHING only triggers the INSERT policy which does exist.
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
  }, [user, toggleFavorite]);

  // onCardLeftScreen fires AFTER the fly-off animation — safe to setState here
  const onCardLeft = useCallback((property: Property) => {
    setCards((prev) => prev.filter((p) => p.id !== property.id));
  }, []);

  const triggerSwipe = useCallback(async (dir: "left" | "right") => {
    await topCardRef.current?.swipe(dir);
  }, []);

  const openWhatsApp = useCallback(() => {
    const top = cardsRef.current[0];
    if (!top?.contact_phone) return;
    const msg = encodeURIComponent(`Bonjour, je suis intéressé par "${top.title}" sur LogerBien`);
    window.open(`https://wa.me/${top.contact_phone.replace(/\D/g, "")}?text=${msg}`, "_blank", "noopener");
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!mounted) return null;

  // ── Transition "on recommence" (1.5s) ─────────────────────────────────────
  if (reloading) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 10, background: "#0A1216",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "0 32px",
      }}>
        <p style={{ fontSize: 52, marginBottom: 16, animation: "spin 1s linear infinite" }}>🔄</p>
        <p style={{ color: "#C8A97E", fontWeight: 700, fontSize: 20, textAlign: "center", marginBottom: 8 }}>
          On recommence depuis le début…
        </p>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, textAlign: "center" }}>
          Toutes les annonces vont réapparaître
        </p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Empty but not yet reloading (briefly) ─────────────────────────────────
  if (cards.length === 0 && everHadCards) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 10, background: "#0A1216",
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
          background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
          color: "#fff", fontWeight: 600, fontSize: 15, textDecoration: "none",
        }}>
          Voir toutes les annonces
        </a>
      </div>
    );
  }

  // ── Initial load guard (cards not yet populated) ──────────────────────────
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

  // Story dots: max 15 bars
  const dotsTotal = Math.min(cards.length, 15);

  return (
    <>
    {/* ── Back button — fixed above everything (z-200 > header z-50) ────────── */}
    <button
      onClick={() => router.back()}
      aria-label="Retour"
      style={{
        position: "fixed",
        top: "calc(16px + env(safe-area-inset-top, 0px))",
        left: 16,
        zIndex: 200,
        width: 40, height: 40,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        color: "#fff",
        flexShrink: 0,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>

    {/*
     * FIXED FULL-SCREEN CONTAINER (z-10)
     * ─────────────────────────────────────
     * The card fills the entire viewport. Header (z-50) and any overlays we
     * render here at z-20 sit on top naturally — no clipping, no padding.
     * overflow:hidden blocks any scroll parent interference with react-tinder-card.
     */}
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        zIndex: 10,
        background: "#000",
        // touch-action:none tells the browser not to handle pan/zoom on this
        // container — all touch events go straight to our handlers and to
        // react-tinder-card's listeners without the browser claiming the gesture.
        touchAction: "none",
        // Push content out of notch / status bar on iOS
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      {/* ── Story-style progress bars (Instagram / Snapchat style) ─────────── */}
      {/* Positioned just below the fixed Header (72px) inside our z-10 context */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 12,
          right: 12,
          zIndex: 30,
          display: "flex",
          gap: 3,
          pointerEvents: "none",
        }}
      >
        {Array.from({ length: dotsTotal }, (_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: i === 0
                ? "rgba(255,255,255,0.95)"
                : "rgba(255,255,255,0.28)",
              transition: "background 0.2s",
            }}
          />
        ))}
      </div>

      {/* ── Top card: react-tinder-card ──────────────────────────────────── */}
      {/*
       * - className="tc-swipe" → position:absolute; inset:0; z-index:10
       * - swipeRequirementType="velocity" is the natural Tinder mode: a quick
       *   flick registers a swipe regardless of how far the card moved.
       *   We deliberately omit onSwipeRequirementFulfilled/Unfulfilled to avoid
       *   the setState-during-gesture re-render that caused the double-swipe bug.
       * - preventSwipe:["up","down"] keeps swipes horizontal only.
       */}
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
        {/*
         * className="pressable" → react-tinder-card skips ev.preventDefault()
         * on touchstart originating here, allowing synthetic click events to fire
         * (needed for tap-to-navigate). Safe because our container has no scroll.
         *
         * Our own onTouchStart/Move/End live here — they only update DOM refs
         * (overlayRightRef / overlayLeftRef), never setState, so they are
         * completely invisible to React's reconciler during the gesture.
         */}
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
            background: "linear-gradient(transparent 35%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.88) 100%)",
          }} />

          {/* ── ❤️ INTÉRESSÉ overlay (top-left, swipe right) ──────────────── */}
          {/* opacity starts at 0, animated via DOM ref — no React state */}
          <div
            ref={overlayRightRef}
            style={{
              position: "absolute",
              top: 108,
              left: 24,
              pointerEvents: "none",
              opacity: 0,
            }}
          >
            <div style={{
              border: "3px solid #C8A97E",
              borderRadius: 8,
              padding: "8px 16px",
              color: "#fff",
              fontSize: 32,
              fontWeight: 900,
              letterSpacing: 2,
              textTransform: "uppercase",
              transform: "rotate(-15deg)",
              textShadow: "0 2px 8px rgba(0,0,0,0.6)",
              whiteSpace: "nowrap",
            }}>
              ❤️ INTÉRESSÉ
            </div>
          </div>

          {/* ── ✕ PASSÉ overlay (top-right, swipe left) ───────────────────── */}
          <div
            ref={overlayLeftRef}
            style={{
              position: "absolute",
              top: 108,
              right: 24,
              pointerEvents: "none",
              opacity: 0,
            }}
          >
            <div style={{
              border: "3px solid #FF4D4D",
              borderRadius: 8,
              padding: "8px 16px",
              color: "#fff",
              fontSize: 32,
              fontWeight: 900,
              letterSpacing: 2,
              textTransform: "uppercase",
              transform: "rotate(15deg)",
              textShadow: "0 2px 8px rgba(0,0,0,0.6)",
              whiteSpace: "nowrap",
            }}>
              ✕ PASSÉ
            </div>
          </div>

          {/* ── Badges — top left (below dots) ────────────────────────────── */}
          <div style={{
            position: "absolute", top: 96, left: 14,
            display: "flex", flexDirection: "column", gap: 6,
            pointerEvents: "none",
          }}>
            {topCard.is_featured && (
              <span style={{
                background: "rgba(200,169,126,0.25)", color: "#C8A97E",
                border: "1px solid rgba(200,169,126,0.5)", borderRadius: 20,
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

          {/* ── Distance badge — top right ─────────────────────────────────── */}
          {topDistStr && (
            <div style={{ position: "absolute", top: 96, right: 14, pointerEvents: "none" }}>
              <span style={{
                background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)",
                color: "rgba(255,255,255,0.85)", borderRadius: 20,
                padding: "3px 10px", fontSize: 11, fontWeight: 600,
              }}>
                📍 {topDistStr}
              </span>
            </div>
          )}

          {/* ── Property info — bottom ─────────────────────────────────────── */}
          {/* paddingBottom leaves room for the 3 action buttons below */}
          <div style={{
            position: "absolute",
            bottom: 0, left: 0, right: 0,
            padding: "0 20px calc(env(safe-area-inset-bottom, 0px) + 110px) 20px",
            pointerEvents: "none",
          }}>
            <p style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: 28, fontWeight: 700, color: "#C8A97E",
              lineHeight: 1.2, marginBottom: 6,
              textShadow: "0 2px 10px rgba(0,0,0,0.7)",
            }}>
              {formatPrice(topCard.price, "GNF", topCard.price_period)}
            </p>
            <p style={{
              color: "#fff", fontWeight: 700, fontSize: 18,
              lineHeight: 1.3, marginBottom: 6,
              textShadow: "0 1px 6px rgba(0,0,0,0.6)",
            }}>
              {topCard.title}
            </p>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 14 }}>
                📍 {getNeighborhoodName(topCard.neighborhood)}
              </span>
              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 14 }}>·</span>
              <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 14 }}>
                {topCard.transaction_type === "rent" ? "Location" : "Vente"}
              </span>
              {(topCard.rooms ?? 0) > 0 && (
                <>
                  <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 14 }}>·</span>
                  <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 14 }}>🛏 {topCard.rooms}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </TinderCard>

      {/* ── 3 action buttons ─────────────────────────────────────────────────── */}
      {/*
       * z-20: above card (z-10) but below Header / BottomNav (z-50 at root level).
       * BottomNav is hidden on /decouvrir so buttons sit above the safe area directly.
       */}
      <div style={{
        position: "absolute",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)",
        left: 0, right: 0,
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
      }}>
        {/* ✕ Pass */}
        <button
          onClick={() => triggerSwipe("left")}
          aria-label="Passer"
          style={{
            width: 60, height: 60, borderRadius: "50%",
            background: "rgba(255,77,77,0.15)",
            border: "2px solid #FF4D4D",
            color: "#FF4D4D",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            WebkitTapHighlightColor: "transparent",
            flexShrink: 0,
            boxShadow: "0 4px 16px rgba(255,77,77,0.3)",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6"  y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* ❤️ Like — bigger (Tinder central button) */}
        <button
          onClick={() => triggerSwipe("right")}
          aria-label="Intéressé"
          style={{
            width: 70, height: 70, borderRadius: "50%",
            background: "rgba(200,169,126,0.20)",
            border: "2px solid #C8A97E",
            color: "#C8A97E",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            WebkitTapHighlightColor: "transparent",
            flexShrink: 0,
            boxShadow: "0 4px 20px rgba(200,169,126,0.35)",
          }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* 💬 WhatsApp */}
        <button
          onClick={openWhatsApp}
          aria-label="Contacter sur WhatsApp"
          style={{
            width: 60, height: 60, borderRadius: "50%",
            background: "rgba(37,211,102,0.15)",
            border: "2px solid #25D366",
            color: "#25D366",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            WebkitTapHighlightColor: "transparent",
            flexShrink: 0,
            boxShadow: "0 4px 16px rgba(37,211,102,0.25)",
          }}
        >
          {/* WhatsApp brand icon */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        </button>
      </div>
    </div>
    </>
  );
}
