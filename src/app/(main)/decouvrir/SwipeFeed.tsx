"use client";
import { useState, useEffect, useRef, useCallback } from "react";
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

// ─────────────────────────────────────────────────────────────────────────────
// SwipeFeed — full-screen fixed overlay, zero scroll-parent interference
//
// ROOT CAUSE of previous failures:
//   The card was inside a <section> embedded in a scrollable page.
//   On iOS/Android the browser commits to a scroll gesture on touchstart
//   (before the first touchmove fires), so even { passive:false } + preventDefault
//   on touchmove is ignored once the scroll has been decided.
//
// FIX: position:fixed + inset:0 + overflow:hidden takes the container OUT of
//   the scroll flow entirely. No scroll parent → no interference.
// ─────────────────────────────────────────────────────────────────────────────
export function SwipeFeed({ properties }: { properties: Property[] }) {
  const router         = useRouter();
  const { user }       = useAuth();
  const { toggleFavorite } = useAppStore();

  const [mounted,      setMounted]      = useState(false);
  const [cards,        setCards]        = useState<Property[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // DOM refs — manipulated directly to avoid re-renders during drag
  const cardRef = useRef<HTMLDivElement>(null);  // top card element
  const likeRef = useRef<HTMLDivElement>(null);  // "INTÉRESSÉ" overlay
  const nopeRef = useRef<HTMLDivElement>(null);  // "PASSÉ" overlay

  // Always-fresh reference to cards — lets event-listener closures read current
  // state without being stale (avoids re-running the heavy useEffect on every render)
  const cardsRef = useRef<Property[]>([]);
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

  // ── Filter seen cards + sort ───────────────────────────────────────────────
  useEffect(() => {
    if (properties.length === 0) return;
    const seen = getSeenIds();
    let list = properties.filter((p) => !seen.includes(p.id));

    // Auto-reset when > 80 % seen
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
  }, [properties, userLocation]);

  // ── Swipe completion (called after fly-out animation) ─────────────────────
  const handleSwipe = useCallback(
    async (direction: "left" | "right", property: Property) => {
      addSeenId(property.id);
      setCards((prev) => prev.filter((p) => p.id !== property.id));
      if (direction === "right") {
        toggleFavorite(property.id);
        toast("❤️ Ajouté aux favoris", "success");
        if (user && isSupabaseConfigured && supabase) {
          try {
            await supabase
              .from("favorites")
              .upsert({ user_id: user.id, property_id: property.id }, { onConflict: "user_id,property_id" });
          } catch { /* silent */ }
        }
      }
    },
    [user, toggleFavorite]
  );

  // Stable ref so the drag useEffect can call the latest handleSwipe
  // without listing it as a dependency (which would cause listener re-attachment on every render)
  const handleSwipeRef = useRef(handleSwipe);
  handleSwipeRef.current = handleSwipe;

  // ── Touch / Mouse event listeners ─────────────────────────────────────────
  // Re-runs only when the top card ID changes, NOT on every render.
  // Uses cardsRef / handleSwipeRef so closures are always fresh.
  const topCardId = cards[0]?.id;

  useEffect(() => {
    if (!mounted) return;
    const elOrNull = cardRef.current;
    if (!elOrNull) return;
    // Rebind to a definitively-typed alias so TypeScript doesn't re-widen
    // the type to `null | HTMLDivElement` inside nested function bodies
    // (TypeScript doesn't propagate control-flow narrowing through closures).
    const el: HTMLDivElement = elOrNull;

    let startX = 0, startY = 0, currentX = 0, currentY = 0;
    let isDragging = false;

    // ── helpers ──────────────────────────────────────────────────────────────
    function onStart(x: number, y: number) {
      console.log("[SwipeFeed] touchstart", x, y); // DEBUG — check this in browser console on mobile
      startX = x; startY = y; currentX = x; currentY = y;
      isDragging = true;
      el.style.transition = "none";
    }

    function onMove(x: number, y: number) {
      if (!isDragging) return;
      currentX = x; currentY = y;
      const dx = x - startX;
      el.style.transform = `translateX(${dx}px) rotate(${dx / 20}deg)`;
      if (likeRef.current)
        likeRef.current.style.opacity = String(Math.max(0, Math.min(1, dx / 100)));
      if (nopeRef.current)
        nopeRef.current.style.opacity = String(Math.max(0, Math.min(1, -dx / 100)));
    }

    function onEnd() {
      if (!isDragging) return;
      isDragging = false;
      const dx = currentX - startX;
      const dy = currentY - startY;
      const card = cardsRef.current[0];

      if (dx > 80) {
        // Fly out right → like
        el.style.transition = "transform 0.35s ease-out, opacity 0.35s ease-out";
        el.style.transform  = "translateX(160%) rotate(20deg)";
        el.style.opacity    = "0";
        if (card) setTimeout(() => handleSwipeRef.current("right", card), 350);

      } else if (dx < -80) {
        // Fly out left → pass
        el.style.transition = "transform 0.35s ease-out, opacity 0.35s ease-out";
        el.style.transform  = "translateX(-160%) rotate(-20deg)";
        el.style.opacity    = "0";
        if (card) setTimeout(() => handleSwipeRef.current("left", card), 350);

      } else if (Math.abs(dx) < 12 && Math.abs(dy) < 12 && card) {
        // Tap (very little movement) → navigate to detail
        router.push(`/annonces/${card.id}`);

      } else if (dy < -80 && Math.abs(dy) > Math.abs(dx) && card) {
        // Swipe up → navigate to detail
        router.push(`/annonces/${card.id}`);

      } else {
        // Snap back to center
        el.style.transition = "transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94)";
        el.style.transform  = "translateX(0) rotate(0deg)";
        el.style.opacity    = "1";
        if (likeRef.current) likeRef.current.style.opacity = "0";
        if (nopeRef.current) nopeRef.current.style.opacity = "0";
      }
    }

    // ── Touch bindings ────────────────────────────────────────────────────────
    // BOTH touchstart and touchmove are passive:false.
    // touchstart:passive:false lets us call preventDefault() immediately,
    // telling the browser "this touch belongs to the app, don't even consider scrolling".
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault(); // critical: block scroll decision before touchmove even fires
      onStart(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // belt-and-suspenders
      onMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd  = () => onEnd();
    const onTouchCancel = () => {
      isDragging = false;
      el.style.transition = "transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94)";
      el.style.transform  = "translateX(0) rotate(0deg)";
      el.style.opacity    = "1";
      if (likeRef.current) likeRef.current.style.opacity = "0";
      if (nopeRef.current) nopeRef.current.style.opacity = "0";
    };

    // ── Mouse bindings (desktop) ──────────────────────────────────────────────
    const onMouseDown  = (e: MouseEvent) => { e.preventDefault(); onStart(e.clientX, e.clientY); };
    const onMouseMove  = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const onMouseUp    = () => onEnd();

    el.addEventListener("touchstart",   onTouchStart,  { passive: false });
    el.addEventListener("touchmove",    onTouchMove,   { passive: false });
    el.addEventListener("touchend",     onTouchEnd,    { passive: true  });
    el.addEventListener("touchcancel",  onTouchCancel, { passive: true  });
    el.addEventListener("mousedown",    onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseUp);

    return () => {
      el.removeEventListener("touchstart",   onTouchStart);
      el.removeEventListener("touchmove",    onTouchMove);
      el.removeEventListener("touchend",     onTouchEnd);
      el.removeEventListener("touchcancel",  onTouchCancel);
      el.removeEventListener("mousedown",    onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onMouseUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topCardId, mounted]); // router intentionally omitted — stable across renders

  // ── Button-triggered swipe (animates card then updates state) ─────────────
  const triggerSwipe = useCallback((direction: "left" | "right") => {
    const top = cardsRef.current[0];
    const el  = cardRef.current;
    if (!top || !el) return;
    el.style.transition = "transform 0.35s ease-out, opacity 0.35s ease-out";
    el.style.transform  = direction === "right" ? "translateX(160%) rotate(20deg)" : "translateX(-160%) rotate(-20deg)";
    el.style.opacity    = "0";
    setTimeout(() => handleSwipeRef.current(direction, top), 350);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!mounted) return null; // skip SSR — avoids hydration mismatch with localStorage

  // ── Empty state ────────────────────────────────────────────────────────────
  if (cards.length === 0) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 10,
        background: "#0A1216",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "0 32px",
      }}>
        <p style={{ fontSize: 56, marginBottom: 16 }}>🏠</p>
        <h2 style={{ color: "#fff", fontWeight: 700, fontSize: 22, marginBottom: 8, textAlign: "center" }}>
          Vous avez tout vu !
        </h2>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginBottom: 32, textAlign: "center", lineHeight: 1.6 }}>
          Revenez plus tard pour de nouvelles annonces, ou explorez toutes les annonces disponibles.
        </p>
        <button
          onClick={() => { localStorage.removeItem(SEEN_KEY); window.location.reload(); }}
          style={{
            background: "#C8A97E", color: "#0A1216", fontWeight: 700,
            padding: "14px 0", borderRadius: 14, width: "100%", maxWidth: 320,
            fontSize: 15, cursor: "pointer", marginBottom: 12,
          }}
        >
          🔄 Recommencer depuis le début
        </button>
        <a
          href="/annonces"
          style={{
            display: "block", textAlign: "center", width: "100%", maxWidth: 320,
            padding: "14px 0", borderRadius: 14,
            background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
            color: "#fff", fontWeight: 600, fontSize: 15, textDecoration: "none",
          }}
        >
          Voir toutes les annonces
        </a>
      </div>
    );
  }

  const visibleCards = cards.slice(0, 3);
  const topCard      = cards[0];

  return (
    /*
     * FIXED FULL-SCREEN CONTAINER
     * ─────────────────────────────
     * position:fixed + inset:0 → no scroll parent.
     * overflow:hidden            → no internal scrolling possible.
     * z-index:10                 → below header (z-40+) and BottomNav (z-50).
     *
     * The header and BottomNav are fixed at higher z-index,
     * so they naturally overlay this container at top and bottom.
     */
    <div
      id="swipe-container"
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        zIndex: 10,
        background: "#080D12",
        touchAction: "none", // belt-and-suspenders on the container too
      }}
    >
      {/* ── Card stack ──────────────────────────────────────────────────────── */}
      {/* Rendered in reverse so the top card is last in DOM (painted on top) */}
      {[...visibleCards].reverse().map((property, reversedIdx) => {
        const stackIdx = visibleCards.length - 1 - reversedIdx;
        const isTop    = stackIdx === 0;

        const primaryImg      = property.property_images?.find((i) => i.is_primary) ?? property.property_images?.[0];
        const neighborhoodLabel = getNeighborhoodName(property.neighborhood);
        const priceStr        = formatPrice(property.price, "GNF", property.price_period);

        let distStr: string | null = null;
        if (userLocation) {
          const pLat = property.lat ?? property.latitude;
          const pLng = property.lng ?? property.longitude;
          if (pLat && pLng) {
            distStr = formatDistance(haversineKm(userLocation.lat, userLocation.lng, pLat, pLng));
          } else {
            const coords = NEIGHBORHOOD_COORDINATES[property.neighborhood];
            if (coords) distStr = `~${formatDistance(haversineKm(userLocation.lat, userLocation.lng, coords[0], coords[1]))}`;
          }
        }

        // Back cards are slightly scaled down to give depth
        const depthOffset = visibleCards.length - 1 - stackIdx; // 0=top, 1=second, 2=third
        const scale       = 1 - depthOffset * 0.04;
        const translateY  = depthOffset * 12;

        return (
          <div
            key={property.id}
            ref={isTop ? cardRef : undefined}
            style={{
              // ─ Layout: full screen ─
              position: "absolute",
              inset: 0,
              zIndex: stackIdx + 1,

              // ─ Touch: CRITICAL — must be on the element itself ─
              touchAction: "none",  // CSS property (not just React prop)
              userSelect: "none",
              WebkitUserSelect: "none",

              // ─ Visual ─
              cursor: isTop ? "grab" : "default",
              transform: isTop ? "scale(1)" : `scale(${scale}) translateY(${translateY}px)`,
              transition: isTop ? "none" : "transform 0.3s ease",
              willChange: isTop ? "transform, opacity" : "auto",

              // ─ Rounded corners (applied on the div, clip handled by overflow:hidden) ─
              borderRadius: 20,
              overflow: "hidden",
              background: "#161B26",
              boxShadow: "0 16px 48px rgba(0,0,0,0.7)",

              // Extra margin to keep cards off the header and nav
              // (the fixed container already fills inset:0, but cards peek out nicely)
              top: 80,    // below header (~72px) + 8px breathing room
              bottom: "calc(env(safe-area-inset-bottom, 0px) + 160px)", // above nav + action buttons
              left: 12,
              right: 12,
            }}
          >
            {/* Full-screen photo */}
            {primaryImg ? (
              <Image
                src={primaryImg.url}
                alt={property.title}
                fill
                style={{ objectFit: "cover" }}
                sizes="100vw"
                quality={isTop ? 85 : 40}
                priority={isTop}
                draggable={false}
              />
            ) : (
              <div style={{
                position: "absolute", inset: 0,
                background: "#1a252b",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 80, opacity: 0.12 }}>🏠</span>
              </div>
            )}

            {/* Gradient overlay — darkens bottom for text readability */}
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "linear-gradient(transparent 38%, rgba(0,0,0,0.45) 62%, rgba(0,0,0,0.90) 100%)",
            }} />

            {/* Badges — top left */}
            <div style={{
              position: "absolute", top: 12, left: 12,
              display: "flex", flexDirection: "column", gap: 6,
              pointerEvents: "none",
            }}>
              {property.is_featured && (
                <span style={{ background: "rgba(200,169,126,0.25)", color: "#C8A97E", border: "1px solid rgba(200,169,126,0.5)", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600, backdropFilter: "blur(8px)" }}>
                  ⭐ Premium
                </span>
              )}
              {property.is_diaspora && (
                <span style={{ background: "rgba(74,158,255,0.25)", color: "#4A9EFF", border: "1px solid rgba(74,158,255,0.5)", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600, backdropFilter: "blur(8px)" }}>
                  ✈️ Diaspora
                </span>
              )}
            </div>

            {/* Distance badge — top right */}
            {distStr && (
              <div style={{ position: "absolute", top: 12, right: 12, pointerEvents: "none" }}>
                <span style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", color: "rgba(255,255,255,0.85)", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
                  📍 {distStr}
                </span>
              </div>
            )}

            {/* ❤️ INTÉRESSÉ overlay — only rendered on top card */}
            {isTop && (
              <div
                ref={likeRef}
                style={{
                  position: "absolute", inset: 0, pointerEvents: "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: 0,
                }}
              >
                <div style={{
                  fontSize: 32, fontWeight: 900, letterSpacing: 2,
                  color: "#C8A97E", border: "4px solid #C8A97E", borderRadius: 14,
                  padding: "8px 22px", transform: "rotate(-15deg)",
                  textShadow: "0 2px 8px rgba(0,0,0,0.6)",
                  background: "rgba(0,0,0,0.25)", backdropFilter: "blur(4px)",
                }}>
                  ❤️ INTÉRESSÉ
                </div>
              </div>
            )}

            {/* ✕ PASSÉ overlay — only rendered on top card */}
            {isTop && (
              <div
                ref={nopeRef}
                style={{
                  position: "absolute", inset: 0, pointerEvents: "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: 0,
                }}
              >
                <div style={{
                  fontSize: 32, fontWeight: 900, letterSpacing: 2,
                  color: "#FF4D4D", border: "4px solid #FF4D4D", borderRadius: 14,
                  padding: "8px 22px", transform: "rotate(15deg)",
                  textShadow: "0 2px 8px rgba(0,0,0,0.6)",
                  background: "rgba(0,0,0,0.25)", backdropFilter: "blur(4px)",
                }}>
                  ✕ PASSÉ
                </div>
              </div>
            )}

            {/* Property info — bottom of card */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              padding: "16px 16px 20px",
              pointerEvents: "none",
            }}>
              <p style={{
                fontFamily: "var(--font-playfair), serif",
                fontSize: 24, fontWeight: 700, color: "#C8A97E",
                lineHeight: 1.2, marginBottom: 4,
                textShadow: "0 2px 8px rgba(0,0,0,0.6)",
              }}>
                {priceStr}
              </p>
              <p style={{ color: "#fff", fontWeight: 700, fontSize: 16, lineHeight: 1.3, marginBottom: 4, textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
                {property.title}
              </p>
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                  📍 {neighborhoodLabel}
                </span>
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>·</span>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
                  {property.transaction_type === "rent" ? "Location" : "Vente"}
                </span>
                {(property.rooms ?? 0) > 0 && (
                  <>
                    <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>·</span>
                    <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>🛏 {property.rooms}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* ── Counter (top-left, above cards but below header) ────────────────── */}
      <div style={{
        position: "absolute", top: 84, left: 20, zIndex: 20, pointerEvents: "none",
      }}>
        <span style={{
          background: "rgba(0,0,0,0.55)", backdropFilter: "blur(10px)",
          color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 600,
          borderRadius: 20, padding: "4px 12px",
          border: "1px solid rgba(255,255,255,0.1)",
        }}>
          {cards.length} annonce{cards.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Swipe hint ───────────────────────────────────────────────────────── */}
      <div style={{
        position: "absolute", top: 84, right: 20, zIndex: 20, pointerEvents: "none",
      }}>
        <span style={{
          background: "rgba(0,0,0,0.55)", backdropFilter: "blur(10px)",
          color: "rgba(255,255,255,0.4)", fontSize: 11,
          borderRadius: 20, padding: "4px 12px",
          border: "1px solid rgba(255,255,255,0.08)",
        }}>
          ← Passer · Intéressé →
        </span>
      </div>

      {/* ── Action buttons ───────────────────────────────────────────────────── */}
      {/* Positioned above the bottom nav area. Since this container is z-10   */}
      {/* and BottomNav is z-50, the nav sits on top — so we position buttons  */}
      {/* high enough to not be covered by the nav (64px + safe-area).         */}
      <div style={{
        position: "absolute",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 76px)",
        left: 0, right: 0, zIndex: 20,
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 20,
      }}>
        {/* ✕ Pass */}
        <button
          onClick={() => triggerSwipe("left")}
          aria-label="Passer"
          style={{
            width: 52, height: 52, borderRadius: "50%",
            background: "rgba(255,77,77,0.15)",
            border: "2px solid rgba(255,77,77,0.75)",
            color: "#FF4D4D",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
            flexShrink: 0,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* 📋 Voir la fiche */}
        <button
          onClick={() => { if (topCard) router.push(`/annonces/${topCard.id}`); }}
          aria-label="Voir la fiche"
          style={{
            height: 44, borderRadius: 22, padding: "0 18px",
            background: "rgba(0,0,0,0.55)", backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.18)",
            color: "rgba(255,255,255,0.75)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: 13, fontWeight: 600,
            WebkitTapHighlightColor: "transparent",
            flexShrink: 0,
          }}
        >
          Voir fiche
        </button>

        {/* ❤️ Like */}
        <button
          onClick={() => triggerSwipe("right")}
          aria-label="Intéressé"
          style={{
            width: 60, height: 60, borderRadius: "50%",
            background: "rgba(200,169,126,0.20)",
            border: "2px solid rgba(200,169,126,0.85)",
            color: "#C8A97E",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
            flexShrink: 0,
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* 💬 WhatsApp */}
        <button
          onClick={() => {
            const top = cardsRef.current[0];
            if (!top?.contact_phone) return;
            const msg = encodeURIComponent(`Bonjour, je suis intéressé par "${top.title}" sur LogerBien`);
            window.open(`https://wa.me/${top.contact_phone.replace(/\D/g, "")}?text=${msg}`, "_blank", "noopener");
          }}
          aria-label="Contacter sur WhatsApp"
          style={{
            width: 52, height: 52, borderRadius: "50%",
            background: "rgba(37,211,102,0.15)",
            border: "2px solid rgba(37,211,102,0.75)",
            color: "#25D366",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
            flexShrink: 0,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
