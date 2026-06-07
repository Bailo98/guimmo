"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import TinderCard from "react-tinder-card";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, Banknote, Bed, Heart, Home, Loader2, MapPin, MessageCircle, Phone, Plane, Star, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useAppStore } from "@/lib/store";
import { toast } from "@/lib/toast";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { fetchProperties } from "@/lib/properties";
import { formatPrice } from "@/lib/utils";
import { getNeighborhoodName, NEIGHBORHOOD_COORDINATES } from "@/data/neighborhoods";
import { haversineKm, formatDistance } from "@/lib/haversine";
import { advanceSignal, availabilitySignal, publishedSignal } from "@/lib/property-signals";
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
function clearSeenIds() {
  try { localStorage.removeItem(SEEN_KEY); } catch { /* silent */ }
}

type TinderAPI = {
  swipe: (dir: "left" | "right" | "up" | "down") => Promise<void>;
  restoreCard: () => Promise<void>;
};

export function SwipeFeed({ properties }: { properties: Property[] }) {
  const router             = useRouter();
  const { user }           = useAuth();
  const { toggleFavorite } = useAppStore();

  const [mounted,          setMounted]          = useState(false);
  const [cards,            setCards]            = useState<Property[]>([]);
  const [userLocation,     setUserLocation]     = useState<{ lat: number; lng: number } | null>(null);
  const [reloading,        setReloading]        = useState(false);
  const [everHadCards,     setEverHadCards]     = useState(false);
  const [emptyAfterReload, setEmptyAfterReload] = useState(false);

  // ── Ref-based re-entry guard for the reload flow.
  // Using a ref (not state) so flipping it never re-runs the useEffect, which
  // would cancel the setTimeout via cleanup — the exact bug that kept the
  // spinner stuck forever.
  const reloadInProgress = useRef(false);

  // ── Overlay refs — pure DOM manipulation, ZERO React re-renders during drag ──
  const overlayRightRef = useRef<HTMLDivElement>(null);
  const overlayLeftRef  = useRef<HTMLDivElement>(null);
  const touchStartX     = useRef(0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topCardRef = useRef<TinderAPI>(null as any);

  // ── Mount ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  // ── Geolocation ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { /* silent */ },
      { timeout: 5000, maximumAge: 300_000 }
    );
  }, []);

  // ── Sort helper ────────────────────────────────────────────────────────────
  function sortList(list: Property[], loc: { lat: number; lng: number } | null): Property[] {
    if (loc) {
      return [...list].sort((a, b) => {
        const aLat = a.lat ?? a.latitude ?? NEIGHBORHOOD_COORDINATES[a.neighborhood]?.[0];
        const aLng = a.lng ?? a.longitude ?? NEIGHBORHOOD_COORDINATES[a.neighborhood]?.[1];
        const bLat = b.lat ?? b.latitude ?? NEIGHBORHOOD_COORDINATES[b.neighborhood]?.[0];
        const bLng = b.lng ?? b.longitude ?? NEIGHBORHOOD_COORDINATES[b.neighborhood]?.[1];
        if (!aLat || !bLat) return 0;
        return (
          haversineKm(loc.lat, loc.lng, aLat, aLng) -
          haversineKm(loc.lat, loc.lng, bLat, bLng)
        );
      });
    }
    return [...list].sort((a, b) => {
      const score = (p: Property) =>
        (p.is_featured ? 1000 : 0) +
        (Date.now() - new Date(p.created_at ?? 0).getTime() < 48 * 3_600_000 ? 500 : 0) +
        (p.is_boosted ? 200 : 0);
      return score(b) - score(a);
    });
  }

  // ── Initial load: filter seen + sort ──────────────────────────────────────
  // Runs only on first mount (or when the static prop / location changes).
  // Does NOT interfere with the reload flow because the reload directly calls
  // setCards() and reloadInProgress prevents re-entry.
  useEffect(() => {
    // Skip if a reload is already managing cards
    if (reloadInProgress.current) return;
    if (properties.length === 0) return;

    const seen = getSeenIds();
    let list = properties.filter((p) => !seen.includes(p.id));

    // If < 20 % of properties remain unseen, reset seen history and show all
    if (list.length === 0 || list.length < Math.max(1, properties.length * 0.2)) {
      clearSeenIds();
      list = [...properties];
    }

    const id = window.setTimeout(() => {
      const sorted = sortList(list, userLocation);
      setCards(sorted);
      if (sorted.length > 0) setEverHadCards(true);
    }, 0);

    return () => window.clearTimeout(id);
  }, [properties, userLocation]);

  // ── Auto-reload when all cards are swiped ─────────────────────────────────
  //
  // CRITICAL: `reloading` is intentionally NOT in the dependency array.
  //
  // If `reloading` were a dep, calling setReloading(true) would immediately
  // re-run this effect → the cleanup would fire → clearTimeout(t) would CANCEL
  // the 1.5 s timer before it fires → fetchProperties() is never called →
  // setReloading(false) is never called → spinner stuck forever.
  //
  // We prevent re-entry with `reloadInProgress` (a ref), which can be read
  // inside the effect without being listed as a dependency.
  useEffect(() => {
    if (!mounted || !everHadCards || cards.length > 0 || emptyAfterReload) return;
    if (reloadInProgress.current) return;

    reloadInProgress.current = true;
    setReloading(true);

    const t = setTimeout(() => {
      // Wipe seen history so the fresh batch isn't immediately filtered out
      clearSeenIds();

      console.log("[SwipeFeed] reload — appel fetchProperties...");
      fetchProperties().then((fresh) => {
        console.log("[SwipeFeed] fetchProperties →", fresh.length, "annonce(s) reçue(s)");

        reloadInProgress.current = false;

        if (fresh.length === 0) {
          setEmptyAfterReload(true);
          setReloading(false);
          return;
        }

        // Sort the fresh batch, load it, THEN hide the spinner
        const sorted = sortList(fresh, null); // use score sort; location sort runs via the other effect
        setCards(sorted);
        setEverHadCards(true);
        setReloading(false);
      });
    }, 1500);

    return () => clearTimeout(t);
  }, [mounted, everHadCards, cards.length, emptyAfterReload]);

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
      toast("Ajouté aux favoris", "success");
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

  const requireLoginOrRun = useCallback((action: () => void) => {
    if (!user) {
      router.push("/connexion?redirect=/decouvrir");
      return;
    }
    action();
  }, [router, user]);

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!mounted) return null;

  // ── Reloading spinner ─────────────────────────────────────────────────────
  if (reloading) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 10, background: "var(--bg-primary)",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "0 32px",
      }}>
        <Loader2 style={{ width: 52, height: 52, marginBottom: 16, color: "var(--accent-gold)" }} className="animate-spin" strokeWidth={2.2} />
        <p style={{ color: "var(--accent-gold)", fontWeight: 700, fontSize: 20, textAlign: "center", marginBottom: 8 }}>
          On recommence depuis le début…
        </p>
        <p style={{ color: "var(--text-primary-faint)", fontSize: 13, textAlign: "center" }}>
          Chargement des nouvelles annonces…
        </p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Empty after fresh fetch ────────────────────────────────────────────────
  if (emptyAfterReload) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 10, background: "var(--bg-primary)",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "0 32px",
      }}>
        <Home style={{ width: 52, height: 52, marginBottom: 16, color: "var(--accent-gold)" }} strokeWidth={1.8} />
        <p style={{ color: "var(--accent-gold)", fontWeight: 700, fontSize: 20, textAlign: "center", marginBottom: 8 }}>
          Aucune annonce disponible
        </p>
        <p style={{ color: "var(--text-primary-faint)", fontSize: 13, textAlign: "center", marginBottom: 24 }}>
          Il n&apos;y a pas d&apos;annonces à afficher pour le moment.
        </p>
        <button
          onClick={() => {
            setEmptyAfterReload(false);
            // Reset in-progress guard so the auto-reload effect can fire again
            reloadInProgress.current = false;
          }}
          style={{
            padding: "14px 32px", borderRadius: 14, border: "none",
            background: "var(--accent-gold)", color: "var(--text-primary)",
            fontWeight: 700, fontSize: 15, cursor: "pointer",
            width: "100%", maxWidth: 320, marginBottom: 12,
          }}
        >
          Réessayer
        </button>
        <Link href="/annonces" style={{
          display: "block", textAlign: "center", width: "100%", maxWidth: 320,
          padding: "14px 0", borderRadius: 14,
          background: "var(--bg-card)", border: "1px solid var(--border)",
          color: "var(--text-primary)", fontWeight: 700, fontSize: 15, textDecoration: "none",
        }}>
          Voir toutes les annonces
        </Link>
      </div>
    );
  }

  // ── Brief transition before reload triggers (cards just hit 0) ────────────
  if (cards.length === 0 && everHadCards) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 10, background: "var(--bg-primary)",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "0 32px",
      }}>
        <Loader2 style={{ width: 52, height: 52, marginBottom: 16, color: "var(--accent-gold)" }} className="animate-spin" strokeWidth={2.2} />
        <p style={{ color: "var(--accent-gold)", fontWeight: 700, fontSize: 20, textAlign: "center", marginBottom: 8 }}>
          On recommence depuis le début…
        </p>
        <p style={{ color: "var(--text-primary-faint)", fontSize: 13, textAlign: "center" }}>
          Chargement des nouvelles annonces…
        </p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div style={{
        minHeight: "calc(100svh - 72px)",
        background: "var(--bg-primary)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px",
        textAlign: "center",
      }}>
        <Home style={{ width: 56, height: 56, marginBottom: 16, color: "var(--accent-gold)" }} strokeWidth={1.8} />
        <h1 style={{ color: "var(--text-primary)", fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          Aucune annonce à découvrir
        </h1>
        <p style={{ color: "var(--text-secondary)", maxWidth: 360, marginBottom: 24 }}>
          Les nouvelles annonces apparaîtront ici dès qu’elles seront disponibles.
        </p>
        <Link href="/annonces" style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 48,
          padding: "0 24px",
          borderRadius: 14,
          background: "var(--accent-gold)",
          color: "var(--bg-primary)",
          fontWeight: 800,
          textDecoration: "none",
        }}>
          Voir toutes les annonces
        </Link>
      </div>
    );
  }

  const topCard = cards[0];
  const topImg  = topCard.property_images?.find((i) => i.is_primary) ?? topCard.property_images?.[0];
  const cleanPhone = topCard.contact_phone?.replace(/\D/g, "");
  const whatsappMessage = encodeURIComponent(`Bonjour, je suis intéressé par "${topCard.title}" sur LogerBien`);
  const whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${whatsappMessage}` : `/annonces/${topCard.id}`;
  const phoneUrl = cleanPhone ? `tel:${cleanPhone}` : `/annonces/${topCard.id}`;
  const availability = availabilitySignal(topCard);
  const published = publishedSignal(topCard.created_at);
  const advance = advanceSignal(topCard);

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
          Back (←) · "Découvrir / Conakry, Guinée" · placeholder (right)
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: "fixed",
          top: 72,
          left: 0,
          right: 0,
          zIndex: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
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
            width: 40, height: 40,
            background: "rgba(255,255,255,0.12)",
            border: "none",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            color: "#ffffff",
            flexShrink: 0,
          }}
        >
            <ArrowLeft style={{ width: 20, height: 20 }} strokeWidth={2.6} />
        </button>

        {/* Title + sub-title */}
        <div style={{ textAlign: "center", flex: 1 }}>
          <p style={{ margin: 0, color: "#ffffff", fontSize: 18, fontWeight: 900, lineHeight: 1.2 }}>
            Découvrir
          </p>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.82)", fontSize: 13, lineHeight: 1.35, fontWeight: 700 }}>
            Glisse. Choisis. Contacte.
          </p>
        </div>

        {/* Placeholder — keeps title centred */}
        <div style={{ width: 32, flexShrink: 0 }} />
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
          paddingBottom: "calc(136px + env(safe-area-inset-bottom, 0px))",
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
                background: "linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Home style={{ width: 96, height: 96, opacity: 0.10, color: "#ffffff" }} strokeWidth={1.4} />
              </div>
            )}

            {/* ── Bottom gradient scrim ──────────────────────────────────────── */}
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "linear-gradient(transparent 30%, rgba(0,0,0,0.30) 52%, rgba(0,0,0,0.92) 100%)",
            }} />

            {/* ── Interested overlay (swipe right) ──────────────────────────── */}
            <div
              ref={overlayRightRef}
              style={{ position: "absolute", top: 108, left: 24, pointerEvents: "none", opacity: 0 }}
            >
              <div style={{
                border: "3px solid var(--accent-gold)", borderRadius: 8,
                padding: "8px 16px", color: "#ffffff",
                fontSize: 30, fontWeight: 900, letterSpacing: 1,
                textTransform: "uppercase", transform: "rotate(-15deg)",
                textShadow: "0 2px 8px rgba(0,0,0,0.6)", whiteSpace: "nowrap",
              }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                  <Heart style={{ width: 30, height: 30 }} strokeWidth={2.6} />
                  J&apos;AIME
                </span>
              </div>
            </div>

            {/* ── Passed overlay (swipe left) ────────────────────────────────── */}
            <div
              ref={overlayLeftRef}
              style={{ position: "absolute", top: 108, right: 24, pointerEvents: "none", opacity: 0 }}
            >
              <div style={{
                border: "3px solid #FF4D4D", borderRadius: 8,
                padding: "8px 16px", color: "#ffffff",
                fontSize: 30, fontWeight: 900, letterSpacing: 1,
                textTransform: "uppercase", transform: "rotate(15deg)",
                textShadow: "0 2px 8px rgba(0,0,0,0.6)", whiteSpace: "nowrap",
              }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                  <X style={{ width: 30, height: 30 }} strokeWidth={2.8} />
                  PASSER
                </span>
              </div>
            </div>

            {/* ── Badges — top left (below header) ────────────────────────────── */}
            <div style={{
              position: "absolute", top: 112, left: 14,
              display: "flex", flexDirection: "column", gap: 6,
              pointerEvents: "none",
            }}>
              {topCard.is_featured && (
                <span style={{
                  background: "rgba(212,175,55,0.20)", color: "var(--accent-gold)",
                  border: "1px solid rgba(212,175,55,0.5)", borderRadius: 20,
                  padding: "5px 11px", fontSize: 13, fontWeight: 900,
                  backdropFilter: "blur(8px)",
                }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <Star style={{ width: 13, height: 13 }} strokeWidth={2.4} />
                    Premium
                  </span>
                </span>
              )}
              {topCard.contact_phone && (
                <span style={{
                  background: "rgba(37,211,102,0.22)", color: "#ffffff",
                  border: "1px solid rgba(37,211,102,0.48)", borderRadius: 20,
                  padding: "5px 11px", fontSize: 13, fontWeight: 900,
                  backdropFilter: "blur(8px)",
                }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <Phone style={{ width: 13, height: 13 }} strokeWidth={2.4} />
                    Tél.
                  </span>
                </span>
              )}
              {topCard.is_diaspora && (
                <span style={{
                  background: "rgba(74,158,255,0.25)", color: "#4A9EFF",
                  border: "1px solid rgba(74,158,255,0.5)", borderRadius: 20,
                  padding: "5px 11px", fontSize: 13, fontWeight: 900,
                  backdropFilter: "blur(8px)",
                }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <Plane style={{ width: 13, height: 13 }} strokeWidth={2.4} />
                    Diaspora
                  </span>
                </span>
              )}
            </div>

            {/* ── Distance badge — top right ───────────────────────────────────── */}
            {topDistStr && (
              <div style={{ position: "absolute", top: 112, right: 14, pointerEvents: "none" }}>
                <span style={{
                  background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)",
                  color: "rgba(255,255,255,0.85)", borderRadius: 20,
                   padding: "5px 11px", fontSize: 13, fontWeight: 900,
                }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <MapPin style={{ width: 13, height: 13 }} strokeWidth={2.4} />
                    {topDistStr}
                  </span>
                </span>
              </div>
            )}

            {/* ── Property info — bottom left ──────────────────────────────────── */}
            <div style={{
              position: "absolute",
              bottom: 190,
              left: 18,
              right: 18,
              pointerEvents: "none",
            }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                <span style={{
                  background: "rgba(255,255,255,0.16)",
                  color: "#ffffff",
                  border: "1px solid rgba(255,255,255,0.22)",
                  borderRadius: 999,
                  padding: "5px 10px",
                  fontSize: 13,
                  fontWeight: 800,
                  backdropFilter: "blur(10px)",
                }}>
                  {topCard.transaction_type === "rent" ? "Location" : "Vente"}
                </span>
                {topCard.is_verified && (
                  <span style={{
                    background: "rgba(34,197,94,0.18)",
                    color: "#ffffff",
                    border: "1px solid rgba(34,197,94,0.42)",
                    borderRadius: 999,
                    padding: "5px 10px",
                    fontSize: 13,
                    fontWeight: 800,
                    backdropFilter: "blur(10px)",
                  }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <BadgeCheck style={{ width: 13, height: 13 }} strokeWidth={2.4} />
                      Vérifié
                    </span>
                  </span>
                )}
                <span style={{
                  background: availability.bg,
                  color: "#ffffff",
                  border: `1px solid ${availability.border}`,
                  borderRadius: 999,
                  padding: "5px 10px",
                   fontSize: 13,
                  fontWeight: 800,
                  backdropFilter: "blur(10px)",
                }}>
                  {availability.label}
                </span>
              </div>

              {/* Prix */}
              <p style={{
                margin: 0,
                fontSize: 32,
                fontWeight: 900,
                color: "#ffffff",
                lineHeight: 1.1,
                textShadow: "0 2px 8px rgba(0,0,0,0.5)",
              }}>
                <Banknote style={{ width: 26, height: 26, display: "inline", marginRight: 8, verticalAlign: "-3px" }} strokeWidth={2.4} />
                {formatPrice(topCard.price)}
              </p>
              {topCard.price_period === "month" && (
                <p style={{
                  margin: "2px 0 8px",
                   fontSize: 16,
                  color: "rgba(255,255,255,0.75)",
                  lineHeight: 1,
                }}>
                  /mois
                </p>
              )}

              {/* Titre */}
              <p style={{
                margin: "0 0 5px",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: 18,
                lineHeight: 1.25,
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
                <span style={{ color: "rgba(255,255,255,0.86)", fontSize: 16, fontWeight: 800, whiteSpace: "nowrap" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <MapPin style={{ width: 14, height: 14 }} strokeWidth={2.4} />
                    {getNeighborhoodName(topCard.neighborhood)}
                  </span>
                </span>
                <span style={{ color: "rgba(255,255,255,0.48)", fontSize: 16 }}>·</span>
                <span style={{ color: "rgba(255,255,255,0.86)", fontSize: 16, fontWeight: 800, whiteSpace: "nowrap" }}>
                  {topCard.type === "apartment" ? "Appartement" : topCard.type === "house" ? "Maison" : topCard.type === "villa" ? "Villa" : topCard.type === "studio" ? "Studio" : topCard.type}
                </span>
                {(topCard.rooms ?? 0) > 0 && (
                  <>
                    <span style={{ color: "rgba(255,255,255,0.48)", fontSize: 16 }}>·</span>
                    <span style={{ color: "rgba(255,255,255,0.86)", fontSize: 16, fontWeight: 800, whiteSpace: "nowrap" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Bed style={{ width: 14, height: 14 }} strokeWidth={2.4} />
                        {topCard.rooms}
                      </span>
                    </span>
                  </>
                )}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                {published && (
                   <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: 900 }}>
                    {published.label}
                  </span>
                )}
                   <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: 900 }}>
                    <BadgeCheck style={{ width: 15, height: 15, display: "inline", marginRight: 4, verticalAlign: "-2px" }} strokeWidth={2.5} />
                    {advance}
                  </span>
                </div>
            </div>
          </div>
        </TinderCard>

        <div style={{
          position: "absolute",
          left: 18,
          right: 18,
          bottom: "calc(28px + env(safe-area-inset-bottom, 0px))",
          zIndex: 20,
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 10,
        }}>
          <button
            onClick={() => triggerSwipe("left")}
            aria-label="Passer"
            style={{
              minHeight: 58,
              borderRadius: 22,
              background: "rgba(255,255,255,0.14)",
              border: "1.5px solid rgba(255,255,255,0.25)",
              color: "#ffffff",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontSize: 16,
              fontWeight: 900,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <X style={{ width: 24, height: 24 }} strokeWidth={2.8} />
            Passer
          </button>

          <button
            onClick={() => triggerSwipe("right")}
            aria-label="J'adore"
            style={{
              minHeight: 58,
              borderRadius: 22,
              background: "#C8973A",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontSize: 16,
              fontWeight: 900,
              WebkitTapHighlightColor: "transparent",
              boxShadow: "0 4px 16px rgba(200,151,58,0.50)",
            }}
          >
            <Heart style={{ width: 28, height: 28, fill: "currentColor" }} strokeWidth={2.4} />
            J&apos;aime
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              requireLoginOrRun(() => { window.open(whatsappUrl, "_blank", "noopener"); });
            }}
            aria-label="WhatsApp"
            style={{
              minHeight: 58,
              borderRadius: 22,
              background: "#25D366",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontSize: 16,
              fontWeight: 900,
              WebkitTapHighlightColor: "transparent",
              boxShadow: "0 4px 18px rgba(37,211,102,0.45)",
            }}
          >
            <MessageCircle style={{ width: 24, height: 24 }} strokeWidth={2.4} />
            WhatsApp
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              requireLoginOrRun(() => { window.location.href = phoneUrl; });
            }}
            aria-label="Contacter"
            style={{
              minHeight: 58,
              borderRadius: 22,
              background: "rgba(255,255,255,0.16)",
              border: "1.5px solid rgba(255,255,255,0.25)",
              color: "#ffffff",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontSize: 16,
              fontWeight: 900,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <Phone style={{ width: 22, height: 22 }} strokeWidth={2.4} />
            Appeler
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            PROGRESS DOTS — bottom center
            Active: white pill 16×5px · Inactive: round 5×5 rgba(255,255,255,0.3)
        ══════════════════════════════════════════════════════════════════════ */}
        <div style={{
          position: "absolute",
          bottom: "calc(168px + env(safe-area-inset-bottom, 0px))",
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
