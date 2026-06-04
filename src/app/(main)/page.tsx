import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, ChevronRight, Flame, ShieldCheck } from "lucide-react";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { RecentlyViewedSection } from "@/components/ui/RecentlyViewedSection";
import { HeroSearch } from "@/components/home/HeroSearch";
import { MaisonDuJour } from "@/components/MaisonDuJour";
import { PWAInstallButton } from "@/components/home/PWAInstallButton";
import { LiveCounterBadge } from "@/components/home/LiveCounterBadge";
import { formatPrice } from "@/lib/utils";
import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";
import type { Property } from "@/types";

// Revalidate every 60s for a near-live feel without re-fetching every request
export const revalidate = 60;

export const metadata: Metadata = {
  title: "LogerBien — Trouvez votre logement à Conakry",
  description:
    "Trouvez votre logement à Conakry sans commission. Appartements, maisons, villas. Contact direct propriétaire en Guinée.",
  openGraph: {
    title: "LogerBien — Trouvez votre logement à Conakry",
    description: "Trouvez votre logement à Conakry sans commission. Direct propriétaire.",
    url: "https://logerbien.gn",
    siteName: "LogerBien",
  },
};

// ─── Constants ─────────────────────────────────────────────────────────────────

const NL: Record<string, string> = {
  kipe: "Kipé", hamdallaye: "Hamdallaye", dixinn: "Dixinn", ratoma: "Ratoma",
  taouyah: "Taouyah", sonfonia: "Sonfonia", lambanyi: "Lambanyi", kaloum: "Kaloum",
  matam: "Matam", madina: "Madina", nongo: "Nongo", cosa: "Cosa",
};

const AVAIL_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  urgent:    { label: "⚡ Urgent",              color: "#ff4d4d", bg: "rgba(255,77,77,0.20)",   border: "rgba(255,77,77,0.50)"   },
  today:     { label: "🔥 Dispo aujourd'hui",   color: "#ff8c00", bg: "rgba(255,140,0,0.20)",   border: "rgba(255,140,0,0.50)"   },
  immediate: { label: "🏃 Libre immédiatement", color: "#25D366", bg: "rgba(37,211,102,0.20)",  border: "rgba(37,211,102,0.50)"  },
};

const POPULAR_NEIGHBORHOODS = [
  { id: "kipe",       name: "Kipé"       },
  { id: "hamdallaye", name: "Hamdallaye" },
  { id: "dixinn",     name: "Dixinn"     },
  { id: "ratoma",     name: "Ratoma"     },
  { id: "taouyah",    name: "Taouyah"   },
  { id: "sonfonia",   name: "Sonfonia"   },
];

const TRUST_ITEMS = [
  { icon: "🏠", title: "Propriétaires directs",  desc: "Contactez le propriétaire sans intermédiaire ni commission cachée." },
  { icon: "✅", title: "Annonces vérifiées",      desc: "Chaque annonce est contrôlée par notre équipe avant publication." },
  { icon: "📞", title: "Contact direct",          desc: "WhatsApp ou appel en un clic. Zéro formulaire, zéro délai." },
  { icon: "⚡", title: "Réponse rapide",          desc: "Les propriétaires répondent en moins de 24h sur WhatsApp." },
];

const TYPE_GRADIENTS: Record<string, [string, string]> = {
  apartment: ["var(--bg-secondary)", "var(--bg-secondary)"],
  villa:     ["var(--bg-secondary)", "var(--bg-primary)"],
  house:     ["var(--bg-primary)", "var(--bg-secondary)"],
  studio:    ["var(--bg-primary)", "var(--bg-secondary)"],
  room:      ["var(--bg-secondary)", "var(--bg-secondary)"],
  land:      ["var(--bg-primary)", "var(--bg-secondary)"],
};

const HERO_GRADIENTS: [string, string][] = [
  ["var(--bg-secondary)", "var(--bg-secondary)"],
  ["var(--bg-primary)", "var(--bg-secondary)"],
  ["var(--bg-primary)", "var(--bg-secondary)"],
];

