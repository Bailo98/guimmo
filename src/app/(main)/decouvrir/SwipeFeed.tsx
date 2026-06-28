"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, Heart, Home, Loader2, MapPin, MessageCircle, Phone, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useAppStore } from "@/lib/store";
import { toast } from "@/lib/toast";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";
import { getNeighborhoodName, NEIGHBORHOOD_COORDINATES } from "@/data/neighborhoods";
import { haversineKm } from "@/lib/haversine";
import { advanceSignal, availabilitySignal } from "@/lib/property-signals";
import type { Property } from "@/types";

const SEEN_KEY = "lb_swipe_seen";
const SWIPE_THRESHOLD = 105;

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
  } catch {
    /* silent */
  }
}

function clearSeenIds() {
  try {
    localStorage.removeItem(SEEN_KEY);
  } catch {
    /* silent */
  }
}

function propertyTypeLabel(type: Property["type"]) {
  if (type === "apartment") return "Appartement";
  if (type === "house") return "Maison";
  if (type === "villa") return "Villa";
  if (type === "studio") return "Studio";
  if (type === "room") return "Chambre";
  return type;
}

function isValidImageUrl(url?: string | null): url is string {
  if (!url) return false;
  const value = url.trim();
  if (!value || value === "null" || value === "undefined") return false;
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/");
}

function primaryImage(property: Property) {
  const images = (property.property_images ?? []).filter((image) => isValidImageUrl(image.url));
  return images.find((image) => image.is_primary) ?? images[0];
}

