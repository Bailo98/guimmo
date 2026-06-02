import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  ChevronRight,
  DollarSign,
  Home,
  MapPin,
  PhoneCall,
  Search,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { RecentlyViewedSection } from "@/components/ui/RecentlyViewedSection";
import { HeroSearch } from "@/components/home/HeroSearch";
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
  { top: "50px",  right: "255px", rotate: "-1.4deg", zIndex: 4, opacity: 1    },
  { top: "205px", right: "30px",  rotate: "2deg",    zIndex: 3, opacity: 0.98 },
  { top: "355px", right: "210px", rotate: "-1deg",   zIndex: 5, opacity: 1    },
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
      className="absolute w-[250px] xl:w-[292px] overflow-hidden"
      style={{
        top: pos.top, right: pos.right,
        transform: `rotate(${pos.rotate})`,
        zIndex: pos.zIndex, opacity: pos.opacity,
        background: "#ffffff",
        border: "1px solid rgba(222,211,191,0.84)",
        borderRadius: 20,
        boxShadow: "0 24px 60px rgba(24,21,16,0.18)",
      }}
    >
      <div className="relative h-28 xl:h-36">
        {primaryImg ? (
          <Image src={primaryImg.url} alt={property.title} fill className="object-cover" sizes="240px" quality={65} loading="lazy" />
        ) : (
          <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})` }} />
        )}
        <div className="absolute top-2 left-2">
          <span className="text-[10px] font-bold px-2 py-0.5" style={{ background: "#e4efe8", color: "#214e3a", borderRadius: 999 }}>
            {badge}
          </span>
        </div>
      </div>
      <div className="p-4" style={{ color: "#181510" }}>
        <p className="font-extrabold text-sm xl:text-base leading-snug line-clamp-2">{property.title}</p>
        <div className="flex items-center gap-1 text-xs xl:text-sm mt-2" style={{ color: "#625a4b" }}>
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span>{NL[property.neighborhood] ?? property.neighborhood}</span>
        </div>
        <p className="font-black text-sm xl:text-base mt-1.5" style={{ color: "#b98a2e", fontWeight: 900 }}>{priceStr}</p>
      </div>
    </div>
  );
}

function HomeListingCard({ property }: { property: Property }) {
  const primaryImg = property.property_images?.find((i) => i.is_primary) ?? property.property_images?.[0];
  const priceStr = formatPrice(property.price, "GNF", property.price_period);
  const tags = [
    property.transaction_type === "rent" ? "Location" : "Achat",
    property.rooms ? `${property.rooms} chambres` : null,
    property.bathrooms ? `${property.bathrooms} douches` : null,
  ].filter(Boolean);

  return (
    <Link
      href={`/annonces/${property.id}`}
      className="group overflow-hidden rounded-[22px] transition-transform duration-300 hover:-translate-y-1"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-soft)",
      }}
    >
      <div className="relative aspect-[1.95/1] overflow-hidden">
        {primaryImg ? (
          <Image
            src={primaryImg.url}
            alt={property.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            sizes="(max-width: 768px) 100vw, 33vw"
            quality={78}
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-[var(--bg-secondary)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-black/55 px-3 py-1.5 text-xs font-extrabold text-white backdrop-blur">
          {property.is_verified ? "Vérifiée" : property.transaction_type === "rent" ? "Location" : "Achat"}
        </span>
      </div>
      <div className="p-5">
        <h3 className="line-clamp-1 font-sans text-[19px] font-extrabold leading-tight" style={{ color: "var(--text-primary)" }}>
          {property.title}
        </h3>
        <p className="mt-3 flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          <MapPin className="h-4 w-4 shrink-0" style={{ color: "var(--color-green)" }} />
          {NL[property.neighborhood] ?? property.neighborhood} - Disponible maintenant
        </p>
        <div className="mt-4 flex min-h-8 flex-wrap gap-2">
          {tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full px-3 py-1.5 text-xs font-extrabold" style={{ background: "var(--surface-soft)", color: "var(--text-secondary)" }}>
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between gap-4">
          <p className="text-lg font-black" style={{ color: "var(--accent-gold)" }}>{priceStr}</p>
          <span className="text-sm font-extrabold" style={{ color: "var(--color-green)" }}>Voir</span>
        </div>
      </div>
    </Link>
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
  const [properties, activeCountToday] = await Promise.all([
    fetchHomeProperties(),
    fetchActiveCountToday(),
  ]);

  const heroPreview = properties.slice(0, 3);
  const recent      = properties.slice(0, 6);

  return (
    <>
      {/* ═══════════════════════════════════════════════════════
          1. HERO SECTION
      ═══════════════════════════════════════════════════════ */}
      <section className="hero-section relative min-h-[calc(100svh-72px)] flex flex-col overflow-hidden">

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
        <div className="relative flex-1 flex items-center w-full max-w-[1180px] mx-auto px-5 md:px-0 py-8 md:py-0">
          <div className="grid grid-cols-1 lg:grid-cols-[1.02fr_1fr] gap-8 lg:gap-12 items-center w-full">

            {/* ── Left: headline + search ── */}
            <div className="text-center lg:text-left lg:pt-5">

              {/* Badge pill */}
              <div
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-4"
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
                  fontSize: "clamp(3.3rem, 5.05vw, 4.95rem)",
                  lineHeight: 0.98,
                  color: "var(--text-primary)",
                  marginBottom: "1rem",
                  letterSpacing: "-0.045em",
                }}
              >
                Trouvez votre<br />
                logement<br />
                fiable à<br />
                Conakry<br />
                <span style={{ color: "var(--accent-gold)" }}>sans commission</span>
              </h1>

              {/* Subtitle */}
              <p
                className="mb-5 text-center lg:text-left"
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "1.0625rem",
                  lineHeight: 1.65,
                  maxWidth: 560,
                  margin: "0 auto 1.25rem",
                }}
              >
                Une expérience claire pour chercher, comparer et contacter le bon propriétaire.
                Des annonces contrôlées, des quartiers lisibles et une prise de contact simple.
              </p>

              {/* Proof pills */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-5">
                {["Annonces contrôlées", "Appel ou WhatsApp", "Zéro frais caché"].map((label, i) => (
                  <span
                    key={label}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
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
                    {i === 0 && <ShieldCheck className="h-4 w-4" style={{ color: "var(--color-green)" }} />}
                    {i === 1 && <PhoneCall className="h-4 w-4" style={{ color: "var(--color-green)" }} />}
                    {i === 2 && <DollarSign className="h-4 w-4" style={{ color: "var(--color-green)" }} />}
                    {label}
                  </span>
                ))}
              </div>

              {/* Live counter badge — client component to avoid hydration mismatch */}
              <LiveCounterBadge initial={activeCountToday} />

              {/* Search bar */}
              <HeroSearch />
            </div>

            {/* ── Right: floating preview cards (desktop only) ── */}
            {heroPreview.length > 0 && (
              <div className="hidden lg:block relative" style={{ height: "610px" }}>
                <div
                  className="absolute right-0 top-4 h-[360px] w-[410px] overflow-hidden rounded-[30px]"
                  style={{ boxShadow: "0 30px 80px rgba(24,21,16,0.16)" }}
                >
                  {heroPreview[0]?.property_images?.[0]?.url ? (
                    <Image
                      src={heroPreview[0].property_images[0].url}
                      alt={heroPreview[0].title}
                      fill
                      className="object-cover"
                      sizes="410px"
                      quality={82}
                      priority
                    />
                  ) : (
                    <div className="h-full w-full bg-[var(--bg-secondary)]" />
                  )}
                </div>
                {/* Floating stat card — top-right of showcase */}
                <div
                  className="absolute"
                  style={{
                    top: 4,
                    right: 0,
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
                  <Zap className="h-5 w-5" style={{ color: "#214e3a" }} />
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 20, color: "#214e3a", lineHeight: 1.2, margin: 0 }}>Délai</p>
                    <p style={{ fontSize: 11, color: "#625a4b", marginTop: 2, margin: "2px 0 0" }}>de réponse rapide</p>
                  </div>
                </div>
                {heroPreview.map((p, i) => (
                  <PreviewCard key={p.id} property={p} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="hidden" />
      </section>

      {/* ═══════════════════════════════════════════════════════
          4. ANNONCES RÉCENTES
      ═══════════════════════════════════════════════════════ */}
      {recent.length > 0 && (
        <section className="min-h-[calc(100svh-72px)] py-16 md:py-20" style={{ background: "var(--bg-primary)" }}>
          <div className="max-w-[1180px] mx-auto px-5 md:px-0">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2
                  className="text-4xl md:text-[56px] font-black"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-display), sans-serif" }}
                >
                  Annonces récentes
                </h2>
              </div>
              <Link href="/annonces" className="flex items-center gap-1 text-sm font-semibold hover:underline" style={{ color: "var(--accent-gold)" }}>
                Voir tout <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {recent.slice(0, 3).map((p) => (
                <HomeListingCard key={p.id} property={p} />
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
          5. ACTIONS PRINCIPALES
      ═══════════════════════════════════════════════════════ */}
      <section
        className="min-h-[calc(100svh-72px)] flex items-center py-16 md:py-20"
        style={{ background: "var(--bg-secondary)" }}
      >
        <div className="grid w-full max-w-[1180px] mx-auto grid-cols-1 gap-4 px-5 md:grid-cols-2 md:px-0">
          <div className="rounded-[26px] p-8 md:p-10" style={{ background: "var(--color-green)", color: "#fff", boxShadow: "var(--shadow-soft)" }}>
            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
              <Search className="h-7 w-7" />
            </div>
            <h2 className="max-w-md text-4xl md:text-[42px] font-black leading-[0.98]" style={{ color: "#fff", fontFamily: "var(--font-display), serif" }}>
              Vous cherchez un logement ?
            </h2>
            <p className="mt-5 max-w-md text-base leading-7" style={{ color: "rgba(255,255,255,0.82)" }}>
              Publiez votre recherche en quelques minutes. Les propriétaires peuvent vous contacter directement.
            </p>
            <Link
              href="/je-cherche"
              className="mt-7 inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-extrabold"
              style={{ background: "var(--accent-gold)", color: "#181510" }}
            >
              Publier ma recherche
            </Link>
          </div>

          <div className="rounded-[26px] p-8 md:p-10" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-soft)" }}>
            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "var(--surface-soft)" }}>
              <Home className="h-7 w-7" style={{ color: "var(--accent-gold)" }} />
            </div>
            <h2 className="max-w-md text-4xl md:text-[42px] font-black leading-[0.98]" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display), serif" }}>
              Vous avez un bien à louer ?
            </h2>
            <p className="mt-5 max-w-md text-base leading-7" style={{ color: "var(--text-secondary)" }}>
              Déposez une annonce claire avec photos, quartier, prix et contact. Publication rapide, sans carte bancaire.
            </p>
            <Link
              href="/publier"
              className="mt-7 inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-extrabold"
              style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--color-green)" }}
            >
              Publier une annonce
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          7. SECTION CONFIANCE — 4 cartes
      ═══════════════════════════════════════════════════════ */}
      <section className="min-h-[calc(100svh-72px)] py-16 md:py-20" style={{ background: "var(--bg-primary)" }}>
        <div className="max-w-[1180px] mx-auto px-5 md:px-0">
          <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
            <div>
              <h2
                className="mb-7 text-4xl md:text-[56px] font-black leading-none"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-display), serif" }}
              >
                Pourquoi LogerBien ?
              </h2>
              <div className="relative min-h-[520px] overflow-hidden rounded-[28px] p-8 md:p-10" style={{ background: "var(--color-green)" }}>
                {heroPreview[1]?.property_images?.[0]?.url && (
                  <Image
                    src={heroPreview[1].property_images[0].url}
                    alt={heroPreview[1].title}
                    fill
                    className="object-cover opacity-35"
                    sizes="620px"
                    quality={80}
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(33,78,58,0.96),rgba(33,78,58,0.62))]" />
                <div className="relative z-10">
                  <span className="rounded-full bg-white/18 px-4 py-2 text-sm font-extrabold text-white">Pensé pour Conakry</span>
                  <h3 className="mt-10 max-w-lg font-sans text-4xl md:text-[54px] font-black leading-[0.98] text-white">
                    Moins d&apos;incertitude avant même de visiter.
                  </h3>
                  <p className="mt-6 max-w-xl text-base leading-7 text-white/82">
                    LogerBien met en avant les signaux utiles: annonce claire, quartier lisible,
                    contact direct et informations essentielles visibles avant l&apos;appel.
                  </p>
                  <div className="mt-16 grid grid-cols-3 gap-3">
                    {[
                      ["0", "commission cachée"],
                      ["24h", "réponse visée"],
                      ["4", "critères clés"],
                    ].map(([value, label]) => (
                      <div key={value} className="rounded-2xl border border-white/18 bg-white/16 p-4 backdrop-blur">
                        <p className="text-2xl font-black" style={{ color: "var(--accent-gold-light)" }}>{value}</p>
                        <p className="mt-1 text-xs font-extrabold text-white/85">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <p className="mb-8 max-w-md text-base leading-7" style={{ color: "var(--text-secondary)" }}>
                Une expérience pensée pour la réalité de la recherche immobilière à Conakry.
              </p>
              <div className="grid gap-3">
                {[
                  { icon: ShieldCheck, title: "Annonces vérifiées", desc: "Les informations importantes sont contrôlées avant mise en avant." },
                  { icon: Building2, title: "Propriétaires directs", desc: "Moins d'intermédiaires, plus de clarté dans la prise de contact." },
                  { icon: PhoneCall, title: "Contact rapide", desc: "Appel ou WhatsApp sans tunnel inutile ni formulaire interminable." },
                  { icon: Zap, title: "Recherche simple", desc: "Quartier, type, budget: l'essentiel visible dès le premier écran." },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4 rounded-[22px] p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: "var(--color-green-soft)" }}>
                      <item.icon className="h-6 w-6" style={{ color: "var(--color-green)" }} />
                    </div>
                    <div>
                      <h3 className="font-sans text-xl font-extrabold" style={{ color: "var(--text-primary)" }}>{item.title}</h3>
                      <p className="mt-1 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          9. PWA INSTALL SECTION
      ═══════════════════════════════════════════════════════ */}
      <section
        className="py-10"
        style={{ background: "var(--bg-card-light)", borderTop: "1px solid var(--border)" }}
      >
        <div className="max-w-xl mx-auto px-4 text-center">
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
