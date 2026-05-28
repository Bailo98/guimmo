import Link from "next/link";
import Image from "next/image";
import { MapPin, ChevronRight, Bed, Square, CheckCircle2 } from "lucide-react";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { RecentlyViewedSection } from "@/components/ui/RecentlyViewedSection";
import { HeroSearch } from "@/components/home/HeroSearch";
import { MaisonDuJour } from "@/components/MaisonDuJour";
import { formatPrice } from "@/lib/utils";
import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";
import type { Property } from "@/types";

export const metadata: Metadata = {
  title: "LogerBien — Trouvez votre logement en Guinée",
  description:
    "Trouvez votre logement à Conakry sans arnaque. Appartements, maisons et villas vérifiés sur LogerBien.",
  openGraph: {
    title: "LogerBien — Trouvez votre logement en Guinée",
    description: "Trouvez votre logement à Conakry sans arnaque.",
    url: "https://logerbien.gn",
    siteName: "LogerBien",
  },
};

// ─── data ─────────────────────────────────────────────────────────────────────

const TYPE_GRADIENTS: Record<string, [string, string]> = {
  apartment: ["#1a252b", "#2a3d4a"],
  villa:     ["#1a252b", "#0A1216"],
  house:     ["#111a1f", "#1a252b"],
  studio:    ["#111a1f", "#1a252b"],
  room:      ["#1a252b", "#2a3a46"],
  land:      ["#0A1216", "#1a252b"],
  office:    ["#1a2e45", "#2a4a6b"],
  shop:      ["#1a1a2a", "#2a2a3a"],
};

const HERO_GRADIENTS: [string, string][] = [
  ["#1a252b", "#2a3d4a"],
  ["#111a1f", "#1a252b"],
  ["#0A1216", "#1a252b"],
];

const POPULAR_NEIGHBORHOODS = [
  { id: "kipe",       name: "Kipé",       avgPrice: "2.500.000 GNF/mois" },
  { id: "hamdallaye", name: "Hamdallaye", avgPrice: "1.800.000 GNF/mois" },
  { id: "dixinn",     name: "Dixinn",     avgPrice: "3.200.000 GNF/mois" },
  { id: "ratoma",     name: "Ratoma",     avgPrice: "1.500.000 GNF/mois" },
  { id: "taouyah",    name: "Taouyah",    avgPrice: "2.000.000 GNF/mois" },
  { id: "sonfonia",   name: "Sonfonia",   avgPrice: "1.200.000 GNF/mois" },
];

const WHY_LogerBien = [
  { icon: "🏠", title: "Annonces vérifiées",       desc: "Chaque bien est contrôlé avant publication pour garantir des informations fiables." },
  { icon: "💬", title: "Contact direct WhatsApp",  desc: "Contactez le propriétaire directement, sans intermédiaire ni commission cachée." },
  { icon: "🔍", title: "Recherche intelligente",   desc: "Filtrez par quartier, budget et type de bien pour trouver votre logement idéal." },
  { icon: "⚡", title: "Publication rapide",        desc: "Publiez votre annonce en 2 minutes et touchez des milliers de locataires potentiels." },
];

// ─── server data fetching ──────────────────────────────────────────────────────