const CARD_POSITIONS = [
  { top: "6px",   right: "2%",  rotate: "-2deg",  zIndex: 3, opacity: 1    },
  { top: "132px", right: "15%", rotate: "2.2deg", zIndex: 2, opacity: 0.96 },
  { top: "260px", right: "6%",  rotate: "1.8deg", zIndex: 1, opacity: 0.9  },
];

// ─── Data fetching ─────────────────────────────────────────────────────────────

function getDB() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function fetchHomeProperties(): Promise<Property[]> {
  try {
    const db = getDB();
    if (!db) return [];
    const { data } = await db
      .from("properties")
      .select("*, property_images(*)")
      .eq("status", "active")
      .order("is_boosted", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(12);
    return (data ?? []) as Property[];
  } catch { return []; }
}

async function fetchUrgentProperties(): Promise<Property[]> {
  try {
    const db = getDB();
    if (!db) return [];
    const { data } = await db
      .from("properties")
      .select("*, property_images(*)")
      .eq("status", "active")
      .in("availability_mode", ["urgent", "today", "immediate"])
      .order("created_at", { ascending: false })
      .limit(10);
    return (data ?? []) as Property[];
  } catch { return []; }
}

async function fetchActiveCountToday(): Promise<number> {
  try {
    const db = getDB();
    if (!db) return 0;
    const today = new Date().toISOString().split("T")[0] + "T00:00:00.000Z";
    const { count } = await db
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .gte("created_at", today);
    return count ?? 0;
  } catch { return 0; }
}

async function fetchNeighborhoodCounts(): Promise<Record<string, number>> {
  try {
    const db = getDB();
    if (!db) return {};
    const { data } = await db
      .from("properties")
      .select("neighborhood")
      .eq("status", "active");
    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      counts[row.neighborhood] = (counts[row.neighborhood] ?? 0) + 1;
    }
    return counts;
  } catch { return {}; }
}

async function fetchHomeStats(): Promise<{ active: number; verifiedOwners: number; neighborhoods: number }> {
  try {
    const db = getDB();
    if (!db) return { active: 0, verifiedOwners: 0, neighborhoods: 0 };

    const [{ count: active }, { count: verifiedOwners }, { data: neighborhoods }] = await Promise.all([
      db.from("properties").select("id", { count: "exact", head: true }).eq("status", "active"),
      db.from("profiles").select("id", { count: "exact", head: true }).eq("is_verified", true),
      db.from("properties").select("neighborhood").eq("status", "active"),
    ]);

    return {
      active: active ?? 0,
      verifiedOwners: verifiedOwners ?? 0,
      neighborhoods: new Set((neighborhoods ?? []).map((n) => n.neighborhood).filter(Boolean)).size,
    };
  } catch {
    return { active: 0, verifiedOwners: 0, neighborhoods: 0 };
  }
}

// ─── Hero preview card (desktop only, decorative) ─────────────────────────────

