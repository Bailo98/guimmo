"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Heart, X, MessageCircle, MapPin } from "lucide-react";
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
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]");
  } catch {
    return [];
  }
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

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SwipeSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="skeleton"
          style={{
            width: "min(420px, calc(100vw - 32px))",
            height: 480,
            borderRadius: 20,
            opacity: 1 - i * 0.2,
          }}
        />
      ))}
    </div>
  );
}

// ── Single swipe card ──────────────────────────────────────────────────────────
function SwipeCard({
  property,
  zIndex,
  isTop,
  onSwipe,
  userLocation,
}: {
  property: Property;
  zIndex: number;
  isTop: boolean;
  onSwipe: (direction: "left" | "right" | "up") => void;
  userLocation: { lat: number; lng: number } | null;
}) {
  const cardRef     = useRef<HTMLDivElement>(null);
  const likeRef     = useRef<HTMLDivElement>(null);
  const nopeRef     = useRef<HTMLDivElement>(null);

  // All drag state in one ref — zero re-renders during drag
  const drag = useRef({ startX: 0, startY: 0, active: false, dx: 0, dy: 0 });

  // ── computed display values ──────────────────────────────────────────────
  const primaryImg =
    property.property_images?.find((i) => i.is_primary) ??
    property.property_images?.[0];

  const neighborhoodLabel = getNeighborhoodName(property.neighborhood);
  const priceStr = formatPrice(property.price, "GNF", property.price_period);

  let distStr: string | null = null;
  if (userLocation) {
    const pLat = property.lat ?? property.latitude;
    const pLng = property.lng ?? property.longitude;
    if (pLat && pLng) {
      distStr = formatDistance(haversineKm(userLocation.lat, userLocation.lng, pLat, pLng));
    } else {
      const coords = NEIGHBORHOOD_COORDINATES[property.neighborhood];
      if (coords) {
        distStr = `~${formatDistance(haversineKm(userLocation.lat, userLocation.lng, coords[0], coords[1]))}`;
      }
    }
  }

  // ── DOM helpers (no re-render) ────────────────────────────────────────────
  const applyTransform = useCallback((dx: number, dy: number) => {
    const el = cardRef.current;
    if (!el) return;
    const rotate = dx / 15;
    el.style.transition = "none";
    el.style.transform   = `translateX(${dx}px) translateY(${dy * 0.2}px) rotate(${rotate}deg)`;

    if (likeRef.current)
      likeRef.current.style.opacity = String(Math.max(0, Math.min(1, (dx - 30) / 90)));
    if (nopeRef.current)
      nopeRef.current.style.opacity = String(Math.max(0, Math.min(1, (-dx - 30) / 90)));
  }, []);

  const springBack = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transition = "transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94)";
    el.style.transform  = "translateX(0) translateY(0) rotate(0deg)";
    if (likeRef.current) likeRef.current.style.opacity = "0";
    if (nopeRef.current) nopeRef.current.style.opacity = "0";
  }, []);

  const flyOut = useCallback((direction: "left" | "right" | "up") => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transition = "transform 0.35s ease-out, opacity 0.35s ease-out";
    el.style.opacity    = "0";
    if (direction === "right") el.style.transform = "translateX(160%) rotate(20deg)";
    else if (direction === "left") el.style.transform = "translateX(-160%) rotate(-20deg)";
    else el.style.transform = "translateY(-120%)";
    setTimeout(() => onSwipe(direction), 350);
  }, [onSwipe]);

  const resolveEnd = useCallback((dx: number, dy: number) => {
    // Short tap (no real movement) → navigate to detail
    if (Math.abs(dx) < 15 && Math.abs(dy) < 15) {
      flyOut("up");
      return;
    }
    // Up swipe (vertical dominant, going up)
    if (dy < -80 && Math.abs(dy) > Math.abs(dx)) {
      flyOut("up");
    } else if (dx > 80) {
      flyOut("right");
    } else if (dx < -80) {
      flyOut("left");
    } else {
      springBack();
    }
  }, [flyOut, springBack]);

  // ── Attach native touch + mouse listeners ─────────────────────────────────
  // NOTE: we use addEventListener (not JSX props) so we can pass passive:false
  // on touchmove, which is required for e.preventDefault() to actually work.
  useEffect(() => {
    if (!isTop) return;
    const el = cardRef.current;
    if (!el) return;

    // Touch
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      drag.current = { startX: t.clientX, startY: t.clientY, active: true, dx: 0, dy: 0 };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!drag.current.active) return;
      e.preventDefault(); // stops the page from scrolling while swiping
      const t = e.touches[0];
      drag.current.dx = t.clientX - drag.current.startX;
      drag.current.dy = t.clientY - drag.current.startY;
      applyTransform(drag.current.dx, drag.current.dy);
    };

    const onTouchEnd = () => {
      if (!drag.current.active) return;
      drag.current.active = false;
      resolveEnd(drag.current.dx, drag.current.dy);
    };

    const onTouchCancel = () => {
      drag.current.active = false;
      springBack();
    };

    // Mouse (desktop)
    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      drag.current = { startX: e.clientX, startY: e.clientY, active: true, dx: 0, dy: 0 };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!drag.current.active) return;
      drag.current.dx = e.clientX - drag.current.startX;
      drag.current.dy = e.clientY - drag.current.startY;
      applyTransform(drag.current.dx, drag.current.dy);
    };

    const onMouseUp = () => {
      if (!drag.current.active) return;
      drag.current.active = false;
      resolveEnd(drag.current.dx, drag.current.dy);
    };

    el.addEventListener("touchstart",  onTouchStart,  { passive: true });
    el.addEventListener("touchmove",   onTouchMove,   { passive: false }); // passive:false → can preventDefault
    el.addEventListener("touchend",    onTouchEnd,    { passive: true });
    el.addEventListener("touchcancel", onTouchCancel, { passive: true });
    el.addEventListener("mousedown",   onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseUp);

    return () => {
      el.removeEventListener("touchstart",  onTouchStart);
      el.removeEventListener("touchmove",   onTouchMove);
      el.removeEventListener("touchend",    onTouchEnd);
      el.removeEventListener("touchcancel", onTouchCancel);
      el.removeEventListener("mousedown",   onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onMouseUp);
    };
  }, [isTop, applyTransform, resolveEnd, springBack]);

  return (
    <div
      ref={cardRef}
      style={{
        position:   "absolute",
        width:      "100%",
        height:     "100%",
        zIndex,
        cursor:     isTop ? "grab" : "default",
        userSelect: "none",
        touchAction: isTop ? "none" : "auto",
        transform:  isTop ? "scale(1)" : "scale(0.96)",
        willChange: isTop ? "transform" : "auto",
      }}
    >
      {/* Card shell */}
      <div
        style={{
          width:        "100%",
          height:       "100%",
          borderRadius: 20,
          overflow:     "hidden",
          background:   "#161B26",
          boxShadow:    "0 16px 48px rgba(0,0,0,0.6)",
          position:     "relative",
        }}
      >
        {/* Photo */}
        {primaryImg ? (
          <Image
            src={primaryImg.url}
            alt={property.title}
            fill
            className="object-cover"
            sizes="(max-width: 480px) 100vw, 420px"
            quality={80}
            priority={isTop}
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-[#1a252b] flex items-center justify-center">
            <span className="text-white/20 text-4xl">🏠</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(transparent 35%, rgba(0,0,0,0.55) 65%, rgba(0,0,0,0.90) 100%)",
          }}
        />

        {/* ❤️ INTÉRESSÉ overlay */}
        <div
          ref={likeRef}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ opacity: 0 }}
        >
          <div
            className="text-5xl font-black tracking-wider border-4 rounded-2xl px-6 py-2"
            style={{
              transform: "rotate(-15deg)",
              borderColor: "#C8A97E",
              color: "#C8A97E",
              textShadow: "0 2px 8px rgba(0,0,0,0.5)",
            }}
          >
            ❤️ INTÉRESSÉ
          </div>
        </div>

        {/* ✕ PASSÉ overlay */}
        <div
          ref={nopeRef}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ opacity: 0 }}
        >
          <div
            className="text-5xl font-black tracking-wider border-4 rounded-2xl px-6 py-2"
            style={{
              transform: "rotate(15deg)",
              borderColor: "#FF4D4D",
              color: "#FF4D4D",
              textShadow: "0 2px 8px rgba(0,0,0,0.5)",
            }}
          >
            ✕ PASSÉ
          </div>
        </div>

        {/* Top badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
          {property.is_featured && (
            <span
              style={{
                background: "rgba(200,169,126,0.25)",
                color: "#C8A97E",
                border: "1px solid rgba(200,169,126,0.50)",
                borderRadius: 20,
                padding: "3px 10px",
                fontSize: 11,
                fontWeight: 600,
                backdropFilter: "blur(8px)",
                display: "inline-block",
              }}
            >
              ⭐ Premium
            </span>
          )}
          {property.is_diaspora && (
            <span
              style={{
                background: "rgba(74,158,255,0.25)",
                color: "#4A9EFF",
                border: "1px solid rgba(74,158,255,0.50)",
                borderRadius: 20,
                padding: "3px 10px",
                fontSize: 11,
                fontWeight: 600,
                backdropFilter: "blur(8px)",
                display: "inline-block",
              }}
            >
              ✈️ Diaspora
            </span>
          )}
        </div>

        {/* Distance badge */}
        {distStr && (
          <div className="absolute top-4 right-4 pointer-events-none">
            <span
              style={{
                background: "rgba(74,158,255,0.25)",
                color: "#4A9EFF",
                border: "1px solid rgba(74,158,255,0.40)",
                borderRadius: 20,
                padding: "3px 10px",
                fontSize: 11,
                fontWeight: 600,
                backdropFilter: "blur(8px)",
              }}
            >
              📍 {distStr}
            </span>
          </div>
        )}

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-5 pointer-events-none">
          <p
            style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: 26,
              fontWeight: 700,
              color: "#C8A97E",
              lineHeight: 1.2,
              marginBottom: 4,
              textShadow: "0 2px 8px rgba(0,0,0,0.6)",
            }}
          >
            {priceStr}
          </p>
          <p className="text-white font-bold text-base leading-snug">
            {property.title}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-white/70 text-sm">
              <MapPin className="w-3.5 h-3.5" />
              {neighborhoodLabel}
            </span>
            <span className="text-white/40 text-sm">·</span>
            <span className="text-white/60 text-sm">
              {property.transaction_type === "rent" ? "Location" : "Vente"}
            </span>
            {(property.rooms ?? 0) > 0 && (
              <>
                <span className="text-white/40 text-sm">·</span>
                <span className="text-white/60 text-sm">🛏 {property.rooms}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main feed ──────────────────────────────────────────────────────────────────
export function SwipeFeed({ properties }: { properties: Property[] }) {
  const router  = useRouter();
  const { user } = useAuth();
  const { toggleFavorite } = useAppStore();

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [cards, setCards]   = useState<Property[]>([]);
  const [mounted, setMounted] = useState(false);

  // Geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => { /* silent */ },
        { timeout: 5000, maximumAge: 300_000 }
      );
    }
  }, []);

  // Filter seen cards + sort
  useEffect(() => {
    setMounted(true);
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
        const aScore =
          (a.is_featured ? 1000 : 0) +
          (Date.now() - new Date(a.created_at ?? 0).getTime() < 48 * 3_600_000 ? 500 : 0) +
          (a.is_boosted ? 200 : 0);
        const bScore =
          (b.is_featured ? 1000 : 0) +
          (Date.now() - new Date(b.created_at ?? 0).getTime() < 48 * 3_600_000 ? 500 : 0) +
          (b.is_boosted ? 200 : 0);
        return bScore - aScore;
      });
    }

    setCards(list);
  }, [properties, userLocation]);

  const handleSwipe = useCallback(
    async (direction: "left" | "right" | "up", property: Property) => {
      addSeenId(property.id);
      setCards((prev) => prev.filter((p) => p.id !== property.id));

      if (direction === "right") {
        toggleFavorite(property.id);
        toast("❤️ Ajouté aux favoris", "success");
        if (user && isSupabaseConfigured && supabase) {
          try {
            await supabase
              .from("favorites")
              .upsert(
                { user_id: user.id, property_id: property.id },
                { onConflict: "user_id,property_id" }
              );
          } catch { /* silent */ }
        }
      } else if (direction === "up") {
        router.push(`/annonces/${property.id}`);
      }
    },
    [user, toggleFavorite, router]
  );

  if (!mounted) {
    return (
      <section className="px-4 pb-10">
        <SwipeSkeleton />
      </section>
    );
  }

  if (cards.length === 0) {
    return (
      <section className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-5xl mb-4">🏠</p>
        <h2 className="text-xl font-bold text-white mb-2">Vous avez tout vu !</h2>
        <p className="text-white/50 text-sm mb-6">
          Revenez plus tard pour de nouvelles annonces, ou explorez toutes les annonces.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              localStorage.removeItem(SEEN_KEY);
              window.location.reload();
            }}
            className="w-full py-3 rounded-xl font-bold text-sm"
            style={{ background: "var(--accent-gold, #C8A97E)", color: "#0A1216" }}
          >
            🔄 Recommencer
          </button>
          <a
            href="/annonces"
            className="w-full py-3 rounded-xl font-bold text-sm text-center block"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#fff",
            }}
          >
            Voir toutes les annonces
          </a>
        </div>
      </section>
    );
  }

  const visibleCards = cards.slice(0, 3);

  return (
    <section
      className="px-4"
      style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="py-5 flex items-center justify-between">
          <div>
            <h2
              className="text-xl font-bold text-white"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              Découvrir
            </h2>
            <p className="text-white/40 text-sm">
              {cards.length} annonce{cards.length > 1 ? "s" : ""} restante{cards.length > 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-1 text-white/30 text-xs">
            <span>← Passer</span>
            <span className="mx-2">·</span>
            <span>❤️ Intéressé →</span>
          </div>
        </div>

        {/* Card stack */}
        <div
          className="relative mx-auto"
          style={{ width: "100%", height: "min(480px, 70vh)" }}
        >
          {[...visibleCards].reverse().map((property, reversedIndex) => {
            const stackIndex = visibleCards.length - 1 - reversedIndex;
            const isTop = stackIndex === 0;
            return (
              <SwipeCard
                key={property.id}
                property={property}
                zIndex={stackIndex + 1}
                isTop={isTop}
                onSwipe={(dir) => handleSwipe(dir, property)}
                userLocation={userLocation}
              />
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-6 mt-8">
          {/* Pass */}
          <button
            onClick={() => {
              const top = cards[0];
              if (!top) return;
              addSeenId(top.id);
              setCards((prev) => prev.slice(1));
            }}
            className="flex items-center justify-center rounded-full active:scale-90 transition-transform"
            style={{
              width: 56, height: 56,
              background: "rgba(255,77,77,0.12)",
              border: "2px solid #FF4D4D",
              color: "#FF4D4D",
            }}
            aria-label="Passer"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Intéressé (like) */}
          <button
            onClick={() => {
              const top = cards[0];
              if (!top) return;
              handleSwipe("right", top);
            }}
            className="flex items-center justify-center rounded-full active:scale-90 transition-transform"
            style={{
              width: 64, height: 64,
              background: "rgba(200,169,126,0.20)",
              border: "2px solid var(--accent-gold, #C8A97E)",
              color: "var(--accent-gold, #C8A97E)",
            }}
            aria-label="Intéressé"
          >
            <Heart className="w-7 h-7" />
          </button>

          {/* WhatsApp */}
          <button
            onClick={() => {
              const top = cards[0];
              if (!top?.contact_phone) return;
              const msg = encodeURIComponent(
                `Bonjour, je suis intéressé par "${top.title}" sur LogerBien`
              );
              window.open(
                `https://wa.me/${top.contact_phone.replace(/\D/g, "")}?text=${msg}`,
                "_blank",
                "noopener"
              );
            }}
            className="flex items-center justify-center rounded-full active:scale-90 transition-transform"
            style={{
              width: 56, height: 56,
              background: "rgba(37,211,102,0.12)",
              border: "2px solid #25D366",
              color: "#25D366",
            }}
            aria-label="Contacter sur WhatsApp"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
        </div>

        <p className="text-center text-white/25 text-xs mt-4">
          ↑ Swipe vers le haut ou appui court pour voir les détails
        </p>
      </div>
    </section>
  );
}
