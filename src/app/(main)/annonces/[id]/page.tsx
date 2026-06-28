import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { AlertTriangle, ArrowLeft, Armchair, BadgeCheck, Battery, Bed, Bath, BrickWall, Calendar, Car, CheckCircle, CircleCheck, Droplets, Edit3, Eye, Home, KeyRound, Lock, MapPin, MessageCircle, Phone, Shield, ShieldCheck, Snowflake, Sofa, Square, Sun, Wifi, XCircle, Zap } from "lucide-react";
import { ListingScore } from "@/components/ListingScore";
import { Avatar } from "@/components/ui/Avatar";
import { PhotoGallery } from "./PhotoGallery";
import { VideoCard } from "./VideoCard";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { MessageButton } from "@/components/property/MessageButton";
import { ReportButton } from "@/components/property/ReportButton";
import { DetailFavoriteButton } from "@/components/property/DetailFavoriteButton";
import { PropertyShareButton } from "@/components/property/PropertyShareButton";
import type { VTRoom } from "@/components/VirtualTour";
import VirtualTourWrapper from "@/components/VirtualTourWrapper";
import { getNeighborhoodName } from "@/data/neighborhoods";
import type { Metadata } from "next";
import { formatPrice } from "@/lib/utils";
import { advanceSignal, availabilitySignal, getAvailabilityStatus, isPubliclyAvailable, publishedSignal } from "@/lib/property-signals";
import type { Property } from "@/types";
import PropertyMapWrapper from "@/components/property/PropertyMapWrapper";
import { PropertyViewTracker } from "@/components/property/PropertyViewTracker";

interface Props {
  params: Promise<{ id: string }>;
}

const TYPE_LABELS: Record<string, string> = {
  apartment: "Appartement", house: "Maison", studio: "Studio",
  villa: "Villa", room: "Chambre", office: "Bureau", shop: "Boutique", land: "Terrain",
};

const WATER_INFO: Record<string, { Icon: typeof Droplets; label: string }> = {
  robinet: { Icon: Droplets, label: "Robinet" },
  forage:  { Icon: Droplets, label: "Forage" },
  citerne: { Icon: Droplets, label: "Citerne" },
  none:    { Icon: XCircle, label: "Pas d'eau" },
};
const ELEC_INFO: Record<string, { Icon: typeof Zap; label: string }> = {
  edg:     { Icon: Zap, label: "Courant EDG" },
  solaire: { Icon: Sun, label: "Panneau solaire" },
  groupe:  { Icon: Battery, label: "Groupe électro." },
  none:    { Icon: XCircle, label: "Pas d'électricité" },
};
const INET_INFO: Record<string, { Icon: typeof Wifi; label: string }> = {
  wifi: { Icon: Wifi, label: "WiFi / Fibre" },
  none: { Icon: XCircle, label: "Pas d'internet" },
};

function isValidImageUrl(url?: string | null): url is string {
  if (!url) return false;
  const value = url.trim();
  if (!value || value === "null" || value === "undefined") return false;
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/");
}

export const revalidate = 60;