export function SwipeFeed({ properties }: { properties: Property[] }) {
  const router = useRouter();
  const { user } = useAuth();
  const { setFavorite, isFavorite, _hasHydrated } = useAppStore();

  const [mounted, setMounted] = useState(false);
  const [cards, setCards] = useState<Property[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [everHadCards, setEverHadCards] = useState(false);
  const [emptyAfterReload, setEmptyAfterReload] = useState(false);
  const [exiting, setExiting] = useState<"left" | "right" | null>(null);

  const dragMovedRef = useRef(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-280, 0, 280], [-18, 0, 18]);
  const likeOpacity = useTransform(x, [18, 120], [0, 1]);
  const passOpacity = useTransform(x, [-120, -18], [1, 0]);
  const nextScale = useTransform(x, [-260, 0, 260], [1, 0.93, 1]);
  const nextY = useTransform(x, [-260, 0, 260], [8, 34, 8]);
  const activeCardId = cards[0]?.id;

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        /* silent */
      },
      { timeout: 5000, maximumAge: 300_000 },
    );
  }, []);

  function sortList(list: Property[], loc: { lat: number; lng: number } | null): Property[] {
    if (loc) {
      return [...list].sort((a, b) => {
        const aLat = a.lat ?? a.latitude ?? NEIGHBORHOOD_COORDINATES[a.neighborhood]?.[0];
        const aLng = a.lng ?? a.longitude ?? NEIGHBORHOOD_COORDINATES[a.neighborhood]?.[1];
        const bLat = b.lat ?? b.latitude ?? NEIGHBORHOOD_COORDINATES[b.neighborhood]?.[0];
        const bLng = b.lng ?? b.longitude ?? NEIGHBORHOOD_COORDINATES[b.neighborhood]?.[1];
        if (!aLat || !bLat) return 0;
        return haversineKm(loc.lat, loc.lng, aLat, aLng) - haversineKm(loc.lat, loc.lng, bLat, bLng);
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

  useEffect(() => {
    if (properties.length === 0) return;

    const seen = getSeenIds();
    let list = properties.filter((p) => !seen.includes(p.id));

    if (list.length === 0 || list.length < Math.max(1, properties.length * 0.2)) {
      clearSeenIds();
      list = [...properties];
    }

    const id = window.setTimeout(() => {
      const sorted = sortList(list, userLocation);
      setCards(sorted);
      if (sorted.length > 0) setEverHadCards(true);
      setEmptyAfterReload(sorted.length === 0);
    }, 0);

    return () => window.clearTimeout(id);
  }, [properties, userLocation]);

  useEffect(() => {
    x.set(0);
    dragMovedRef.current = false;
  }, [activeCardId, x]);

  function restartDeck() {
    clearSeenIds();
    const sorted = sortList(properties, userLocation);
    setCards(sorted);
    setEverHadCards(sorted.length > 0);
    setEmptyAfterReload(sorted.length === 0);
    setExiting(null);
    x.set(0);
    dragMovedRef.current = false;
  }

  const completeSwipe = useCallback(
    async (dir: "left" | "right", property: Property) => {
      addSeenId(property.id);

      if (dir === "right") {
        if (!user) {
          router.push("/connexion?redirect=/decouvrir");
          return;
        }

        setFavorite(property.id, true);
        toast("Ajouté aux favoris", "success");

        if (isSupabaseConfigured && supabase) {
          try {
            const { error } = await supabase
              .from("favorites")
              .upsert(
                { user_id: user.id, property_id: property.id },
                { onConflict: "user_id,property_id", ignoreDuplicates: true },
              );
            if (error) {
              setFavorite(property.id, false);
              console.error("[SwipeFeed] favorites upsert:", error.message, error.code);
            }
          } catch (e) {
            setFavorite(property.id, false);
            console.error("[SwipeFeed] favorites upsert exception:", e);
          }
        }
      }

      setCards((prev) => prev.filter((p) => p.id !== property.id));
      x.set(0);
      setExiting(null);
      dragMovedRef.current = false;
    },
    [router, setFavorite, user, x],
  );

  const animateSwipe = useCallback(
    async (dir: "left" | "right", property: Property) => {
      if (exiting) return;

      if (dir === "right" && !user) {
        router.push("/connexion?redirect=/decouvrir");
        return;
      }

      setExiting(dir);
      const target = dir === "right" ? window.innerWidth * 1.25 : -window.innerWidth * 1.25;
      await animate(x, target, { type: "spring", stiffness: 220, damping: 26 });
      await completeSwipe(dir, property);
    },
    [completeSwipe, exiting, router, user, x],
  );

  const openDetail = useCallback(
    (property: Property) => {
      if (dragMovedRef.current || exiting) return;
      router.push(`/annonces/${property.id}`);
    },
    [exiting, router],
  );

  const handleFavoriteOnly = useCallback(
    async (property: Property) => {
      if (!user) {
        router.push("/connexion?redirect=/decouvrir");
        return;
      }
      const next = !_hasHydrated || !isFavorite(property.id);
      setFavorite(property.id, next);
      toast(next ? "Ajouté aux favoris" : "Retiré des favoris", next ? "success" : "info");

      if (!isSupabaseConfigured || !supabase) return;
      try {
        const { error } = next
          ? await supabase
              .from("favorites")
              .upsert(
                { user_id: user.id, property_id: property.id },
                { onConflict: "user_id,property_id", ignoreDuplicates: true },
              )
          : await supabase
              .from("favorites")
              .delete()
              .eq("user_id", user.id)
              .eq("property_id", property.id);
        if (error) throw error;
      } catch (e) {
        setFavorite(property.id, !next);
        console.error("[SwipeFeed] favorite action:", e);
      }
    },
    [_hasHydrated, isFavorite, router, setFavorite, user],
  );

  const handleWhatsApp = useCallback(
    (property: Property) => {
      if (!user) {
        router.push(`/connexion?redirect=/annonces/${property.id}`);
        return;
      }
      const phone = property.contact_phone?.replace(/\D/g, "");
      if (!phone) return;
      const msg = encodeURIComponent(`Bonjour, je suis intéressé par "${property.title}" sur LogerBien`);
      window.open(`https://wa.me/${phone}?text=${msg}`, "_blank", "noopener");
    },
    [router, user],
  );

  const handleCall = useCallback(
    (property: Property) => {
      if (!user) {
        router.push(`/connexion?redirect=/annonces/${property.id}`);
        return;
      }
      const phone = property.contact_phone?.replace(/\D/g, "");
      if (!phone) return;
      window.location.href = `tel:${phone}`;
    },
    [router, user],
  );

  if (!mounted) {
    return (
      <div className="fixed inset-0 z-10 flex flex-col items-center justify-center bg-[var(--bg-primary)] px-8">
        <Home className="mb-4 h-13 w-13 text-[var(--accent-gold)]" strokeWidth={1.8} />
        <p className="mb-2 text-center text-xl font-bold text-[var(--accent-gold)]">
          Préparation des logements
        </p>
        <p className="text-center text-sm text-[var(--text-primary-faint)]">La découverte arrive tout de suite.</p>
      </div>
    );
  }

  if (cards.length === 0 && everHadCards && emptyAfterReload) {
    return (
      <div className="fixed inset-0 z-10 flex flex-col items-center justify-center bg-[var(--bg-primary)] px-8">
        <Loader2 className="mb-4 h-13 w-13 animate-spin text-[var(--accent-gold)]" strokeWidth={2.2} />
        <p className="mb-2 text-center text-xl font-bold text-[var(--accent-gold)]">
          On recommence depuis le début…
        </p>
        <p className="text-center text-sm text-[var(--text-primary-faint)]">Chargement des nouvelles annonces…</p>
      </div>
    );
  }

  if (emptyAfterReload) {
    return (
      <div className="fixed inset-0 z-10 flex flex-col items-center justify-center bg-[var(--bg-primary)] px-8">
        <Home className="mb-4 h-13 w-13 text-[var(--accent-gold)]" strokeWidth={1.8} />
        <p className="mb-2 text-center text-xl font-bold text-[var(--accent-gold)]">
          Plus de logements pour le moment
        </p>
        <p className="mb-6 text-center text-sm text-[var(--text-primary-faint)]">
          Reviens bientôt ou modifie ta recherche.
        </p>
        <div className="grid w-full max-w-80 gap-3">
          <button
            type="button"
            onClick={restartDeck}
            className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-[var(--accent-gold)] px-6 text-center text-base font-extrabold text-[var(--bg-primary)]"
          >
            Recommencer
          </button>
          <Link
            href="/annonces"
            className="flex min-h-12 w-full items-center justify-center rounded-2xl px-6 text-center text-base font-extrabold no-underline"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          >
            Voir toutes les annonces
          </Link>
        </div>
      </div>
    );
  }

  if (cards.length === 0 && everHadCards && emptyAfterReload) {
    return (
      <div className="fixed inset-0 z-10 flex flex-col items-center justify-center bg-[var(--bg-primary)] px-8">
        <Loader2 className="mb-4 h-13 w-13 animate-spin text-[var(--accent-gold)]" strokeWidth={2.2} />
        <p className="mb-2 text-center text-xl font-bold text-[var(--accent-gold)]">
          On recommence depuis le début…
        </p>
        <p className="text-center text-sm text-[var(--text-primary-faint)]">Chargement des nouvelles annonces…</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex min-h-[calc(100svh-72px)] flex-col items-center justify-center bg-[var(--bg-primary)] p-8 text-center">
        <Home className="mb-4 h-14 w-14 text-[var(--accent-gold)]" strokeWidth={1.8} />
        <h1 className="mb-2 text-3xl font-extrabold text-[var(--text-primary)]">
          {everHadCards ? "Tu as tout vu" : "Plus de logements pour le moment"}
        </h1>
        <p className="mb-6 max-w-90 text-base text-[var(--text-secondary)]">
          Reviens bientôt ou modifie ta recherche.
        </p>
        <div className="grid w-full max-w-80 gap-3">
          <button
            type="button"
            onClick={restartDeck}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[var(--accent-gold)] px-6 font-extrabold text-[var(--bg-primary)]"
          >
            Recommencer
          </button>
          <Link
            href="/annonces"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl px-6 font-extrabold no-underline"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          >
            Voir toutes les annonces
          </Link>
        </div>
      </div>
    );
  }

  const topCard = cards[0];
  const nextCard = cards[1];
  const topImg = primaryImage(topCard);
  const nextImg = nextCard ? primaryImage(nextCard) : null;
  const typeLabel = propertyTypeLabel(topCard.type);
  const nextTypeLabel = nextCard ? propertyTypeLabel(nextCard.type) : "";
  const availability = availabilitySignal(topCard);
  const advance = advanceSignal(topCard);
  const isFav = _hasHydrated && isFavorite(topCard.id);
  const loadedImages = cards.slice(0, 3).map(primaryImage).filter(Boolean);

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: "calc(64px + env(safe-area-inset-top, 0px))",
          left: 0,
          right: 0,
          zIndex: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 8,
          paddingBottom: 8,
          paddingLeft: "max(16px, env(safe-area-inset-left, 0px))",
          paddingRight: "max(16px, env(safe-area-inset-right, 0px))",
          background: "linear-gradient(rgba(0,0,0,0.42) 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      >
        <button
          onClick={() => router.back()}
          aria-label="Retour"
          style={{
            pointerEvents: "auto",
            width: 40,
            height: 40,
            background: "rgba(0,0,0,0.34)",
            border: "1px solid rgba(255,255,255,0.24)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#ffffff",
            flexShrink: 0,
          }}
        >
          <ArrowLeft style={{ width: 20, height: 20 }} strokeWidth={2.6} />
        </button>
        <div
          className="rounded-full px-3 py-2 text-sm font-black text-white"
          style={{
            background: "rgba(0,0,0,0.34)",
            border: "1px solid rgba(255,255,255,0.18)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          {properties.length - cards.length + 1} / {properties.length}
        </div>
      </div>

      <div
        style={{
          position: "fixed",
          inset: 0,
          overflow: "hidden",
          zIndex: 10,
          background: "var(--swipe-bg)",
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "calc(92px + env(safe-area-inset-bottom, 0px))",
          paddingLeft: "env(safe-area-inset-left, 0px)",
          paddingRight: "env(safe-area-inset-right, 0px)",
        }}
      >
        <div aria-hidden="true" className="hidden">
          {loadedImages.map((image, index) => image && (
            <Image key={`${image.url}-${index}`} src={image.url} alt="" width={20} height={20} priority={index < 2} />
          ))}
        </div>
        {nextCard && (
          <motion.div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "max(14px, calc((100vw - 520px) / 2), env(safe-area-inset-left, 0px))",
              right: "max(14px, calc((100vw - 520px) / 2), env(safe-area-inset-right, 0px))",
              top: "calc(78px + env(safe-area-inset-top, 0px))",
              bottom: "calc(96px + env(safe-area-inset-bottom, 0px))",
              borderRadius: "var(--radius-card)",
              overflow: "hidden",
              background: "var(--swipe-card-bg)",
              scale: nextScale,
              y: nextY,
              filter: "brightness(0.78)",
              boxShadow: "0 28px 72px rgba(0,0,0,0.42)",
            }}
          >
            {nextImg ? (
              <Image
                src={nextImg.url}
                alt={nextCard.title}
                fill
                style={{ objectFit: "cover", objectPosition: "center" }}
                sizes="min(92vw, 520px)"
                quality={78}
                draggable={false}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-secondary)]">
                <Home className="h-20 w-20 text-white/20" strokeWidth={1.4} />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/88" />
            <div className="absolute bottom-6 left-5 right-5">
              <p className="m-0 text-3xl font-black leading-none text-white">{formatPrice(nextCard.price)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/20 bg-white/15 px-3 py-2 text-sm font-black text-white backdrop-blur">
                  {nextTypeLabel}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/15 px-3 py-2 text-sm font-black text-white backdrop-blur">
                  <MapPin className="h-3.5 w-3.5" strokeWidth={2.4} />
                  {getNeighborhoodName(nextCard.neighborhood)}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          key={topCard.id}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          onDragStart={() => {
            dragMovedRef.current = false;
          }}
          onDrag={(_, info) => {
            if (Math.abs(info.offset.x) > 8) dragMovedRef.current = true;
          }}
          onDragEnd={(_, info) => {
            const dx = info.offset.x;
            const velocity = info.velocity.x;

            if (dx > SWIPE_THRESHOLD || velocity > 650) {
              void animateSwipe("right", topCard);
            } else if (dx < -SWIPE_THRESHOLD || velocity < -650) {
              void animateSwipe("left", topCard);
            } else {
              void animate(x, 0, { type: "spring", stiffness: 430, damping: 32 });
            }
          }}
          onTap={() => openDetail(topCard)}
          style={{
            position: "absolute",
            left: "max(10px, calc((100vw - 540px) / 2), env(safe-area-inset-left, 0px))",
            right: "max(10px, calc((100vw - 540px) / 2), env(safe-area-inset-right, 0px))",
            top: "calc(72px + env(safe-area-inset-top, 0px))",
            bottom: "calc(92px + env(safe-area-inset-bottom, 0px))",
            x,
            rotate,
            zIndex: 10,
            cursor: "grab",
            touchAction: "pan-y",
          }}
        >
          <div
            className="pressable"
            style={{
              position: "absolute",
              inset: 0,
              overflow: "hidden",
              borderRadius: "var(--radius-card)",
              background: "var(--swipe-card-bg)",
              boxShadow: "0 26px 70px rgba(0,0,0,0.42)",
              userSelect: "none",
              WebkitUserSelect: "none",
            }}
          >
            {topImg ? (
              <Image
                src={topImg.url}
                alt={topCard.title}
                fill
                style={{ objectFit: "cover", objectPosition: "center" }}
                sizes="min(92vw, 520px)"
                quality={88}
                priority
                draggable={false}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)]">
                <Home className="h-24 w-24 text-white/15" strokeWidth={1.4} />
              </div>
            )}

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/92" />

            <div className="absolute right-3 top-16 z-20 flex flex-col gap-2">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  void handleFavoriteOnly(topCard);
                }}
                aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white shadow-lg backdrop-blur-xl transition active:scale-95"
              >
                <Heart className={isFav ? "h-5 w-5 fill-red-500 text-red-500" : "h-5 w-5"} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleCall(topCard);
                }}
                aria-label="Appeler"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white shadow-lg backdrop-blur-xl transition active:scale-95"
              >
                <Phone className="h-5 w-5" strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleWhatsApp(topCard);
                }}
                aria-label="WhatsApp"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-[#25D366]/90 text-white shadow-lg backdrop-blur-xl transition active:scale-95"
              >
                <MessageCircle className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>

            <motion.div
              style={{ opacity: likeOpacity }}
              className="pointer-events-none absolute left-4 top-9 rotate-[-14deg] sm:left-6"
            >
              <div className="flex items-center gap-2 rounded-[28px] border-[4px] border-[#C8973A] bg-black/40 px-5 py-4 text-3xl font-black uppercase tracking-wide text-white shadow-2xl backdrop-blur-md sm:px-7 sm:text-4xl">
                <Heart className="h-9 w-9 fill-current sm:h-11 sm:w-11" strokeWidth={2.6} />
                J&apos;AIME
              </div>
            </motion.div>

            <motion.div
              style={{ opacity: passOpacity }}
              className="pointer-events-none absolute right-4 top-9 rotate-[14deg] sm:right-6"
            >
              <div className="flex items-center gap-2 rounded-[28px] border-[4px] border-[#FF4D4D] bg-black/40 px-5 py-4 text-3xl font-black uppercase tracking-wide text-white shadow-2xl backdrop-blur-md sm:px-7 sm:text-4xl">
                <X className="h-9 w-9 sm:h-11 sm:w-11" strokeWidth={2.8} />
                PASSER
              </div>
            </motion.div>

            <div
              style={{
                position: "absolute",
                bottom: 22,
                left: "max(18px, env(safe-area-inset-left, 0px))",
                right: "max(18px, env(safe-area-inset-right, 0px))",
                pointerEvents: "none",
              }}
            >
              <p className="mb-1 flex items-center gap-1 text-sm font-black text-white/85">
                <BadgeCheck className="h-4 w-4 text-[#25D366]" strokeWidth={2.5} />
                {availability.label}
              </p>
              <p className="m-0 text-[clamp(38px,9vw,58px)] font-black leading-none text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]">
                {formatPrice(topCard.price)}
              </p>
              {topCard.price_period === "month" && (
                <p className="mb-2 mt-2 text-base font-bold leading-none text-white/75">/mois</p>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/20 bg-white/15 px-3 py-2 text-base font-black text-white backdrop-blur-md">
                  {typeLabel}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/15 px-3 py-2 text-base font-black text-white backdrop-blur-md">
                  <MapPin className="h-4 w-4" strokeWidth={2.4} />
                  {getNeighborhoodName(topCard.neighborhood)}
                </span>
                <span className="rounded-full border border-white/20 bg-white/15 px-3 py-2 text-base font-black text-white backdrop-blur-md">
                  {advance}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <div
          style={{
            position: "absolute",
            left: "max(18px, calc((100vw - 520px) / 2 + 18px), env(safe-area-inset-left, 0px))",
            right: "max(18px, calc((100vw - 520px) / 2 + 18px), env(safe-area-inset-right, 0px))",
            bottom: "calc(18px + env(safe-area-inset-bottom, 0px))",
            zIndex: 20,
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          <button
            onClick={() => void animateSwipe("left", topCard)}
            aria-label="Passer"
            className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-full border border-white/25 bg-white/15 text-base font-black text-white outline-none ring-white/30 backdrop-blur-xl transition hover:bg-white/20 active:scale-95 focus-visible:ring-4"
          >
            <X className="h-6 w-6" strokeWidth={2.8} />
            Passer
          </button>

          <button
            onClick={() => void animateSwipe("right", topCard)}
            aria-label="J'aime"
            className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#C8973A] text-base font-black text-white shadow-[0_4px_16px_rgba(200,151,58,0.5)] outline-none ring-[#C8973A]/40 transition hover:bg-[#B8872C] active:scale-95 focus-visible:ring-4"
          >
            <Heart className="h-7 w-7 fill-current" strokeWidth={2.4} />
            J&apos;aime
          </button>
        </div>
      </div>
    </>
  );
}
