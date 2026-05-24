"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
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
      // keep last 200
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
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const cardOpacity = useTransform(x, [-250, -200, 0, 200, 250], [0, 1, 1, 1, 0]);

  // Overlay opacities
  const likeOpacity = useTransform(x, [20, 120], [0, 1]);
  const nopeOpacity = useTransform(x, [-120, -20], [1, 0]);

  const primaryImg =
    property.property_images?.find((i) => i.is_primary) ??
    property.property_images?.[0];

  const neighborhoodLabel = getNeighborhoodName(property.neighborhood);
  const priceStr = formatPrice(property.price, "GNF", property.price_period);

  // Distance
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

  async function handleDragEnd(_e: unknown, info: { offset: { x: number; y: number }; velocity: { x: number; y: number } }) {
    const { offset, velocity } = info;
    if (offset.y < -80 || velocity.y < -600) {
      await animate(y, -700, { duration: 0.35 });
      onSwipe("up");
    } else if (offset.x > 100 || velocity.x > 500) {
      await animate(x, 600, { duration: 0.35 });
      onSwipe("right");
    } else if (offset.x < -100 || velocity.x < -500) {
      await animate(x, -600, { duration: 0.35 });
      onSwipe("left");
    } else {
      animate(x, 0, { type: "spring", stiffness: 400, damping: 35 });
      animate(y, 0, { type: "spring", stiffness: 400, damping: 35 });
    }
  }

  const scale = isTop ? 1 : 0.96;

  return (
    <motion.div
      style={{
        x,
        y,
        rotate,
        opacity: isTop ? cardOpacity : 1,
        zIndex,
        position: "absolute",
        width: "100%",
        height: "100%",
        scale,
        cursor: isTop ? "grab" : "default",
        touchAction: "none",
      }}
      drag={isTop ? true : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: "grabbing" }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 20,
          overflow: "hidden",
          background: "#161B26",
          boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
          position: "relative",
        }}
      >
        {/* Photo */}
        <Link href={`/annonces/${property.id}`} className="block w-full h-full" style={{ textDecoration: "none" }}>
          {primaryImg ? (
            <Image
              src={primaryImg.url}
              alt={property.title}
              fill
              className="object-cover"
              sizes="(max-width: 480px) 100vw, 420px"
              quality={80}
              priority={isTop}
            />
          ) : (
            <div className="w-full h-full bg-[#1a252b] flex items-center justify-center">
              <span className="text-white/20 text-4xl">🏠</span>
            </div>
          )}
          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(transparent 35%, rgba(0,0,0,0.55) 65%, rgba(0,0,0,0.90) 100%)",
            }}
          />

          {/* LIKE overlay */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ opacity: likeOpacity }}
          >
            <div
              className="text-5xl font-black tracking-wider border-4 rounded-2xl px-6 py-2 rotate-[-15deg]"
              style={{ borderColor: "#C8A97E", color: "#C8A97E", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
            >
              ❤️ INTÉRESSÉ
            </div>
          </motion.div>

          {/* NOPE overlay */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ opacity: nopeOpacity }}
          >
            <div
              className="text-5xl font-black tracking-wider border-4 rounded-2xl px-6 py-2 rotate-[15deg]"
              style={{ borderColor: "#FF4D4D", color: "#FF4D4D", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
            >
              ✕ PASSÉ
            </div>
          </motion.div>

          {/* Top-left: badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
            {property.is_featured && (
              <span style={{ background: "rgba(200,169,126,0.25)", color: "#C8A97E", border: "1px solid rgba(200,169,126,0.50)", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600, backdropFilter: "blur(8px)", display: "inline-block" }}>
                ⭐ Premium
              </span>
            )}
            {property.is_diaspora && (
              <span style={{ background: "rgba(74,158,255,0.25)", color: "#4A9EFF", border: "1px solid rgba(74,158,255,0.50)", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600, backdropFilter: "blur(8px)", display: "inline-block" }}>
                ✈️ Diaspora
              </span>
            )}
          </div>

          {/* Distance */}
          {distStr && (
            <div className="absolute top-4 right-4 pointer-events-none">
              <span style={{ background: "rgba(74,158,255,0.25)", color: "#4A9EFF", border: "1px solid rgba(74,158,255,0.40)", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600, backdropFilter: "blur(8px)" }}>
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
              <span className="text-white/60 text-sm">{property.transaction_type === "rent" ? "Location" : "Vente"}</span>
              {(property.rooms ?? 0) > 0 && (
                <>
                  <span className="text-white/40 text-sm">·</span>
                  <span className="text-white/60 text-sm">🛏 {property.rooms}</span>
                </>
              )}
            </div>
          </div>
        </Link>
      </div>
    </motion.div>
  );
}

// ── Main feed ──────────────────────────────────────────────────────────────────
export function SwipeFeed({ properties }: { properties: Property[] }) {
  const router = useRouter();
  const { user } = useAuth();
  const { toggleFavorite } = useAppStore();

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [cards, setCards] = useState<Property[]>([]);
  const [mounted, setMounted] = useState(false);

  // Get geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => { /* silent */ },
        { timeout: 5000, maximumAge: 300000 }
      );
    }
  }, []);

  // Filter out seen cards + sort by location/featured/new/popular
  useEffect(() => {
    setMounted(true);
    if (properties.length === 0) return; // attendre les données server

    const seen = getSeenIds();
    let list = properties.filter((p) => !seen.includes(p.id));

    // Auto-reset : si plus de 80% des annonces ont été vues (ou toutes),
    // on vide le seen pour éviter un feed vide
    if (list.length === 0 || list.length < Math.max(1, properties.length * 0.2)) {
      try { localStorage.removeItem(SEEN_KEY); } catch { /* silent */ }
      list = [...properties];
    }

    // ── Tri ──────────────────────────────────────────────────────────────────
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
      // featured > nouveau (48h) > boosted > récent
      list = list.sort((a, b) => {
        const aScore =
          (a.is_featured ? 1000 : 0) +
          (Date.now() - new Date(a.created_at ?? 0).getTime() < 48 * 3600 * 1000 ? 500 : 0) +
          (a.is_boosted ? 200 : 0);
        const bScore =
          (b.is_featured ? 1000 : 0) +
          (Date.now() - new Date(b.created_at ?? 0).getTime() < 48 * 3600 * 1000 ? 500 : 0) +
          (b.is_boosted ? 200 : 0);
        return bScore - aScore;
      });
    }

    setCards(list);
  }, [properties, userLocation]);

  const handleSwipe = useCallback(async (direction: "left" | "right" | "up", property: Property) => {
    addSeenId(property.id);
    setCards((prev) => prev.filter((p) => p.id !== property.id));

    if (direction === "right") {
      // Add to favorites
      toggleFavorite(property.id);
      toast("❤️ Ajouté aux favoris", "success");
      if (user && isSupabaseConfigured && supabase) {
        try {
          await supabase.from("favorites").upsert(
            { user_id: user.id, property_id: property.id },
            { onConflict: "user_id,property_id" }
          );
        } catch { /* silent */ }
      }
    } else if (direction === "up") {
      // Open detail page
      router.push(`/annonces/${property.id}`);
    }
  }, [user, toggleFavorite, router]);

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
          <a href="/annonces" className="w-full py-3 rounded-xl font-bold text-sm text-center block"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}>
            Voir toutes les annonces
          </a>
        </div>
      </section>
    );
  }

  // Show top 3 cards (stack)
  const visibleCards = cards.slice(0, 3);

  return (
    <section className="px-4 pb-24">
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
            <p className="text-white/40 text-sm">{cards.length} annonce{cards.length > 1 ? "s" : ""} restante{cards.length > 1 ? "s" : ""}</p>
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
            onClick={async () => {
              const top = cards[0];
              if (!top) return;
              addSeenId(top.id);
              setCards((prev) => prev.slice(1));
            }}
            className="flex items-center justify-center rounded-full active:scale-90"
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
            onClick={async () => {
              const top = cards[0];
              if (!top) return;
              await handleSwipe("right", top);
            }}
            className="flex items-center justify-center rounded-full active:scale-90"
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

          {/* Contacter */}
          <button
            onClick={() => {
              const top = cards[0];
              if (!top || !top.contact_phone) return;
              const msg = encodeURIComponent(`Bonjour, je suis intéressé par "${top.title}" sur LogerBien`);
              window.open(`https://wa.me/${top.contact_phone.replace(/\D/g, "")}?text=${msg}`, "_blank", "noopener");
            }}
            className="flex items-center justify-center rounded-full active:scale-90"
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
          ↑ Swipe vers le haut pour voir les détails
        </p>
      </div>
    </section>
  );
}
