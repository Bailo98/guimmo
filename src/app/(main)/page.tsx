import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, ChevronRight } from "lucide-react";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { RecentlyViewedSection } from "@/components/ui/RecentlyViewedSection";
import { HeroSearch } from "@/components/home/HeroSearch";
import { MaisonDuJour } from "@/components/MaisonDuJour";
import { PWAInstallButton } from "@/components/home/PWAInstallButton";
import { formatPrice } from "@/lib/utils";
import { isPubliclyAvailable } from "@/lib/property-signals";
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
    return ((data ?? []) as Property[]).filter(isPubliclyAvailable);
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
    return ((data ?? []) as Property[]).filter(isPubliclyAvailable);
  } catch { return []; }
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

// ─── Discover preview ──────────────────────────────────────────────────────────

function DiscoverPreview({ property }: { property: Property | undefined }) {
  const primaryImg = property?.property_images?.find((i) => i.is_primary) ?? property?.property_images?.[0];
  const [gradFrom, gradTo] = TYPE_GRADIENTS[property?.type ?? "apartment"] ?? HERO_GRADIENTS[0];
  const priceStr = property ? formatPrice(property.price, "GNF", property.price_period) : "Découvre les annonces";

  return (
    <section className="py-8 md:py-10" style={{ background: "var(--bg-card-light)" }}>
      <div className="content-fluid grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.55fr)] gap-7 lg:gap-10 items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] mb-2" style={{ color: "var(--accent-gold)" }}>
            ❤️ Découvrir
          </p>
          <h2 className="text-3xl md:text-4xl font-black mb-3" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display), sans-serif" }}>
            Swipe les logements
          </h2>
          <p className="text-base md:text-lg max-w-xl mb-5" style={{ color: "var(--text-secondary)" }}>
            Découvre rapidement les annonces qui te correspondent.
          </p>
          <div className="grid grid-cols-3 gap-2 max-w-md mb-6">
            {["❌ Passer", "❤️ J’aime", "📞 Contacter"].map((label) => (
              <div
                key={label}
                className="rounded-2xl px-3 py-3 text-center text-xs font-bold"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              >
                {label}
              </div>
            ))}
          </div>
          <Link
            href="/decouvrir"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl px-6 text-sm font-black transition-opacity hover:opacity-90"
            style={{ background: "var(--accent-gold)", color: "var(--bg-primary)" }}
          >
            Commencer à découvrir
          </Link>
        </div>

        <Link href={property ? `/annonces/${property.id}` : "/decouvrir"} className="mx-auto block w-full max-w-[330px]">
          <div
            className="relative overflow-hidden rounded-[28px]"
            style={{
              aspectRatio: "0.72",
              background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})`,
              boxShadow: "0 22px 70px rgba(24,21,16,0.18)",
            }}
          >
            {primaryImg ? (
              <Image src={primaryImg.url} alt={property?.title ?? "Découvrir les logements"} fill className="object-cover" sizes="330px" quality={75} />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-7xl opacity-20">🏠</div>
            )}
            <div className="absolute inset-0" style={{ background: "linear-gradient(transparent 28%, rgba(0,0,0,0.88) 100%)" }} />
            <div className="absolute left-4 right-4 bottom-4">
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="rounded-full px-3 py-1 text-xs font-black" style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}>
                  {property?.transaction_type === "sale" ? "Achat" : "Location"}
                </span>
                {property?.is_verified && (
                  <span className="rounded-full px-3 py-1 text-xs font-black" style={{ background: "rgba(34,197,94,0.2)", color: "#fff" }}>
                    ✓ Vérifié
                  </span>
                )}
              </div>
              <p className="text-2xl font-black leading-tight text-white">{priceStr}</p>
              <p className="mt-1 line-clamp-2 text-sm font-bold text-white">{property?.title ?? "Swipe les logements disponibles"}</p>
              <p className="mt-1 text-sm text-white/75">📍 {property ? NL[property.neighborhood] ?? property.neighborhood : "Conakry"}</p>
            </div>
          </div>
        </Link>
      </div>
    </section>
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
  const [properties, urgentProps, neighborhoodCounts] = await Promise.all([
    fetchHomeProperties(),
    fetchUrgentProperties(),
    fetchNeighborhoodCounts(),
  ]);

  const discoverPreview = properties[0];
  const recent      = properties.slice(0, 6);
  const popularWithListings = POPULAR_NEIGHBORHOODS.filter((n) => (neighborhoodCounts[n.id] ?? 0) > 0);
  const popularSoon = POPULAR_NEIGHBORHOODS.filter((n) => (neighborhoodCounts[n.id] ?? 0) === 0);

  return (
    <>
      <section className="hero-section relative overflow-hidden py-7 sm:py-9 lg:py-10">
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

        <div className="content-fluid relative">
          <div className="mx-auto max-w-[900px] text-center">
            <p className="mb-3 text-sm font-bold" style={{ color: "var(--accent-gold)" }}>
              📍 Où cherches-tu ?
            </p>
            <h1
              className="mx-auto mb-4 max-w-[820px] text-[clamp(2.25rem,6.4vw,5.25rem)] font-black leading-[0.98]"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-manrope), sans-serif", letterSpacing: 0 }}
            >
              Où cherches-tu ton logement ?
            </h1>
            <p className="mx-auto mb-5 max-w-[680px] text-base md:text-lg leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Trouve un logement à Conakry sans démarcheur, sans commission et contacte directement le propriétaire.
            </p>

            <div className="mb-5 flex flex-wrap justify-center gap-2">
              {["Annonces contrôlées", "Appel ou WhatsApp", "Zéro frais caché"].map((label) => (
                <span
                  key={label}
                  className="rounded-full px-3 py-2 text-xs font-bold"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                >
                  {label}
                </span>
              ))}
            </div>

            <HeroSearch />
          </div>
        </div>
      </section>

      <DiscoverPreview property={discoverPreview} />

      {recent.length > 0 && (
        <section className="py-8 md:py-10" style={{ background: "var(--bg-primary)" }}>
          <div className="content-fluid">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2
                  className="text-2xl md:text-3xl font-black"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-display), sans-serif" }}
                >
                  🔥 Annonces récentes
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

      <section className="py-9 md:py-11" style={{ background: "var(--bg-secondary)" }}>
        <div className="content-fluid text-center">
          <h2
            className="text-2xl md:text-4xl font-black mb-3"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-display), sans-serif" }}
          >
            Tu as un logement à louer ?
          </h2>
          <p className="mb-6 max-w-xl mx-auto text-base" style={{ color: "var(--text-secondary)" }}>
            Publie ton annonce en quelques minutes et reçois des contacts directement sur WhatsApp.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
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
        </div>
      </section>

      {urgentProps.length > 0 && (
        <section className="py-5" style={{ background: "var(--bg-primary)", borderBottom: "1px solid var(--border)" }}>
          <div className="content-fluid">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                ⚡ Disponibles maintenant
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(255,77,77,0.15)", color: "#ff6b6b" }}>
                {urgentProps.length} annonce{urgentProps.length > 1 ? "s" : ""}
              </span>
              <Link href="/annonces?recent=1" className="ml-auto text-xs font-semibold hover:underline" style={{ color: "var(--accent-gold)" }}>
                Voir toutes →
              </Link>
            </div>
            <div className="flex gap-3 pb-1 no-scrollbar" style={{ overflowX: "auto" }}>
              {urgentProps.map((p) => (
                <UrgencyCard key={p.id} property={p} />
              ))}
              <div className="flex-shrink-0 w-4" />
            </div>
          </div>
        </section>
      )}

      <div style={{ background: "var(--bg-primary)" }}>
        <MaisonDuJour />
      </div>

      <div style={{ background: "var(--bg-primary)" }}>
        <RecentlyViewedSection />
      </div>

      <section className="py-8 md:py-10" style={{ background: "var(--bg-card-light)" }}>
        <div className="content-fluid">
          <div className="mb-5 md:mb-6">
            <h2 className="text-2xl md:text-3xl font-black" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display), sans-serif" }}>
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
                  className="group rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5"
                  style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: "rgba(212,175,55,0.12)" }}>
                    <MapPin className="w-4 h-4" style={{ color: "var(--accent-gold)" }} />
                  </div>
                  <p className="font-bold text-sm mb-0.5" style={{ color: "var(--text-primary)" }}>{n.name}</p>
                  <p className="text-xs" style={{ color: count > 0 ? "#22c55e" : "var(--text-muted)" }}>
                    {count > 0 ? `${count} annonce${count > 1 ? "s" : ""}` : "Bientôt disponible"}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-8 md:py-10" style={{ background: "var(--bg-primary)" }}>
        <div className="content-fluid grid grid-cols-1 md:grid-cols-[0.65fr_1fr] gap-5 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-black" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display), sans-serif" }}>
              Pourquoi LogerBien ?
            </h2>
            <p className="mt-2 text-sm max-w-md" style={{ color: "#666" }}>
              Les essentiels pour chercher vite et contacter directement.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TRUST_ITEMS.map((item) => (
              <div key={item.title} className="rounded-2xl p-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                <span className="text-2xl block mb-2">{item.icon}</span>
                <h3 className="font-bold text-sm mb-1" style={{ color: "var(--text-primary)" }}>{item.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "#666" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="py-7"
        style={{ background: "var(--bg-card-light)", borderTop: "1px solid var(--border)" }}
      >
        <div className="content-fluid text-center">
          <div className="text-3xl mb-2">📱</div>
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
