import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { AlertTriangle, ArrowLeft, Armchair, BadgeCheck, Battery, Bed, Bath, BrickWall, Building2, Calendar, Camera, Car, CheckCircle, CircleCheck, Droplets, Edit3, Eye, Home, KeyRound, Lock, MapPin, MessageCircle, Phone, Shield, ShieldCheck, Snowflake, Sofa, Square, Sun, Utensils, Video, Wifi, XCircle, Zap } from "lucide-react";
import { ListingScore } from "@/components/ListingScore";
import { Avatar } from "@/components/ui/Avatar";
import { PhotoGallery } from "./PhotoGallery";
import { ReactionBar } from "@/components/property/ReactionBar";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { MessageButton } from "@/components/property/MessageButton";
import { ReportButton } from "@/components/property/ReportButton";
import { DetailFavoriteButton } from "@/components/property/DetailFavoriteButton";
import { PropertyShareButton } from "@/components/property/PropertyShareButton";
import { VisitButton } from "@/components/property/VisitButton";
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



export const revalidate = 60;

// Shared pill style for the amenity section
const EQUIP_PILL: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  borderRadius: 999,
  padding: "8px 14px",
  fontSize: 16,
  fontWeight: 800,
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
};

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
  const image = (row.property_images ?? [])[0]?.url;

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
  if (finalRow.owner_id) {
    const { data } = await db
      .from("profiles")
      .select("id, full_name, role, is_verified, created_at, avatar_url")
      .eq("id", finalRow.owner_id)
      .maybeSingle();
    profileData = data;
  }

  const property = finalRow as Property;
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
    .limit(3);
  const similar = ((similarRows ?? []) as Property[]).filter(isPubliclyAvailable);

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

  // ── Other equipment pills ──────────────────────────────────────────────────
  const otherEquip: { Icon: typeof Car; label: string }[] = [];
  if (property.has_parking)      otherEquip.push({ Icon: Car, label: "Parking" });
  if (property.has_security)     otherEquip.push({ Icon: Shield, label: "Gardien" });
  if (property.has_fence)        otherEquip.push({ Icon: BrickWall, label: "Clôture" });
  if (property.has_ac)           otherEquip.push({ Icon: Snowflake, label: "Climatisation" });
  if (property.kitchen_equipped) otherEquip.push({ Icon: Utensils, label: "Cuisine équipée" });
  if ((property.floor_number ?? 0) > 0)
    otherEquip.push({ Icon: Building2, label: `Étage ${property.floor_number}` });
  else
    otherEquip.push({ Icon: Home, label: "RDC" });

  const CARD_AVAIL = { background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.20)" };
  const CARD_NONE  = { background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.20)" };

  return (
    <div className="bg-[var(--bg-primary)] pb-32 md:pb-12">
      {/* Silent view tracker (client component) */}
      <PropertyViewTracker propertyId={property.id} />

      {/* Back nav */}
      <div className="absolute top-[64px] left-0 right-0 z-20 flex items-center gap-3 px-4 pt-4">
        <Link
          href="/annonces"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-md hover:bg-white transition-colors text-[#1A1A1A] flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <nav className="flex items-center gap-2 text-xs overflow-hidden" style={{ color: "var(--text-secondary)" }}>
          <Link href="/" className="hover:text-[var(--accent-gold)] whitespace-nowrap">Accueil</Link>
          <span>/</span>
          <Link href="/annonces" className="hover:text-[var(--accent-gold)] whitespace-nowrap">Annonces</Link>
          <span>/</span>
          <span className="truncate">{property.title}</span>
        </nav>
      </div>

      {/* Video — BEFORE gallery */}
      {videoUrl && (
        <div style={{ background: "var(--bg-secondary)" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", padding: "56px 0 0" }}>
            <p style={{ color: "var(--text-primary)", fontSize: 14, fontWeight: 600, padding: "12px 16px 8px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Video style={{ width: 16, height: 16 }} strokeWidth={2.4} />
                Visite vidéo
              </span>
            </p>
            <video
              src={videoUrl}
              controls
              muted
              playsInline
              preload="metadata"
              poster={property.property_images?.[0]?.url}
              style={{ width: "100%", borderRadius: 12, display: "block" }}
            />
          </div>
        </div>
      )}

      {/* Premium gallery */}
      <div className="relative mx-auto max-w-[1440px] px-4 pt-20 md:pt-24">
        <PhotoGallery
          images={(property.property_images ?? []).map((i) => ({ url: i.url, alt: property.title }))}
          title={property.title}
        />
      </div>

      {/* Content card */}
      <div className="relative z-10 mt-0 rounded-t-[28px]" style={{ background: "var(--bg-primary)" }}>
        <div className="max-w-[1440px] mx-auto px-4 pt-6">

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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ── Main column ── */}
            <div className="lg:col-span-2 space-y-5">

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

              {/* Title + location + price + SHARE (visible) */}
              <div>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-black leading-tight flex-1" style={{ color: "var(--text-primary)" }}>
                    {property.title}
                  </h1>
                  {/* Favorite + Share — visible near title */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <DetailFavoriteButton propertyId={id} initialIsFav={initialIsFav} />
                    <PropertyShareButton
                      title={property.title}
                      neighborhood={neighborhoodLabel}
                      price={formatPrice(property.price, "GNF", property.price_period)}
                      rooms={property.rooms}
                      bathrooms={property.bathrooms}
                      surface={property.surface}
                      shortRef={shortRef ?? undefined}
                      propertyId={property.id}
                      isLoggedIn={isLoggedIn}
                    />
                  </div>
                </div>
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
                <p className="text-2xl md:text-3xl font-black mt-3" style={{ color: "var(--accent-gold)" }}>
                  {formatPrice(property.price, "GNF", property.price_period)}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
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

              {/* Score de confiance */}
              <ListingScore
                images={(property.property_images ?? []).length}
                description={property.description}
                phone={property.contact_phone}
                surface={property.surface}
                rooms={property.rooms}
              />

              {/* Specs row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(property.rooms ?? 0) > 0 && (
                  <div className="rounded-2xl p-4 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                    <Bed className="w-6 h-6 mx-auto mb-1" style={{ color: "var(--text-secondary)" }} />
                    <p className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>{property.rooms}</p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Chambre{(property.rooms ?? 0) > 1 ? "s" : ""}</p>
                  </div>
                )}
                {(property.bathrooms ?? 0) > 0 && (
                  <div className="rounded-2xl p-4 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                    <Bath className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                    <p className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>{property.bathrooms}</p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Salle{(property.bathrooms ?? 0) > 1 ? "s" : ""} de bain</p>
                  </div>
                )}
                {(property.surface ?? 0) > 0 && (
                  <div className="rounded-2xl p-4 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                    <Square className="w-6 h-6 text-green-500 mx-auto mb-1" />
                    <p className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>{property.surface}</p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>m²</p>
                  </div>
                )}
                <div className="rounded-2xl p-4 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                  {property.furnished ? (
                    <Sofa className="mx-auto mb-1 h-6 w-6" style={{ color: "var(--text-secondary)" }} strokeWidth={2.2} />
                  ) : (
                    <Armchair className="mx-auto mb-1 h-6 w-6" style={{ color: "var(--text-secondary)" }} strokeWidth={2.2} />
                  )}
                  <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                    {property.furnished ? "Meublé" : "Non meublé"}
                  </p>
                </div>
              </div>

              {/* ── Équipements essentiels ── */}
              <div>
                <h2 className="font-bold text-sm mb-3" style={{ color: "var(--text-primary)" }}>Équipements essentiels</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                  {/* Eau */}
                  <div style={{ ...(waterAvail ? CARD_AVAIL : CARD_NONE), borderRadius: 12, padding: 16, textAlign: "center" }}>
                    <WaterIcon style={{ width: 28, height: 28, display: "block", margin: "0 auto 8px", color: "var(--accent-gold)" }} strokeWidth={2.2} />
                    <p style={{ fontSize: 10, fontWeight: 700, color: "var(--bl-cream-dim)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>EAU</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                      {WATER_INFO[waterKey]?.label ?? waterKey}
                    </p>
                  </div>
                  {/* Électricité */}
                  <div style={{ ...(elecAvail ? CARD_AVAIL : CARD_NONE), borderRadius: 12, padding: 16, textAlign: "center" }}>
                    <ElecIcon style={{ width: 28, height: 28, display: "block", margin: "0 auto 8px", color: "var(--accent-gold)" }} strokeWidth={2.2} />
                    <p style={{ fontSize: 10, fontWeight: 700, color: "var(--bl-cream-dim)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>ÉLECTRICITÉ</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                      {ELEC_INFO[elecKey]?.label ?? elecKey}
                    </p>
                  </div>
                  {/* Internet */}
                  <div style={{ ...(inetAvail ? CARD_AVAIL : CARD_NONE), borderRadius: 12, padding: 16, textAlign: "center" }}>
                    <InetIcon style={{ width: 28, height: 28, display: "block", margin: "0 auto 8px", color: "var(--accent-gold)" }} strokeWidth={2.2} />
                    <p style={{ fontSize: 10, fontWeight: 700, color: "var(--bl-cream-dim)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>INTERNET</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                      {INET_INFO[inetKey]?.label ?? inetKey}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Autres équipements pills ── */}
              {otherEquip.length > 0 && (
                <div>
                  <h2 className="font-bold text-sm mb-3" style={{ color: "var(--text-primary)" }}>Autres équipements</h2>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {otherEquip.map((eq) => (
                      <span key={eq.label} style={{
                        background: "var(--bg-card)", border: "1px solid var(--border)",
                        color: "var(--bl-cream-dim)", borderRadius: 999,
                        padding: "6px 14px", fontSize: 12,
                        display: "inline-flex", alignItems: "center", gap: 6,
                      }}>
                        <eq.Icon style={{ width: 14, height: 14 }} strokeWidth={2.3} />
                        {eq.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Équipements détaillés (nouvelles colonnes migration 017) ── */}
              {(property.has_edg || property.has_generator || property.has_solar ||
                property.has_tap_water || property.has_borehole || property.has_running_water ||
                property.is_furnished || property.has_pool) && (
                <div>
                  <h2 className="font-bold text-sm mb-3" style={{ color: "var(--text-primary)" }}>Équipements détaillés</h2>
                  {/* Electricity */}
                  {(property.has_edg || property.has_generator || property.has_solar) && (
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <Zap style={{ width: 13, height: 13 }} strokeWidth={2.4} />
                          Électricité
                        </span>
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {property.has_edg && <span style={EQUIP_PILL}><Zap style={{ width: 14, height: 14 }} /> EDG</span>}
                        {property.has_generator && <span style={EQUIP_PILL}><Battery style={{ width: 14, height: 14 }} /> Groupe électrogène</span>}
                        {property.has_solar && <span style={EQUIP_PILL}><Sun style={{ width: 14, height: 14 }} /> Panneau solaire</span>}
                      </div>
                    </div>
                  )}
                  {/* Water */}
                  {(property.has_tap_water || property.has_borehole || property.has_running_water) && (
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <Droplets style={{ width: 13, height: 13 }} strokeWidth={2.4} />
                          Eau
                        </span>
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {property.has_tap_water && <span style={EQUIP_PILL}><Droplets style={{ width: 14, height: 14 }} /> Robinet</span>}
                        {property.has_borehole && <span style={EQUIP_PILL}><Droplets style={{ width: 14, height: 14 }} /> Forage</span>}
                        {property.has_running_water && <span style={EQUIP_PILL}><Droplets style={{ width: 14, height: 14 }} /> Eau courante</span>}
                      </div>
                    </div>
                  )}
                  {/* Comfort */}
                  {(property.is_furnished || property.has_pool) && (
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <Home style={{ width: 13, height: 13 }} strokeWidth={2.4} />
                          Confort
                        </span>
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {property.is_furnished && <span style={EQUIP_PILL}><Sofa style={{ width: 14, height: 14 }} /> Meublé</span>}
                        {property.has_pool && <span style={EQUIP_PILL}><Droplets style={{ width: 14, height: 14 }} /> Piscine</span>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Réactions rapides ── */}
              <div>
                <h2 className="font-bold text-sm mb-3" style={{ color: "var(--text-primary)" }}>Réactions</h2>
                <ReactionBar propertyId={property.id} />
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

              {/* Trust badges */}
              {((profileData as {is_verified?: boolean} | null)?.is_verified || (property.property_images?.length ?? 0) > 0 || property.contact_phone) && (
                <div className="rounded-2xl p-4 space-y-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                  {(profileData as {is_verified?: boolean} | null)?.is_verified && (
                    <p className="font-bold text-sm mb-2" style={{ color: "var(--text-primary)" }}>Pourquoi faire confiance à cette annonce</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {(profileData as {is_verified?: boolean} | null)?.is_verified && (
                      <span className="inline-flex items-center gap-1.5 text-base font-black px-3 py-2 rounded-full" style={{ background: "rgba(212,175,55,0.12)", color: "var(--accent-gold)", border: "1px solid rgba(212,175,55,0.30)" }}>
                        <BadgeCheck className="h-4 w-4" strokeWidth={2.4} /> Propriétaire
                      </span>
                    )}
                    {(property.property_images?.length ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-base font-black px-3 py-2 rounded-full" style={{ background: "rgba(212,175,55,0.15)", color: "var(--accent-gold)", border: "1px solid rgba(212,175,55,0.25)" }}>
                        <Camera className="h-4 w-4" strokeWidth={2.4} /> Photos
                      </span>
                    )}
                    {property.contact_phone && (
                      <span className="inline-flex items-center gap-1.5 text-base font-black px-3 py-2 rounded-full" style={{ background: "rgba(37,211,102,0.12)", color: "#15803d", border: "1px solid rgba(37,211,102,0.25)" }}>
                        <Phone className="h-4 w-4" strokeWidth={2.4} /> Téléphone
                      </span>
                    )}
                    {videoUrl && (
                      <span className="inline-flex items-center gap-1.5 text-base font-black px-3 py-2 rounded-full" style={{ background: "rgba(139,92,246,0.15)", color: "#6d28d9", border: "1px solid rgba(139,92,246,0.25)" }}>
                        <Video className="h-4 w-4" strokeWidth={2.4} /> Vidéo
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Similar listings */}
              {similar.length > 0 && (
                <div className="pt-2 pb-6">
                  <h2 className="font-bold mb-4 text-lg" style={{ color: "var(--text-primary)" }}>
                    Annonces similaires à {neighborhoodLabel}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {similar.map((p) => (
                      <PropertyCard key={p.id} property={p} />
                    ))}
                  </div>
                </div>
              )}

              {/* Report — discreet at bottom */}
              <div className="flex justify-center pb-4">
                <ReportButton propertyId={property.id} propertyTitle={property.title} isLoggedIn={isLoggedIn} />
              </div>

            </div>

            {/* ── Sidebar (desktop) ── */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-20 rounded-2xl p-5 space-y-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                {profileData && (
                  <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
                    <Avatar
                      url={(profileData as { avatar_url?: string | null }).avatar_url}
                      name={(profileData as { full_name?: string | null }).full_name ?? undefined}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                        {(profileData as { full_name?: string | null }).full_name ?? "Propriétaire"}
                      </p>
                      {(profileData as { is_verified?: boolean }).is_verified && (
                        <p className="text-[var(--accent-gold)] text-xs">✓ Vérifié</p>
                      )}
                    </div>
                  </div>
                )}
                <div className="text-center pb-3 border-b" style={{ borderColor: "var(--border)" }}>
                  <p className="text-3xl font-black" style={{ color: "var(--text-primary)" }}>
                    {formatPrice(property.price, "GNF", property.price_period)}
                  </p>
                  <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    {neighborhoodLabel} · {TYPE_LABELS[property.type] ?? property.type}
                  </p>
                </div>

                {isOwner ? (
                  <Link
                    href={`/compte/annonces/${property.id}/modifier`}
                    className="flex items-center justify-center gap-2 w-full font-bold py-4 px-4 rounded-2xl transition-all text-sm"
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
                      className="flex items-center justify-center gap-2 w-full font-bold py-4 px-4 rounded-2xl transition-all text-sm"
                      style={{ background: "var(--accent-gold)", color: "var(--bg-primary)" }}
                    >
                      <KeyRound className="h-4 w-4" strokeWidth={2.4} />
                      Se connecter
                    </Link>
                    <Link
                      href={`/inscription?redirect=/annonces/${property.id}`}
                      className="flex items-center justify-center gap-2 w-full font-semibold py-3 px-4 rounded-xl transition-colors text-sm"
                      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                    >
                      Créer un compte
                    </Link>
                  </>
                ) : (
                  <>
                    {/* WhatsApp */}
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-3 w-full bg-[#25D366] hover:bg-[#1ebe5d] active:scale-95 text-white font-bold py-4 px-4 rounded-2xl transition-all shadow-[0_8px_32px_rgba(37,211,102,0.3)]">
                      <MessageCircle className="h-5 w-5" strokeWidth={2.6} />
                      WhatsApp
                    </a>

                    {/* Visit — opens VisitRequestModal (form → DB insert) */}
                    <VisitButton
                      propertyId={property.id}
                      ownerId={property.owner_id}
                      propertyTitle={property.title}
                    />

                    {/* Phone */}
                    <a href={phoneUrl}
                      className="flex items-center justify-center gap-2 w-full font-semibold py-3 px-4 rounded-xl transition-colors text-sm hover:bg-black/5"
                      style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                      <Phone className="w-4 h-4" />
                      Appeler
                    </a>

                    <MessageButton propertyId={property.id} ownerId={property.owner_id} propertyTitle={property.title} />

                    <p className="text-[11px] text-center" style={{ color: "var(--text-muted)" }}>Mentionnez LogerBien lors de votre contact</p>
                  </>
                )}

                <div className="pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    <span className="inline-flex items-start gap-2">
                      <Lock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" strokeWidth={2.4} />
                      <span>Ne payez jamais avant de visiter le logement. LogerBien ne demande aucun paiement direct.</span>
                    </span>
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="lg:hidden fixed left-0 right-0 z-[40] px-4 pt-3 space-y-2" style={{ bottom: "calc(88px + env(safe-area-inset-bottom,0px))", background: "var(--nav-bg)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", borderTop: "1px solid var(--border)", paddingBottom: 12 }}>
        {isOwner ? (
          <Link
            href={`/compte/annonces/${property.id}/modifier`}
            className="flex items-center justify-center gap-2 w-full font-bold rounded-2xl text-sm"
            style={{ background: "var(--accent-gold)", color: "var(--bg-primary)", minHeight: "52px" }}
          >
            <Edit3 className="h-4 w-4" strokeWidth={2.4} />
            Gérer cette annonce
          </Link>
        ) : !isLoggedIn ? (
          <div className="flex gap-2">
            <Link
              href={`/connexion?redirect=/annonces/${property.id}`}
              className="flex-1 flex items-center justify-center gap-2 font-bold rounded-2xl text-sm"
              style={{ background: "var(--accent-gold)", color: "var(--bg-primary)", minHeight: "52px" }}
            >
              <KeyRound className="h-4 w-4" strokeWidth={2.4} />
              Se connecter
            </Link>
            <Link
              href={`/inscription?redirect=/annonces/${property.id}`}
              className="flex-1 flex items-center justify-center gap-2 font-semibold rounded-xl text-sm"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)", minHeight: "52px" }}
            >
              S&apos;inscrire
            </Link>
          </div>
        ) : (
          <>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1ebe5d] active:scale-[0.99] text-white font-bold rounded-2xl text-sm shadow-[0_4px_20px_rgba(37,211,102,0.35)]"
              style={{ minHeight: "52px" }}>
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current flex-shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
            <div className="flex gap-2">
              <VisitButton
                propertyId={property.id}
                ownerId={property.owner_id}
                propertyTitle={property.title}
              />
              <a href={phoneUrl}
                className="flex-1 flex items-center justify-center gap-2 font-semibold rounded-xl text-sm"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)", minHeight: "48px" }}>
                <Phone className="w-4 h-4" /> Appeler
              </a>
            </div>
            <MessageButton propertyId={property.id} ownerId={property.owner_id} propertyTitle={property.title} />
          </>
        )}
      </div>

    </div>
  );
}