function PreviewCard({ property, index }: { property: Property; index: number }) {
  const pos = CARD_POSITIONS[index];
  if (!pos) return null;
  const primaryImg = property.property_images?.find((i) => i.is_primary) ?? property.property_images?.[0];
  const [gradFrom, gradTo] = TYPE_GRADIENTS[property.type] ?? HERO_GRADIENTS[index % 3];
  const priceStr = formatPrice(property.price, "GNF", property.price_period);
  const badge = property.transaction_type === "rent" ? "Location" : "Vente";

  return (
    <div
      className="absolute w-[min(76%,320px)] overflow-hidden"
      style={{
        top: pos.top, right: pos.right,
        transform: `rotate(${pos.rotate})`,
        zIndex: pos.zIndex, opacity: pos.opacity,
        background: "#ffffff",
        borderRadius: 22,
        boxShadow: "0 22px 60px rgba(24,21,16,0.13)",
      }}
    >
      <div className="relative h-[clamp(128px,12vw,168px)]">
        {primaryImg ? (
          <Image src={primaryImg.url} alt={property.title} fill className="object-cover" sizes="(min-width: 1024px) 320px, 240px" quality={65} loading="lazy" />
        ) : (
          <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})` }} />
        )}
        <div className="absolute top-2 left-2">
          <span className="text-[10px] font-bold px-2 py-0.5" style={{ background: "#e4efe8", color: "#214e3a", borderRadius: 999 }}>
            {badge}
          </span>
        </div>
      </div>
      <div className="p-3.5" style={{ color: "#181510" }}>
        <p className="font-bold text-[15px] leading-snug line-clamp-1">{property.title}</p>
        <div className="flex items-center gap-1 text-xs mt-1" style={{ color: "#666" }}>
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span>{NL[property.neighborhood] ?? property.neighborhood}</span>
        </div>
        <p className="font-black text-[15px] mt-1.5" style={{ color: "#b98a2e", fontWeight: 900 }}>{priceStr}</p>
      </div>
    </div>
  );
}

// ─── Urgency mini-card ─────────────────────────────────────────────────────────

function UrgencyCard({ property }: { property: Property }) {
  const primaryImg = property.property_images?.find((i) => i.is_primary) ?? property.property_images?.[0];
  const mode = (property as Property & { availability_mode?: string }).availability_mode ?? "immediate";
  const cfg  = AVAIL_CONFIG[mode] ?? AVAIL_CONFIG.immediate;
  const priceStr = formatPrice(property.price, "GNF", property.price_period);

  return (
    <Link
      href={`/annonces/${property.id}`}
      className="flex-shrink-0 rounded-xl overflow-hidden"
      style={{ width: 176, background: "var(--bg-card)", border: `1px solid ${cfg.border}` }}
    >
      <div className="relative" style={{ height: 104 }}>
        {primaryImg ? (
          <Image src={primaryImg.url} alt={property.title} fill className="object-cover" sizes="176px" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: cfg.bg }}>
            <span className="text-3xl">🏠</span>
          </div>
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)" }} />
        <div className="absolute top-2 left-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
            {cfg.label}
          </span>
        </div>
      </div>
      <div className="p-2.5">
        <p className="font-bold text-xs line-clamp-2 leading-snug mb-1" style={{ color: "var(--text-primary)" }}>
          {property.title}
        </p>
        <p className="text-[11px] flex items-center gap-0.5 mb-1" style={{ color: "#666" }}>
          <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
          {NL[property.neighborhood] ?? property.neighborhood}
        </p>
        <p className="font-bold text-xs" style={{ color: "var(--accent-gold)" }}>{priceStr}</p>
      </div>
    </Link>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const [properties, urgentProps, activeCountToday, neighborhoodCounts, homeStats] = await Promise.all([
    fetchHomeProperties(),
    fetchUrgentProperties(),
    fetchActiveCountToday(),
    fetchNeighborhoodCounts(),
    fetchHomeStats(),
  ]);

  const heroPreview = properties.slice(0, 3);
  const recent      = properties.slice(0, 6);
  const stats = {
    active: homeStats.active || properties.length,
    verifiedOwners: homeStats.verifiedOwners || (properties.length > 0 ? Math.max(1, Math.round(properties.length / 3)) : 0),
    neighborhoods: homeStats.neighborhoods || Object.values(neighborhoodCounts).filter((count) => count > 0).length,
  };
  const popularWithListings = POPULAR_NEIGHBORHOODS.filter((n) => (neighborhoodCounts[n.id] ?? 0) > 0);
  const popularSoon = POPULAR_NEIGHBORHOODS.filter((n) => (neighborhoodCounts[n.id] ?? 0) === 0);

  return (
    <>
      {/* ═══════════════════════════════════════════════════════
          1. HERO SECTION
      ═══════════════════════════════════════════════════════ */}
      <section className="hero-section home-section-fill relative flex flex-col overflow-hidden">

        {/* Grain / noise texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.04,
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n' x='0' y='0'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundRepeat: "repeat",
            backgroundSize: "200px 200px",
            mixBlendMode: "overlay",
          }}
        />

        {/* Hero content */}
        <div className="content-fluid relative flex-1 flex items-center py-5 sm:py-7 lg:py-8 xl:py-9">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(520px,0.96fr)_minmax(420px,1.04fr)] gap-8 lg:gap-10 xl:gap-14 items-center w-full">

            {/* ── Left: headline + search ── */}
            <div className="text-center lg:text-left">

              {/* Badge pill */}
              <div
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-4 lg:mb-5"
                style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.25)" }}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: "var(--accent-gold)", animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite" }}
                />
                <span className="text-sm font-medium" style={{ color: "var(--accent-gold)" }}>
                  Annonces vérifiées · Contact direct
                </span>
              </div>

              {/* Title */}
              <h1
                style={{
                  fontFamily: "var(--font-manrope), sans-serif",
                  fontWeight: 800,
                  fontSize: "clamp(2.65rem, 5.35vw, 5.45rem)",
                  lineHeight: 0.99,
                  color: "var(--text-primary)",
                  marginBottom: "0.85rem",
                  letterSpacing: 0,
                }}
              >
                Trouvez votre<br />
                logement<br />
                à Conakry<br />
                <span style={{ color: "var(--accent-gold)" }}>Direct propriétaire</span>
              </h1>

              {/* Subtitle */}
              <p
                className="mb-5 text-center lg:text-left"
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "1.0625rem",
                  lineHeight: 1.65,
                  maxWidth: 620,
                  margin: "0 auto 1.25rem",
                }}
              >
                Sans commission.&nbsp;&nbsp;Sans intermédiaire.&nbsp;&nbsp;Sans stress.
              </p>

              {/* Proof pills */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-4">
                {["✓ Annonces contrôlées", "📞 Appel ou WhatsApp", "$ Zéro frais caché"].map((label) => (
                  <span
                    key={label}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "9px 12px",
                      borderRadius: 999,
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      color: "var(--text-secondary)",
                      fontSize: 13,
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>

              {/* Live counter badge — client component to avoid hydration mismatch */}
              <LiveCounterBadge initial={activeCountToday} />

              <div className="grid grid-cols-3 gap-2 mb-4 max-w-[760px] mx-auto lg:mx-0">
                {[
                  { icon: Flame, value: stats.active, label: "logements" },
                  { icon: ShieldCheck, value: stats.verifiedOwners, label: "propriétaires" },
                  { icon: MapPin, value: stats.neighborhoods, label: "quartiers" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl px-3 py-3 text-left"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-soft)" }}
                  >
                    <item.icon className="w-4 h-4 mb-1.5" style={{ color: "var(--accent-gold)" }} />
                    <p className="font-black text-lg leading-none" style={{ color: "var(--text-primary)" }}>
                      {item.value > 0 ? `${item.value}+` : "0"}
                    </p>
                    <p className="text-[11px] font-semibold mt-1" style={{ color: "var(--text-secondary)" }}>
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Search bar */}
              <HeroSearch />
            </div>

            {/* ── Right: floating preview cards (desktop only) ── */}
            {heroPreview.length > 0 && (
              <div className="hidden lg:block relative min-h-[420px] xl:min-h-[460px]">
                {/* Floating stat card — top-right of showcase */}
                <div
                  className="absolute"
                  style={{
                    top: 0,
                    left: 0,
                    background: "#ffffff",
                    borderRadius: 16,
                    boxShadow: "0 8px 24px rgba(24,21,16,0.10)",
                    padding: "10px 14px",
                    zIndex: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 18 }}>⚡</span>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 12, color: "#181510", lineHeight: 1.2, margin: 0 }}>Délai de réponse rapide</p>
                    <p style={{ fontSize: 11, color: "#888", marginTop: 2, margin: "2px 0 0" }}>&lt; 24h en moyenne</p>
                  </div>
                </div>
                {heroPreview.map((p, i) => (
                  <PreviewCard key={p.id} property={p} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="relative pb-3 lg:pb-4 flex justify-center">
          <div className="w-6 h-9 rounded-full flex items-start justify-center pt-2" style={{ border: "2px solid rgba(212,175,55,0.20)" }}>
            <div className="w-1 h-2 rounded-full" style={{ background: "rgba(247,242,230,0.45)", animation: "bounce 2s infinite" }} />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          2. BANDEAU URGENCES (only if urgent listings exist)
      ═══════════════════════════════════════════════════════ */}
      {urgentProps.length > 0 && (
        <section
          className="py-5"
          style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}
        >
          <div className="content-fluid">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                ⚡ Disponibles maintenant
              </h2>
              <span
                className="text-xs px-2.5 py-0.5 rounded-full font-bold"
                style={{ background: "rgba(255,77,77,0.15)", color: "#ff6b6b" }}
              >
                {urgentProps.length} annonce{urgentProps.length > 1 ? "s" : ""}
              </span>
              <Link href="/annonces?recent=1" className="ml-auto text-xs font-semibold hover:underline" style={{ color: "var(--accent-gold)" }}>
                Voir toutes →
              </Link>
            </div>
            {/* Horizontal scrollable row — no visible scrollbar */}
            <div
              className="flex gap-3 pb-1 no-scrollbar"
              style={{ overflowX: "auto" }}
            >
              {urgentProps.map((p) => (
                <UrgencyCard key={p.id} property={p} />
              ))}
              {/* Spacer so last card isn't flush against the edge */}
              <div className="flex-shrink-0 w-4" />
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          3. MAISON DU JOUR
      ═══════════════════════════════════════════════════════ */}
      <div style={{ background: "var(--bg-primary)" }}>
        <MaisonDuJour />
      </div>

      {/* ═══════════════════════════════════════════════════════
          4. ANNONCES RÉCENTES
      ═══════════════════════════════════════════════════════ */}
      {recent.length > 0 && (
        <section className="py-10 md:py-12" style={{ background: "var(--bg-primary)" }}>
          <div className="content-fluid">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2
                  className="text-2xl md:text-3xl font-black"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-display), sans-serif" }}
                >
                  Annonces récentes
                </h2>
                <p className="mt-1 text-sm" style={{ color: "#666666" }}>Les dernières mises en ligne</p>
              </div>
              <Link href="/annonces" className="flex items-center gap-1 text-sm font-semibold hover:underline" style={{ color: "var(--accent-gold)" }}>
                Voir tout <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-5 items-stretch">
              {recent.map((p, i) => (
                <PropertyCard key={p.id} property={p} index={i + 10} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recently viewed (client-side, localStorage) */}
      <div style={{ background: "var(--bg-primary)" }}>
        <RecentlyViewedSection />
      </div>

      {/* ═══════════════════════════════════════════════════════
          5. QUARTIERS POPULAIRES — with live counts
      ═══════════════════════════════════════════════════════ */}
      <section className="py-10 md:py-12" style={{ background: "var(--bg-card-light)" }}>
        <div className="content-fluid">
          <div className="mb-5 md:mb-6">
            <h2
              className="text-2xl md:text-3xl font-black"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-display), sans-serif" }}
            >
              Quartiers populaires
            </h2>
            <p className="mt-1 text-sm" style={{ color: "#666666" }}>
              Explorez les annonces actives par quartier à Conakry
            </p>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] md:grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3 md:gap-4">
            {(popularWithListings.length > 0 ? popularWithListings : popularSoon).map((n) => {
              const count = neighborhoodCounts[n.id] ?? 0;
              return (
                <Link
                  key={n.id}
                  href={`/annonces?neighborhood=${n.id}`}
                  className="group rounded-2xl p-4 md:p-5 transition-all duration-200 hover:-translate-y-0.5 min-h-[132px]"
                  style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: "rgba(212,175,55,0.12)" }}
                  >
                    <MapPin className="w-4 h-4" style={{ color: "var(--accent-gold)" }} />
                  </div>
                  <p className="font-bold text-sm mb-0.5" style={{ color: "var(--text-primary)" }}>{n.name}</p>
                  <p className="text-xs" style={{ color: count > 0 ? "#22c55e" : "var(--text-muted)" }}>
                    {count > 0 ? `${count} annonce${count > 1 ? "s" : ""}` : "Bientôt disponible"}
                  </p>
                  <p className="text-xs font-semibold mt-2" style={{ color: "var(--accent-gold)" }}>Explorer →</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          6. JE CHERCHE — CTA pour les chercheurs
      ═══════════════════════════════════════════════════════ */}
      <section
        className="py-10 md:py-12"
        style={{
          background: "linear-gradient(135deg, rgba(212,175,55,0.14) 0%, rgba(212,175,55,0.04) 100%)",
          borderTop: "1px solid rgba(212,175,55,0.22)",
          borderBottom: "1px solid rgba(212,175,55,0.22)",
        }}
      >
        <div className="content-fluid text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h2
            className="text-2xl md:text-3xl font-black mb-3"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-display), sans-serif" }}
          >
            Vous cherchez un logement ?
          </h2>
          <p className="text-base mb-7 max-w-md mx-auto" style={{ color: "var(--text-secondary)" }}>
            Publiez votre recherche gratuitement. Les propriétaires vous contactent directement sur WhatsApp.
          </p>
          <Link
            href="/je-cherche"
            className="inline-flex items-center gap-2 font-bold px-8 py-4 rounded-2xl transition-opacity hover:opacity-90 text-sm"
            style={{ background: "var(--accent-gold)", color: "var(--bg-primary)" }}
          >
            Publier ma recherche →
          </Link>
          <p className="mt-4 text-xs" style={{ color: "#666" }}>
            Gratuit · Réponse en moins de 24h · Sans inscription obligatoire
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          7. SECTION CONFIANCE — 4 cartes
      ═══════════════════════════════════════════════════════ */}
      <section className="py-10 md:py-12" style={{ background: "var(--bg-card-light)" }}>
        <div className="content-fluid">
          <div className="text-center mb-7 md:mb-8">
            <h2
              className="text-2xl md:text-3xl font-black"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-display), sans-serif" }}
            >
              Pourquoi choisir LogerBien ?
            </h2>
            <p className="mt-2 text-sm max-w-md mx-auto" style={{ color: "#666" }}>
              La plateforme immobilière conçue pour la réalité guinéenne
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-5">
            {TRUST_ITEMS.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl p-5"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
              >
                <span className="text-3xl block mb-4">{item.icon}</span>
                <h3 className="font-bold text-base mb-2" style={{ color: "var(--text-primary)" }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#666" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          8. PUBLICATION RAPIDE CTA
      ═══════════════════════════════════════════════════════ */}
      <section className="py-11 md:py-14" style={{ background: "var(--bg-secondary)" }}>
        <div className="content-fluid text-center">
          <p className="text-4xl mb-4">🏠</p>
          <h2
            className="text-2xl md:text-4xl font-black mb-3"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-display), sans-serif" }}
          >
            Vous avez un logement à louer ?
          </h2>
          <p className="mb-8 max-w-lg mx-auto text-base" style={{ color: "#666" }}>
            Publiez en 2 minutes. 4 étapes seulement. Gratuit.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/publier/rapide"
              className="inline-flex items-center gap-2 font-bold px-8 py-4 rounded-2xl transition-opacity hover:opacity-90 text-sm"
              style={{ background: "var(--accent-gold)", color: "var(--bg-primary)" }}
            >
              ⚡ Publication rapide
            </Link>
            <Link
              href="/publier"
              className="inline-flex items-center gap-2 font-bold px-8 py-4 rounded-2xl text-sm transition-all hover:border-[var(--accent-gold)]"
              style={{ background: "transparent", border: "1px solid rgba(212,175,55,0.35)", color: "var(--accent-gold)" }}
            >
              Publication complète
            </Link>
          </div>
          <p className="mt-6 text-xs" style={{ color: "#555" }}>
            ✓ Sans carte bancaire &nbsp;·&nbsp; ✓ Résultat immédiat &nbsp;·&nbsp; ✓ Contact direct WhatsApp
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          9. PWA INSTALL SECTION
      ═══════════════════════════════════════════════════════ */}
      <section
        className="py-10"
        style={{ background: "var(--bg-card-light)", borderTop: "1px solid var(--border)" }}
      >
        <div className="content-fluid text-center">
          <div className="text-4xl mb-3">📱</div>
          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            Installez LogerBien sur votre téléphone
          </h2>
          <p className="text-sm mb-5" style={{ color: "#666" }}>
            Accédez rapidement depuis votre écran d&apos;accueil. Aucun téléchargement requis.
          </p>
          <Suspense fallback={null}>
            <PWAInstallButton />
          </Suspense>
        </div>
      </section>
    </>
  );
}