async function getDB() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const db = await getDB();
  const { data } = await db
    .from("properties")
    .select("title, description, neighborhood, price, price_period, type, rooms, property_images(url)")
    .eq("id", id)
    .single();
  if (!data) return { title: "Annonce introuvable | LogerBien" };

  type Row = {
    title: string;
    description?: string | null;
    neighborhood?: string;
    price?: number;
    price_period?: string | null;
    type?: string;
    rooms?: number | null;
    property_images?: { url: string }[];
  };
  const row = data as Row;

  const neighborhoodLabel = getNeighborhoodName(row.neighborhood ?? "");
  const priceFormatted = formatPrice(row.price ?? 0, "GNF", row.price_period);
  const typeLabel =
    ({ apartment: "Appartement", house: "Maison", studio: "Studio", villa: "Villa",
       room: "Chambre", office: "Bureau", shop: "Boutique", land: "Terrain" } as Record<string, string>)[
      row.type ?? ""
    ] ?? row.type ?? "Bien";

  const metaTitle = `${row.title} — ${priceFormatted} | LogerBien`;
  const metaDescription =
    row.description
      ? row.description.slice(0, 155) + (row.description.length > 155 ? "…" : "")
      : `${typeLabel}${row.rooms ? ` ${row.rooms} chambre${(row.rooms ?? 0) > 1 ? "s" : ""}` : ""} à ${neighborhoodLabel} — ${priceFormatted} sur LogerBien.`;
  const ogDescription = `${typeLabel} à ${neighborhoodLabel}, Conakry`;
  const image = (row.property_images ?? []).find((img) => isValidImageUrl(img.url))?.url;

  return {
    title: metaTitle,
    description: metaDescription,
    openGraph: {
      title: row.title,
      description: ogDescription,
      images: image ? [{ url: image, width: 1200, height: 630 }] : [],
      url: `https://logerbien.gn/annonces/${id}`,
      siteName: "LogerBien",
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
      images: image ? [image] : [],
    },
  };
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
  const db = await getDB();

  const { data: row, error } = await db
    .from("properties")
    .select("*, property_images(*)")
    .eq("id", id)
    .single();

  // ── Current user + admin check ─────────────────────────────────────────────
  let currentUserId: string | null = null;
  let isAdmin = false;
  let initialIsFav = false;
  try {
    const supabaseSsr = await createSupabaseServerClient();
    const { data: { user: currentUser } } = await supabaseSsr.auth.getUser();
    currentUserId = currentUser?.id ?? null;
    if (currentUserId) {
      const [profileRes, favRes] = await Promise.all([
        supabaseSsr.from("profiles").select("role").eq("id", currentUserId).maybeSingle(),
        supabaseSsr.from("favorites").select("id")
          .eq("user_id", currentUserId).eq("property_id", id).maybeSingle(),
      ]);
      isAdmin = (profileRes.data as { role?: string } | null)?.role === "admin";
      initialIsFav = !!favRes.data;
    }
  } catch {
    // cookies unavailable (e.g. static rendering fallback) — treat as anonymous
  }

  // ── Admin fallback: si la RLS anon cache la row, retry avec service role ──
  let finalRow = row;
  if ((error || !row) && isAdmin && supabaseAdmin) {
    const { data: adminRow } = await supabaseAdmin
      .from("properties")
      .select("*, property_images(*)")
      .eq("id", id)
      .single();
    finalRow = adminRow;
  }

  if (!finalRow) notFound();

  // ── Les non-admins ne peuvent pas voir les annonces suspendues/inactives ───
  const rowStatus = (finalRow as { status?: string }).status ?? "active";
  const isSuspended = rowStatus === "suspended" || rowStatus === "inactive";
  if (isSuspended && !isAdmin) notFound();

  let profileData: Record<string, unknown> | null = null;
  let ownerListingsCount: number | null = null;
  if (finalRow.owner_id) {
    const { data } = await db
      .from("profiles")
      .select("id, full_name, role, is_verified, created_at, avatar_url")
      .eq("id", finalRow.owner_id)
      .maybeSingle();
    profileData = data;
    const { count } = await db
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", finalRow.owner_id)
      .eq("status", "active");
    ownerListingsCount = count;
  }

  const property = finalRow as Property;
  const safePropertyImages = (property.property_images ?? []).filter((image) => isValidImageUrl(image.url));
  const posterImage = safePropertyImages.find((image) => image.is_primary) ?? safePropertyImages[0];
  const videoUrl = property.video_url ?? null;
  const shortRef = property.ref ?? null;
  const isOwner   = !!currentUserId && currentUserId === property.owner_id;
  const isLoggedIn = !!currentUserId;
  const availabilityStatus = getAvailabilityStatus(property);
  const isHiddenAvailability = availabilityStatus === "rented" || availabilityStatus === "paused";
  if (isHiddenAvailability && !isAdmin && !isOwner) notFound();
  const availabilityInfo = availabilitySignal(property);
  const publishedInfo = publishedSignal(property.created_at);
  const advanceInfo = advanceSignal(property);

  void db.rpc("increment_views", { property_id: id }).then(() => {});

  const { data: similarRows } = await db
    .from("properties")
    .select("*, property_images(*)")
    .eq("neighborhood", finalRow.neighborhood)
    .eq("type", finalRow.type)
    .eq("status", "active")
    .neq("id", id)
    .gte("price", Math.round(finalRow.price * 0.5))
    .lte("price", Math.round(finalRow.price * 1.5))
    .not("title", "is", null)
    .limit(6);
  let similar = ((similarRows ?? []) as Property[]).filter(isPubliclyAvailable);
  if (similar.length < 4) {
    const { data: fallbackRows } = await db
      .from("properties")
      .select("*, property_images(*)")
      .eq("neighborhood", finalRow.neighborhood)
      .eq("status", "active")
      .neq("id", id)
      .not("title", "is", null)
      .limit(6);
    const seen = new Set(similar.map((p) => p.id));
    similar = [
      ...similar,
      ...((fallbackRows ?? []) as Property[]).filter((p) => !seen.has(p.id) && isPubliclyAvailable(p)),
    ].slice(0, 6);
  }

  // Virtual tour images (table added via migration; handle missing gracefully)
  let vtRooms: VTRoom[] = [];
  if (row.has_virtual_tour) {
    try {
      const { data: vtData } = await db
        .from("virtual_tour_images")
        .select("id, url, room_name, sort_order")
        .eq("property_id", id)
        .order("sort_order");
      vtRooms = (vtData ?? []) as VTRoom[];
    } catch {
      // table not yet migrated — silently skip
    }
  }

  const neighborhoodLabel = getNeighborhoodName(property.neighborhood);
  const phone = property.contact_phone ?? "+224 620 00 00 00";
  const whatsappPhone = phone.replace(/\D/g, "");
  const contactMsg = encodeURIComponent(
    `Bonjour, je suis intéressé par votre annonce "${property.title}" sur LogerBien`
  );
  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${contactMsg}`;
  const phoneUrl    = `tel:${phone}`;
  const formattedPrice = formatPrice(property.price, "GNF", property.price_period);
  const [priceMain, pricePeriodRaw] = formattedPrice.split("/");
  const pricePeriod = pricePeriodRaw ? `/${pricePeriodRaw}` : "";

  // ── Derived essentials ──────────────────────────────────────────────────────
  const waterKey = (property.water_source ?? "robinet") as string;
  const elecKey  = (property.electricity ?? "edg") as string;
  const inetKey  = (property.internet ?? "none") as string;

  const waterAvail = waterKey !== "none";
  const elecAvail  = elecKey !== "none";
  const inetAvail  = inetKey !== "none";
  const WaterIcon = WATER_INFO[waterKey]?.Icon ?? Droplets;
  const ElecIcon = ELEC_INFO[elecKey]?.Icon ?? Zap;
  const InetIcon = INET_INFO[inetKey]?.Icon ?? Wifi;

  const CARD_NONE  = { background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.20)" };
  const compactEquipment: { Icon: typeof Bed; label: string; tone?: "muted" | "warn" }[] = [
    ...(property.rooms ? [{ Icon: Bed, label: `${property.rooms} ch.` }] : []),
    ...(property.bathrooms ? [{ Icon: Bath, label: `${property.bathrooms} douche${property.bathrooms > 1 ? "s" : ""}` }] : []),
    ...(property.surface ? [{ Icon: Square, label: `${property.surface} m²` }] : []),
    { Icon: WaterIcon, label: WATER_INFO[waterKey]?.label ?? waterKey, tone: waterAvail ? "muted" as const : "warn" as const },
    { Icon: ElecIcon, label: ELEC_INFO[elecKey]?.label ?? elecKey, tone: elecAvail ? "muted" as const : "warn" as const },
    { Icon: InetIcon, label: INET_INFO[inetKey]?.label ?? inetKey, tone: inetAvail ? "muted" as const : "warn" as const },
    { Icon: property.furnished ? Sofa : Armchair, label: property.furnished ? "Meublé" : "Non meublé" },
    ...(property.has_parking ? [{ Icon: Car, label: "Parking" }] : []),
    ...(property.has_ac ? [{ Icon: Snowflake, label: "Clim" }] : []),
    ...(property.has_security ? [{ Icon: Shield, label: "Gardien" }] : []),
    ...(property.has_fence ? [{ Icon: BrickWall, label: "Clôture" }] : []),
  ];

  return (
    <div className="bg-[var(--bg-primary)] pb-32 md:pb-12">
      {/* Silent view tracker (client component) */}
      <PropertyViewTracker propertyId={property.id} />

      {/* Premium gallery */}
      <div className="relative mx-auto w-full max-w-none pt-0 md:w-[95vw] md:max-w-[1600px] md:pt-6">
        <PhotoGallery
          images={safePropertyImages.map((i) => ({ url: i.url, alt: property.title }))}
          title={property.title}
        />
        <div
          className="pointer-events-none absolute left-0 right-0 top-0 z-30 flex items-center justify-between gap-3 px-4 pt-4 md:pt-10"
          style={{
            paddingLeft: "max(16px, env(safe-area-inset-left, 0px))",
            paddingRight: "max(16px, env(safe-area-inset-right, 0px))",
          }}
        >
          <Link
            href="/annonces"
            className="pointer-events-auto flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white/90 text-[#17120a] shadow-[0_14px_34px_rgba(0,0,0,0.22)] ring-1 ring-white/45 backdrop-blur-md transition-colors hover:bg-white"
            aria-label="Retour aux annonces"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.8} />
          </Link>
          <div className="pointer-events-auto flex items-center gap-2">
            <DetailFavoriteButton propertyId={id} initialIsFav={initialIsFav} variant="glass" />
            <PropertyShareButton
              title={property.title}
              neighborhood={neighborhoodLabel}
              price={formattedPrice}
              rooms={property.rooms}
              bathrooms={property.bathrooms}
              surface={property.surface}
              shortRef={shortRef ?? undefined}
              propertyId={property.id}
              isLoggedIn={isLoggedIn}
              variant="glass"
            />
          </div>
        </div>
      </div>

      {/* Content card */}
      <div className="relative z-10 mt-0 rounded-t-[28px]" style={{ background: "var(--bg-primary)" }}>
        <div className="mx-auto w-[95vw] max-w-[1600px] pt-4 md:pt-6">

          {/* Déjà loué banner */}
          {isHiddenAvailability && (
            <div className="mb-4 rounded-2xl px-4 py-3 flex items-center justify-between gap-3" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400 font-semibold text-sm">
                  {availabilityStatus === "paused" ? "Ce logement est indisponible." : "Ce logement est déjà loué."}
                </p>
              </div>
              <Link href={`/annonces?neighborhood=${property.neighborhood}&type=${property.type}`}
                className="text-red-500 font-bold text-sm whitespace-nowrap hover:underline">
                Voir similaires →
              </Link>
            </div>
          )}

          {/* ── Admin uniquement : bandeau annonce suspendue / inactive ── */}
          {isSuspended && isAdmin && (
            <div className="mb-4 rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: "rgba(239,68,68,0.12)", border: "2px solid rgba(239,68,68,0.50)" }}>
              <AlertTriangle className="h-6 w-6 flex-shrink-0 text-red-400" strokeWidth={2.4} />
              <div className="flex-1 min-w-0">
                <p className="text-red-400 font-black text-sm">
                  Cette annonce est {rowStatus === "suspended" ? "suspendue" : "inactive"} — visible uniquement par les admins
                </p>
                <p className="text-red-400/60 text-xs mt-0.5">
                  Statut actuel : <span className="font-bold uppercase tracking-wide">{rowStatus}</span>
                </p>
              </div>
              <a href="/admin/annonces" className="flex-shrink-0 text-red-400 hover:text-red-300 font-bold text-xs underline whitespace-nowrap">
                Panel admin →
              </a>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

            {/* ── Main column ── */}
            <div className="space-y-4 lg:col-span-8 lg:space-y-3">

              {/* Status + type badges */}
              <div className="flex items-center gap-2 flex-wrap">
                {property.available_now ? (
                  <span className="inline-flex items-center gap-1.5 font-bold text-sm px-3 py-1.5 rounded-full" style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.30)", color: "var(--accent-gold)" }}>
                    <CheckCircle className="w-4 h-4" /> Disponible
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-red-500/20 text-red-400 font-bold text-sm px-3 py-1.5 rounded-full">
                    <XCircle className="w-4 h-4" /> Déjà loué
                  </span>
                )}
                <span className="text-xs font-semibold px-2.5 py-1.5 rounded-full" style={{
                  background: ({
                    house: "rgba(200,151,58,0.85)", villa: "rgba(200,151,58,0.85)",
                    apartment: "rgba(74,158,255,0.85)", studio: "rgba(74,158,255,0.85)",
                    land: "rgba(76,175,80,0.85)",
                    office: "rgba(156,107,255,0.85)", shop: "rgba(156,107,255,0.85)",
                    room: "rgba(255,107,53,0.85)",
                  } as Record<string,string>)[property.type] ?? "rgba(255,255,255,0.12)",
                  color: "var(--text-primary)",
                  fontWeight: 700,
                }}>
                  {TYPE_LABELS[property.type] ?? property.type}
                </span>
                <span className="text-xs font-semibold bg-blue-500/20 text-blue-400 px-2.5 py-1.5 rounded-full">
                  {property.transaction_type === "rent" ? "Location" : "Vente"}
                </span>
              </div>

              {/* Price + title + location */}
              <div>
                <div className="leading-none" aria-label={formattedPrice}>
                  <div
                    className="text-[46px] font-black leading-none md:text-[76px]"
                    style={{
                      color: "var(--accent-gold)",
                      fontSize: "clamp(46px, 7vw, 76px)",
                      fontWeight: 900,
                      lineHeight: 0.9,
                    }}
                  >
                    {priceMain.trim()}
                  </div>
                  {pricePeriod && (
                    <div
                      className="mt-1 text-lg font-black leading-none opacity-80 md:text-2xl"
                      style={{ color: "var(--accent-gold)" }}
                    >
                      {pricePeriod}
                    </div>
                  )}
                </div>
                <h1 className="mt-3 text-2xl font-black leading-tight md:text-4xl" style={{ color: "var(--text-primary)" }}>
                  {property.title}
                </h1>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <div className="flex items-center gap-1.5 text-sm">
                    <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                    <span style={{ color: "var(--text-secondary)" }}>{neighborhoodLabel}, {property.city}</span>
                  </div>
                  {(property.views ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                      <Eye className="h-3.5 w-3.5" strokeWidth={2.4} />
                      {property.views} vue{(property.views ?? 0) > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-black" style={{ background: availabilityInfo.bg, border: `1px solid ${availabilityInfo.border}`, color: availabilityInfo.color }}>
                    <CircleCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
                    {availabilityInfo.label}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-black" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                    <Calendar className="h-3.5 w-3.5" strokeWidth={2.5} />
                    {publishedInfo?.label ?? "Date non renseignée"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-black" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                    <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
                    {advanceInfo}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { Icon: Home, label: "Type", value: TYPE_LABELS[property.type] ?? property.type },
                  { Icon: Bed, label: "Chambres", value: property.rooms ? `${property.rooms}` : "N/A" },
                  { Icon: Bath, label: "Douche", value: property.bathrooms ? `${property.bathrooms}` : "N/A" },
                  { Icon: Square, label: "Surface", value: property.surface ? `${property.surface} m²` : "N/A" },
                ].map(({ Icon, label, value }) => (
                  <div
                    key={label}
                    className="rounded-2xl p-3"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                  >
                    <Icon className="mb-2 h-5 w-5 text-[var(--accent-gold)]" strokeWidth={2.4} />
                    <p className="text-[11px] font-black uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{label}</p>
                    <p className="mt-0.5 text-base font-black" style={{ color: "var(--text-primary)" }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Mobile contact card — integrated in content, never fixed over BottomNav */}
              <div
                className="lg:hidden rounded-2xl p-4 space-y-3 shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <h2 className="flex items-center gap-2 text-base font-black" style={{ color: "var(--text-primary)" }}>
                  <MessageCircle className="h-4 w-4 text-[var(--accent-gold)]" strokeWidth={2.5} />
                  Contacter
                </h2>
                {isOwner ? (
                  <Link
                    href={`/compte/annonces/${property.id}/modifier`}
                    className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold"
                    style={{ background: "var(--accent-gold)", color: "var(--bg-primary)" }}
                  >
                    <Edit3 className="h-4 w-4" strokeWidth={2.4} />
                    Gérer cette annonce
                  </Link>
                ) : !isLoggedIn ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/connexion?redirect=/annonces/${property.id}`}
                      className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl text-sm font-bold"
                      style={{ background: "var(--accent-gold)", color: "var(--bg-primary)" }}
                    >
                      <KeyRound className="h-4 w-4" strokeWidth={2.4} />
                      Connexion
                    </Link>
                    <Link
                      href={`/inscription?redirect=/annonces/${property.id}`}
                      className="flex min-h-[52px] items-center justify-center rounded-xl text-sm font-semibold"
                      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                    >
                      S&apos;inscrire
                    </Link>
                  </div>
                ) : (
                  <>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] text-sm font-bold text-white shadow-[0_4px_20px_rgba(37,211,102,0.35)] transition-all hover:bg-[#1ebe5d] active:scale-[0.99]"
                    >
                      <MessageCircle className="h-5 w-5" strokeWidth={2.6} />
                      WhatsApp
                    </a>
                    <a
                      href={phoneUrl}
                      className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold"
                      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                    >
                      <Phone className="h-4 w-4" />
                      Appeler
                    </a>
                    <MessageButton
                      propertyId={property.id}
                      ownerId={property.owner_id}
                      propertyTitle={property.title}
                      className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-secondary)] disabled:opacity-60"
                    />
                  </>
                )}
              </div>

              {profileData && (
                <div
                  className="lg:hidden rounded-2xl p-4 space-y-3"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                >
                  <h2 className="text-sm font-black" style={{ color: "var(--text-primary)" }}>Propriétaire</h2>
                  <div className="flex items-center gap-3">
                    <Avatar
                      url={(profileData as { avatar_url?: string | null }).avatar_url}
                      name={(profileData as { full_name?: string | null }).full_name ?? undefined}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-black leading-tight" style={{ color: "var(--text-primary)" }}>
                        {(profileData as { full_name?: string | null }).full_name ?? "Propriétaire"}
                      </p>
                      <p className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
                        Propriétaire LogerBien
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {property.contact_phone && (
                      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-black" style={{ background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.24)", color: "#15803d" }}>
                        <Phone className="h-3.5 w-3.5" strokeWidth={2.5} />
                        Téléphone vérifié
                      </span>
                    )}
                    {(profileData as { is_verified?: boolean } | null)?.is_verified && (
                      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-black" style={{ background: "rgba(185,138,46,0.14)", border: "1px solid rgba(185,138,46,0.28)", color: "var(--accent-gold)" }}>
                        <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
                        Compte vérifié
                      </span>
                    )}
                    {ownerListingsCount !== null && (
                      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-black" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                        <Home className="h-3.5 w-3.5" strokeWidth={2.5} />
                        {ownerListingsCount} annonce{ownerListingsCount > 1 ? "s" : ""}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-black" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                      <MapPin className="h-3.5 w-3.5" strokeWidth={2.5} />
                      {neighborhoodLabel}
                    </span>
                  </div>
                  {isLoggedIn && !isOwner && (
                    <ReportButton
                      propertyId={property.id}
                      propertyTitle={property.title}
                      ownerId={property.owner_id}
                      ownerName={(profileData as { full_name?: string | null } | null)?.full_name ?? null}
                      target="owner"
                      isLoggedIn={isLoggedIn}
                    />
                  )}
                </div>
              )}

              {/* Score de confiance */}
              <ListingScore
                images={(property.property_images ?? []).length}
                description={property.description}
                phone={property.contact_phone}
                surface={property.surface}
                rooms={property.rooms}
              />

              <div className="rounded-2xl p-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <h2 className="font-bold text-sm mb-2" style={{ color: "var(--text-primary)" }}>Équipements</h2>
                <div className="flex flex-wrap gap-2">
                  {compactEquipment.map(({ Icon, label, tone }) => (
                    <span
                      key={label}
                      className="inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-xs font-black sm:text-sm"
                      style={{
                        background: tone === "warn" ? CARD_NONE.background : "var(--bg-secondary)",
                        border: tone === "warn" ? CARD_NONE.border : "1px solid var(--border)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <Icon className="h-3.5 w-3.5 flex-shrink-0 text-[var(--accent-gold)]" strokeWidth={2.4} />
                      <span className="truncate">{label}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Description */}
              {(property.description || (property.features?.length ?? 0) > 0) && (
                <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                  {property.description && (
                    <>
                      <h2 className="font-bold mb-3" style={{ color: "var(--text-primary)" }}>Description</h2>
                      <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>
                        {property.description}
                      </p>
                    </>
                  )}
                  {(property.features?.length ?? 0) > 0 && (
                    <div className={property.description ? "mt-4 pt-4 border-t" : ""} style={property.description ? { borderColor: "var(--border)" } : undefined}>
                      <h3 className="font-semibold text-sm mb-3" style={{ color: "var(--text-primary)" }}>Équipements</h3>
                      <div className="flex flex-wrap gap-2">
                        {(property.features ?? []).map((f: string) => (
                          <span key={f} className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {videoUrl && (
                <VideoCard videoUrl={videoUrl} poster={posterImage?.url} />
              )}

              {/* ── Carte de localisation ── */}
              <div>
                <h2 className="inline-flex items-center gap-2 font-bold text-sm mb-3" style={{ color: "var(--text-primary)" }}>
                  <MapPin className="h-4 w-4" strokeWidth={2.4} />
                  Localisation
                </h2>
                <PropertyMapWrapper
                  neighborhood={property.neighborhood}
                  lat={property.lat ?? property.latitude}
                  lng={property.lng ?? property.longitude}
                  title={property.title}
                />
                {/* Accuracy label is rendered inside PropertyMapWrapper/PropertyMap */}
              </div>

              {/* Virtual tour */}
              {vtRooms.length > 0 && <VirtualTourWrapper rooms={vtRooms} />}

              {/* Report — discreet at bottom */}
              <div className="flex justify-center pb-4">
                <ReportButton propertyId={property.id} propertyTitle={property.title} isLoggedIn={isLoggedIn} />
              </div>

            </div>

            {/* ── Sidebar (desktop) ── */}
            <div className="hidden lg:col-span-4 lg:block">
              <div className="sticky top-20 rounded-2xl p-4 space-y-2.5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                {profileData && (
                  <div className="flex items-center gap-3 pb-2.5 border-b" style={{ borderColor: "var(--border)" }}>
                    <Avatar
                      url={(profileData as { avatar_url?: string | null }).avatar_url}
                      name={(profileData as { full_name?: string | null }).full_name ?? undefined}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-base leading-tight truncate" style={{ color: "var(--text-primary)" }}>
                        {(profileData as { full_name?: string | null }).full_name ?? "Propriétaire"}
                      </p>
                      <p className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>Propriétaire LogerBien</p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-1.5 pb-2.5 border-b" style={{ borderColor: "var(--border)" }}>
                  {property.contact_phone && (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-black" style={{ background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.24)", color: "#15803d" }}>
                      <Phone className="h-3.5 w-3.5" strokeWidth={2.5} />
                      Téléphone vérifié
                    </span>
                  )}
                  {(profileData as { is_verified?: boolean } | null)?.is_verified && (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-black" style={{ background: "rgba(185,138,46,0.14)", border: "1px solid rgba(185,138,46,0.28)", color: "var(--accent-gold)" }}>
                      <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
                      Compte vérifié
                    </span>
                  )}
                  {ownerListingsCount !== null && (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-black" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                      <Home className="h-3.5 w-3.5" strokeWidth={2.5} />
                      {ownerListingsCount} annonce{ownerListingsCount > 1 ? "s" : ""}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-black" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                    <MapPin className="h-3.5 w-3.5" strokeWidth={2.5} />
                    {neighborhoodLabel}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-black" style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.24)", color: "#15803d" }}>
                    <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
                    Fiabilité élevée
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-black" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                    <Zap className="h-3.5 w-3.5" strokeWidth={2.5} />
                    Répond vite
                  </span>
                </div>

                {isOwner ? (
                  <Link
                    href={`/compte/annonces/${property.id}/modifier`}
                    className="flex items-center justify-center gap-2 w-full font-bold py-3 px-4 rounded-2xl transition-all text-sm"
                    style={{ background: "var(--accent-gold)", color: "var(--bg-primary)" }}
                  >
                    <Edit3 className="h-4 w-4" strokeWidth={2.4} />
                    Gérer cette annonce
                  </Link>
                ) : !isLoggedIn ? (
                  <>
                    <p className="text-xs text-center" style={{ color: "var(--text-secondary)" }}>Connectez-vous pour voir les coordonnées du propriétaire</p>
                    <Link
                      href={`/connexion?redirect=/annonces/${property.id}`}
                      className="flex items-center justify-center gap-2 w-full font-bold py-3 px-4 rounded-2xl transition-all text-sm"
                      style={{ background: "var(--accent-gold)", color: "var(--bg-primary)" }}
                    >
                      <KeyRound className="h-4 w-4" strokeWidth={2.4} />
                      Se connecter
                    </Link>
                    <Link
                      href={`/inscription?redirect=/annonces/${property.id}`}
                      className="flex items-center justify-center gap-2 w-full font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm"
                      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                    >
                      Créer un compte
                    </Link>
                  </>
                ) : (
                  <>
                    {/* WhatsApp */}
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-3 w-full bg-[#25D366] hover:bg-[#1ebe5d] active:scale-95 text-white font-bold py-3 px-4 rounded-2xl transition-all shadow-[0_8px_32px_rgba(37,211,102,0.3)]">
                      <MessageCircle className="h-5 w-5" strokeWidth={2.6} />
                      WhatsApp
                    </a>

                    {/* Phone */}
                    <a href={phoneUrl}
                      className="flex items-center justify-center gap-2 w-full font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm hover:bg-black/5"
                      style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                      <Phone className="w-4 h-4" />
                      Appeler
                    </a>

                    <MessageButton propertyId={property.id} ownerId={property.owner_id} propertyTitle={property.title} />

                    <ReportButton
                      propertyId={property.id}
                      propertyTitle={property.title}
                      ownerId={property.owner_id}
                      ownerName={(profileData as { full_name?: string | null } | null)?.full_name ?? null}
                      target="owner"
                      isLoggedIn={isLoggedIn}
                    />

                    <p className="text-[11px] text-center" style={{ color: "var(--text-muted)" }}>Mentionnez LogerBien lors du contact</p>
                  </>
                )}

                <div className="pt-2.5 border-t" style={{ borderColor: "var(--border)" }}>
                  <p className="text-[11px] leading-snug" style={{ color: "var(--text-muted)" }}>
                    <span className="inline-flex items-start gap-2">
                      <Lock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" strokeWidth={2.4} />
                      <span>Ne payez jamais avant de visiter le logement. LogerBien ne demande aucun paiement direct.</span>
                    </span>
                  </p>
                </div>
              </div>
            </div>

          </div>

          {similar.length > 0 && (
            <section className="mt-6 pb-6">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-black md:text-2xl" style={{ color: "var(--text-primary)" }}>
                <Home className="h-5 w-5 text-[var(--accent-gold)]" strokeWidth={2.5} />
                Logements similaires
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible xl:grid-cols-4 2xl:grid-cols-5">
                {similar.map((p, i) => (
                  <div key={p.id} className="min-w-[82vw] md:min-w-0">
                    <PropertyCard property={p} index={i} priority={false} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

    </div>
  );
}