async function fetchHomeProperties(): Promise<Property[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  try {
    const db = createClient(url, key);
    const { data, error } = await db
      .from("properties")
      .select("*, property_images(*)")
      .eq("status", "active")
      .order("is_boosted", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(12);
    if (error || !data) return [];
    return data as Property[];
  } catch {
    return [];
  }
}

// ─── hero preview card (decorative, uses real data) ───────────────────────────

const NEIGHBORHOOD_LABELS_HERO: Record<string, string> = {
  kipe: "Kipé", lambanyi: "Lambanyi", ratoma: "Ratoma", sonfonia: "Sonfonia",
  cosa: "Cosa", hamdallaye: "Hamdallaye", nongo: "Nongo", taouyah: "Taouyah",
  dixinn: "Dixinn", matam: "Matam", madina: "Madina", kaloum: "Kaloum",
};

interface PreviewCardProps {
  property: Property;
  index: number;
}

const CARD_POSITIONS = [
  { top: "0px",   right: "0px",  rotate: "2deg",    zIndex: 3, opacity: 1    },
  { top: "155px", right: "28px", rotate: "-1.2deg", zIndex: 2, opacity: 0.96 },
  { top: "295px", right: "54px", rotate: "1.8deg",  zIndex: 1, opacity: 0.88 },
];

function PreviewCard({ property, index }: PreviewCardProps) {
  const pos = CARD_POSITIONS[index];
  const primaryImg = property.property_images?.find((i) => i.is_primary) ?? property.property_images?.[0];
  const [gradFrom, gradTo] = TYPE_GRADIENTS[property.type] ?? HERO_GRADIENTS[index % 3];
  const neighborhoodLabel = NEIGHBORHOOD_LABELS_HERO[property.neighborhood] ?? property.neighborhood;
  const priceStr = property.price_period === "month"
    ? `${formatPrice(property.price)}/mois`
    : formatPrice(property.price);
  const badge = property.transaction_type === "rent" ? "Location" : "Vente";

  return (
    <div
      className="absolute w-[260px] rounded-2xl overflow-hidden transition-transform duration-300 hover:-translate-y-1"
      style={{
        top: pos.top, right: pos.right,
        transform: `rotate(${pos.rotate})`,
        zIndex: pos.zIndex, opacity: pos.opacity,
        background: "#ffffff",
        boxShadow: "0 8px 32px rgba(10,20,12,0.45)",
      }}
    >
      {/* Image */}
      <div className="relative h-36">
        {primaryImg ? (
          <Image src={primaryImg.url} alt={property.title} fill className="object-cover" sizes="260px" quality={65} loading="lazy" />
        ) : (
          <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})` }} />
        )}
        <div className="absolute inset-0 flex items-end p-3" style={{ background: primaryImg ? "linear-gradient(to top, rgba(0,0,0,0.55), transparent)" : "none" }}>
          <span
            className="text-[11px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(10,18,22,0.75)", color: "#ffffff" }}
          >
            {badge}
          </span>
        </div>
      </div>
      {/* Content */}
      <div className="p-3.5" style={{ color: "#0A1216" }}>
        <p className="font-bold text-sm leading-snug line-clamp-1">{property.title}</p>
        <div className="flex items-center gap-1 text-xs mt-1" style={{ color: "#666666" }}>
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span>{neighborhoodLabel}</span>
        </div>
        <p className="font-black text-sm mt-2" style={{ color: "#E9E900" }}>{priceStr}</p>
        <div className="flex items-center gap-3 mt-1.5 text-xs" style={{ color: "rgba(17,26,20,0.45)" }}>
          {(property.rooms ?? 0) > 0 && (
            <span className="flex items-center gap-1"><Bed className="w-3 h-3" />{property.rooms} ch.</span>
          )}
          {(property.surface ?? 0) > 0 && (
            <span className="flex items-center gap-1"><Square className="w-3 h-3" />{property.surface} m²</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── page ──────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const properties = await fetchHomeProperties();
  const heroPreview = properties.slice(0, 3);
  const featured = properties.filter((p) => p.is_boosted).slice(0, 6).length > 0
    ? properties.filter((p) => p.is_boosted).slice(0, 6)
    : properties.slice(0, 6);
  const recent = properties.filter((p) => !p.is_boosted).slice(0, 6).length >= 3
    ? properties.filter((p) => !p.is_boosted).slice(0, 6)
    : properties.slice(0, 6);

  return (
    <>
      {/* ══════════════════════════════════════════════════════════
          HERO — full viewport, custom gradient
      ══════════════════════════════════════════════════════════ */}
      <section
        className="relative min-h-[100svh] flex flex-col overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 85% 40%, rgba(233,233,0,0.07) 0%, transparent 60%), " +
            "radial-gradient(ellipse 50% 45% at 15% 80%, rgba(30,42,48,0.6) 0%, transparent 55%), " +
            "#0A1216",
        }}
      >
        {/* Grain/noise texture overlay */}
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
        <div className="relative flex-1 flex items-center w-full max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-12 lg:gap-20 items-center w-full">

            {/* ── Left column ── */}
            <div className="text-center lg:text-left">
              {/* Badge pill */}
              <div
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-8"
                style={{
                  background: "rgba(233,233,0,0.08)",
                  border: "1px solid rgba(233,233,0,0.25)",
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: "#E9E900", animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite" }} />
                <span className="text-sm font-medium" style={{ color: "#E9E900" }}>
                  Annonces vérifiées · Contact direct
                </span>
              </div>

              {/* Main title */}
              <h1
                style={{
                  fontFamily: "var(--font-display), sans-serif",
                  fontWeight: 800,
                  fontSize: "clamp(40px, 8vw, 96px)",
                  lineHeight: 0.95,
                  color: "#ffffff",
                  marginBottom: "1.5rem",
                  letterSpacing: "-0.02em",
                  textTransform: "uppercase",
                }}
              >
                Trouvez votre<br />
                logement{" "}
                <span style={{ color: "#E9E900" }}>idéal</span><br />
                en Guinée
              </h1>

              {/* Subtitle */}
              <p
                style={{
                  color: "#666666",
                  fontSize: "0.8125rem",
                  lineHeight: 1.7,
                  marginBottom: "2.5rem",
                  maxWidth: "500px",
                  margin: "0 auto 2.5rem",
                  fontFamily: "var(--font-space-grotesk), sans-serif",
                  fontWeight: 300,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                Appartements · Maisons · Villas
              </p>

              {/* Search box */}
              <HeroSearch />
            </div>

            {/* ── Right column — preview cards (desktop only, only if real data) ── */}
            {heroPreview.length > 0 && (
              <div className="hidden lg:block relative" style={{ height: "480px" }}>
                {heroPreview.map((p, i) => (
                  <PreviewCard key={p.id} property={p} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="relative pb-8 flex justify-center">
          <div
            className="w-6 h-9 rounded-full flex items-start justify-center pt-2"
            style={{ border: "2px solid rgba(233,233,0,0.20)" }}
          >
            <div
              className="w-1 h-2 rounded-full"
              style={{
                background: "rgba(247,242,230,0.45)",
                animation: "bounce 2s infinite",
              }}
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          MAISON DU JOUR
      ══════════════════════════════════════════════════════════ */}
      <div style={{ background: "#0A1216" }}>
        <MaisonDuJour />
      </div>

      {/* ══════════════════════════════════════════════════════════
          ANNONCES VEDETTES — dark forest bg
      ══════════════════════════════════════════════════════════ */}
      {featured.length > 0 && (
        <section style={{ background: "#0A1216" }} className="py-14">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2
                  className="text-2xl md:text-3xl font-black"
                  style={{ color: "#ffffff", fontFamily: "var(--font-display), sans-serif" }}
                >
                  Annonces vedettes
                </h2>
                <p className="mt-1 text-sm" style={{ color: "#666666" }}>
                  Sélectionnées pour vous
                </p>
              </div>
              <Link
                href="/annonces"
                className="flex items-center gap-1 text-sm font-semibold hover:underline"
                style={{ color: "#E9E900" }}
              >
                Voir tout <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featured.map((p, i) => (
                <PropertyCard key={p.id} property={p} index={i + 20} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          ANNONCES RÉCENTES — dark forest bg
      ══════════════════════════════════════════════════════════ */}
      {recent.length > 0 && (
        <section style={{ background: "#0A1216" }} className="py-14">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2
                  className="text-2xl md:text-3xl font-black"
                  style={{ color: "#ffffff", fontFamily: "var(--font-display), sans-serif" }}
                >
                  Annonces récentes
                </h2>
                <p className="mt-1 text-sm" style={{ color: "#666666" }}>
                  Les dernières mises en ligne
                </p>
              </div>
              <Link
                href="/annonces"
                className="flex items-center gap-1 text-sm font-semibold hover:underline"
                style={{ color: "#E9E900" }}
              >
                Voir tout <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {recent.map((p, i) => (
                <PropertyCard key={p.id} property={p} index={i + 20} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recently viewed */}
      <div style={{ background: "#0A1216" }}>
        <RecentlyViewedSection />
      </div>

      {/* ══════════════════════════════════════════════════════════
          QUARTIERS POPULAIRES — cream background
      ══════════════════════════════════════════════════════════ */}
      <section style={{ background: "#2c2f36" }} className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h2
              className="text-2xl md:text-3xl font-black"
              style={{ color: "#ffffff", fontFamily: "var(--font-display), sans-serif" }}
            >
              Quartiers populaires
            </h2>
            <p className="mt-1 text-sm" style={{ color: "#666666", fontFamily: "var(--font-dm-sans), sans-serif" }}>
              Prix moyens à Conakry
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {POPULAR_NEIGHBORHOODS.map((n) => (
              <Link
                key={n.id}
                href={`/annonces?neighborhood=${n.id}`}
                className="group rounded-2xl p-5 transition-all hover:-translate-y-0.5"
                style={{
                  background: "#1a252b",
                  border: "1px solid #1e2a30",
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-colors"
                  style={{ background: "rgba(233,233,0,0.12)" }}
                >
                  <MapPin className="w-4 h-4" style={{ color: "#E9E900" }} />
                </div>
                <p
                  className="font-bold text-sm"
                  style={{ color: "#ffffff" }}
                >
                  {n.name}
                </p>
                <p
                  className="text-xs mt-1 leading-tight"
                  style={{ color: "#666666" }}
                >
                  {n.avgPrice}
                </p>
                <p
                  className="text-xs font-semibold mt-2"
                  style={{ color: "#E9E900" }}
                >
                  Voir →
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          POURQUOI LogerBien — cream background
      ══════════════════════════════════════════════════════════ */}
      <section style={{ background: "#2c2f36" }} className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2
              className="text-2xl md:text-3xl font-black"
              style={{ color: "#ffffff", fontFamily: "var(--font-display), sans-serif" }}
            >
              Pourquoi choisir LogerBien ?
            </h2>
            <p
              className="mt-2 text-sm max-w-md mx-auto"
              style={{ color: "#666666", fontFamily: "var(--font-dm-sans), sans-serif" }}
            >
              La plateforme immobilière conçue pour la réalité guinéenne
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_LogerBien.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl p-6"
                style={{ background: "#1a252b", border: "1px solid #1e2a30" }}
              >
                <span className="text-3xl block mb-4">{item.icon}</span>
                <h3
                  className="font-bold text-base mb-2"
                  style={{ color: "#ffffff" }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "#666666", fontFamily: "var(--font-dm-sans), sans-serif" }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          CTA PUBLIER — dark gradient
      ══════════════════════════════════════════════════════════ */}
      <section
        className="py-20"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(233,233,0,0.12) 0%, transparent 60%), " +
            "#0A1216",
        }}
      >
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-5xl mb-6">🏠</p>
          <h2
            className="text-2xl md:text-4xl font-black mb-4"
            style={{ color: "#ffffff", fontFamily: "var(--font-display), sans-serif" }}
          >
            Vous avez un logement à louer ou à vendre ?
          </h2>
          <p
            className="mb-10 max-w-lg mx-auto text-base"
            style={{ color: "#666666", fontFamily: "var(--font-dm-sans), sans-serif" }}
          >
            Publiez votre annonce en 2 minutes. Touchez des milliers de locataires potentiels à Conakry.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/publier"
              className="inline-flex items-center gap-2 font-bold px-8 py-4 rounded-2xl transition-opacity hover:opacity-90 text-sm"
              style={{ background: "#E9E900", color: "#0A1216" }}
            >
              Publier gratuitement
            </Link>
            <div className="flex items-center gap-2 text-sm" style={{ color: "#666666" }}>
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
              Sans carte bancaire
              <span className="mx-1">·</span>
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
              Résultat immédiat
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
