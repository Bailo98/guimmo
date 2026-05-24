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

// react-tinder-card exposes this API via forwardRef
type TinderAPI = {
  swipe: (dir: "left" | "right" | "up" | "down") => Promise<void>;
  restoreCard: () => Promise<void>;
};

export function SwipeFeed({ properties }: { properties: Property[] }) {
  const router         = useRouter();
  const { user }       = useAuth();
  const { toggleFavorite } = useAppStore();

  const [mounted,      setMounted]      = useState(false);
  const [cards,        setCards]        = useState<Property[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  // Direction highlight for INTÉRESSÉ / PASSÉ overlay
  const [overlayDir,   setOverlayDir]   = useState<"left" | "right" | null>(null);

  // Ref to top card's TinderCard API (for programmatic button swipe)
  // Cast via `any` because the lib ships as React.FC (not forwardRef) in its typedefs
  // but the runtime implementation does use forwardRef correctly.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topCardRef = useRef<TinderAPI>(null as any);

  // Always-fresh cards list so stable callbacks can read current state
  const cardsRef = useRef(cards);
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
  }, [properties, userLocation]);

  // ── Callbacks (stable — passed to TinderCard props) ───────────────────────
  // onSwipe: immediate side-effects (called when the swipe gesture is recognised,
  //          BEFORE the fly-off animation finishes)
  const onSwipe = useCallback(async (dir: string, property: Property) => {
    addSeenId(property.id);
    setOverlayDir(null);
    if (dir === "right") {
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
  }, [user, toggleFavorite]);

  // onCardLeftScreen: remove from state (called AFTER the fly-off animation)
  const onCardLeft = useCallback((property: Property) => {
    setCards((prev) => prev.filter((p) => p.id !== property.id));
  }, []);

  // Overlay: show INTÉRESSÉ / PASSÉ when threshold is met
  const onFulfilled = useCallback((dir: string) => {
    setOverlayDir(dir === "left" || dir === "right" ? dir : null);
  }, []);
  const onUnfulfilled = useCallback(() => setOverlayDir(null), []);

  // Programmatic swipe via action buttons
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
  if (!mounted) return null; // skip SSR

  const topCard   = cards[0];
  const backCards = cards.slice(1, 3); // at most 2 back cards shown

  if (!topCard) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 10, background: "#0A1216",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "0 32px",
      }}>
        <p style={{ fontSize: 56, marginBottom: 16 }}>🏠</p>
        <h2 style={{ color: "#fff", fontWeight: 700, fontSize: 22, marginBottom: 8, textAlign: "center" }}>
          Vous avez tout vu !
        </h2>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginBottom: 32, textAlign: "center", lineHeight: 1.6 }}>
          Revenez plus tard pour de nouvelles annonces.
        </p>
        <button
          onClick={() => { localStorage.removeItem(SEEN_KEY); window.location.reload(); }}
          style={{
            background: "#C8A97E", color: "#0A1216", fontWeight: 700,
            padding: "14px 0", borderRadius: 14, width: "100%", maxWidth: 320,
            fontSize: 15, cursor: "pointer", marginBottom: 12, border: "none",
          }}
        >
          🔄 Recommencer depuis le début
        </button>
        <a href="/annonces" style={{
          display: "block", textAlign: "center", width: "100%", maxWidth: 320,
          padding: "14px 0", borderRadius: 14,
          background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
          color: "#fff", fontWeight: 600, fontSize: 15, textDecoration: "none",
        }}>
          Voir toutes les annonces
        </a>
      </div>
    );
  }

  const topImg = topCard.property_images?.find((i) => i.is_primary) ?? topCard.property_images?.[0];

  // Distance for top card
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

  // ── Card area bounds (shared between TinderCard child + back cards) ──────
  // top:80px = below fixed header (72px) + 8px gap
  // bottom = above action buttons (160px) + safe-area
  const CARD_TOP    = 80;
  const CARD_LEFT   = 12;
  const CARD_RIGHT  = 12;
  const CARD_BOTTOM = "calc(env(safe-area-inset-bottom, 0px) + 160px)";

  return (
    /*
     * FIXED FULL-SCREEN CONTAINER (z-10)
     * ────────────────────────────────────
     * - Header (z-40+) and BottomNav (z-50) are fixed at higher z-index and
     *   naturally appear on top.
     * - overflow:hidden prevents any internal scroll.
     * - No scroll parent → react-tinder-card's ev.preventDefault() on touchstart
     *   actually works, blocking any gesture conflict.
     */
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        zIndex: 10,
        background: "#080D12",
      }}
    >
      {/* ── Visual stack: back cards (plain divs, no gesture handling) ─────── */}
      {backCards.map((property, i) => {
        const depth = i + 1; // 1 or 2
        const img = property.property_images?.find((x) => x.is_primary) ?? property.property_images?.[0];
        return (
          <div
            key={property.id}
            style={{
              position:     "absolute",
              top:          CARD_TOP + depth * 6,
              left:         CARD_LEFT + depth * 10,
              right:        CARD_RIGHT + depth * 10,
              bottom:       `calc(env(safe-area-inset-bottom, 0px) + 160px + ${depth * 6}px)`,
              borderRadius: 20,
              overflow:     "hidden",
              background:   "#161B26",
              boxShadow:    "0 8px 24px rgba(0,0,0,0.4)",
              pointerEvents: "none",
              zIndex:       10 - depth,
            }}
          >
            {img && (
              <Image
                src={img.url}
                alt={property.title}
                fill
                style={{ objectFit: "cover", opacity: 0.5 }}
                sizes="100vw"
              />
            )}
            {/* Darken back cards */}
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)" }} />
          </div>
        );
      })}

      {/* ── Top card: react-tinder-card ──────────────────────────────────── */}
      {/*
       * - className="tc-swipe" → sets position:absolute; inset:0; z-index:10
       *   (defined in globals.css — makes TinderCard fill the fixed container)
       * - Only ONE TinderCard is rendered at a time (the top card).
       *   When it leaves the screen, onCardLeftScreen removes it from state,
       *   the next card in `cards` becomes the new top, and a fresh TinderCard
       *   mounts with the new key.
       * - preventSwipe:["up","down"] keeps swipes horizontal.
       * - swipeRequirementType:"position" + swipeThreshold:80 match our UX.
       */}
      <TinderCard
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        ref={topCardRef as any}
        key={topCard.id}
        onSwipe={(dir) => onSwipe(dir, topCard)}
        onCardLeftScreen={() => onCardLeft(topCard)}
        preventSwipe={["up", "down"]}
        swipeRequirementType="position"
        swipeThreshold={80}
        onSwipeRequirementFulfilled={onFulfilled}
        onSwipeRequirementUnfulfilled={onUnfulfilled}
        className="tc-swipe"
      >
        {/*
         * className="pressable" tells react-tinder-card to NOT call
         * ev.preventDefault() on touchstart for touches that originate here.
         * This allows the browser to fire synthetic `click` events (needed for
         * the tap-to-navigate behaviour). Since our container is position:fixed
         * with overflow:hidden, there is no page scroll to accidentally trigger,
         * so skipping preventDefault is safe.
         */}
        <div
          className="pressable"
          style={{
            position:     "absolute",
            top:          CARD_TOP,
            left:         CARD_LEFT,
            right:        CARD_RIGHT,
            bottom:       CARD_BOTTOM,
            borderRadius: 20,
            overflow:     "hidden",
            background:   "#161B26",
            boxShadow:    "0 16px 48px rgba(0,0,0,0.7)",
            cursor:       "grab",
          }}
          onClick={() => router.push(`/annonces/${topCard.id}`)}
        >
          {/* Full-screen photo */}
          {topImg ? (
            <Image
              src={topImg.url}
              alt={topCard.title}
              fill
              style={{ objectFit: "cover" }}
              sizes="100vw"
              quality={85}
              priority
              draggable={false}
            />
          ) : (
            <div style={{
              position: "absolute", inset: 0, background: "#1a252b",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 80, opacity: 0.12 }}>🏠</span>
            </div>
          )}

          {/* Gradient */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "linear-gradient(transparent 38%, rgba(0,0,0,0.45) 62%, rgba(0,0,0,0.90) 100%)",
          }} />

          {/* ❤️ INTÉRESSÉ overlay */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: overlayDir === "right" ? 1 : 0,
            transition: "opacity 0.12s ease",
          }}>
            <div style={{
              fontSize: 30, fontWeight: 900, letterSpacing: 2,
              color: "#C8A97E", border: "4px solid #C8A97E", borderRadius: 14,
              padding: "8px 22px", transform: "rotate(-15deg)",
              background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)",
            }}>
              ❤️ INTÉRESSÉ
            </div>
          </div>

          {/* ✕ PASSÉ overlay */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: overlayDir === "left" ? 1 : 0,
            transition: "opacity 0.12s ease",
          }}>
            <div style={{
              fontSize: 30, fontWeight: 900, letterSpacing: 2,
              color: "#FF4D4D", border: "4px solid #FF4D4D", borderRadius: 14,
              padding: "8px 22px", transform: "rotate(15deg)",
              background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)",
            }}>
              ✕ PASSÉ
            </div>
          </div>

          {/* Badges — top left */}
          <div style={{
            position: "absolute", top: 12, left: 12,
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

          {/* Distance badge — top right */}
          {topDistStr && (
            <div style={{ position: "absolute", top: 12, right: 12, pointerEvents: "none" }}>
              <span style={{
                background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)",
                color: "rgba(255,255,255,0.85)", borderRadius: 20,
                padding: "3px 10px", fontSize: 11, fontWeight: 600,
              }}>
                📍 {topDistStr}
              </span>
            </div>
          )}

          {/* Property info — bottom */}
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
              {formatPrice(topCard.price, "GNF", topCard.price_period)}
            </p>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: 16, lineHeight: 1.3, marginBottom: 4 }}>
              {topCard.title}
            </p>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                📍 {getNeighborhoodName(topCard.neighborhood)}
              </span>
              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>·</span>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
                {topCard.transaction_type === "rent" ? "Location" : "Vente"}
              </span>
              {(topCard.rooms ?? 0) > 0 && (
                <>
                  <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>·</span>
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>🛏 {topCard.rooms}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </TinderCard>

      {/* ── Counter + hint (above cards, z-20) ────────────────────────────── */}
      <div style={{
        position: "absolute", top: 84, left: 20, zIndex: 20, pointerEvents: "none",
      }}>
        <span style={{
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)",
          color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 600,
          borderRadius: 20, padding: "4px 12px",
          border: "1px solid rgba(255,255,255,0.1)",
        }}>
          {cards.length} annonce{cards.length > 1 ? "s" : ""}
        </span>
      </div>
      <div style={{
        position: "absolute", top: 84, right: 20, zIndex: 20, pointerEvents: "none",
      }}>
        <span style={{
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)",
          color: "rgba(255,255,255,0.38)", fontSize: 11,
          borderRadius: 20, padding: "4px 12px",
          border: "1px solid rgba(255,255,255,0.08)",
        }}>
          ← Passer · Intéressé →
        </span>
      </div>

      {/* ── Action buttons (z-20, above cards, below header/nav at z-50) ──── */}
      {/* bottom = safe-area + 76px keeps buttons above the BottomNav (64px) */}
      <div style={{
        position: "absolute",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 76px)",
        left: 0, right: 0, zIndex: 20,
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 18,
      }}>
        {/* ✕ Pass */}
        <button
          onClick={() => triggerSwipe("left")}
          aria-label="Passer"
          style={{
            width: 52, height: 52, borderRadius: "50%",
            background: "rgba(255,77,77,0.15)",
            border: "2px solid rgba(255,77,77,0.8)",
            color: "#FF4D4D", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* 📋 Voir fiche */}
        <button
          onClick={() => router.push(`/annonces/${topCard.id}`)}
          aria-label="Voir la fiche"
          style={{
            height: 44, padding: "0 16px", borderRadius: 22,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.18)",
            color: "rgba(255,255,255,0.8)", cursor: "pointer",
            fontSize: 13, fontWeight: 600,
            display: "flex", alignItems: "center", justifyContent: "center",
            WebkitTapHighlightColor: "transparent",
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
            border: "2px solid rgba(200,169,126,0.9)",
            color: "#C8A97E", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* 💬 WhatsApp */}
        <button
          onClick={openWhatsApp}
          aria-label="Contacter sur WhatsApp"
          style={{
            width: 52, height: 52, borderRadius: "50%",
            background: "rgba(37,211,102,0.15)",
            border: "2px solid rgba(37,211,102,0.8)",
            color: "#25D366", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            WebkitTapHighlightColor: "transparent",
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
