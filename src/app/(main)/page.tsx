import Link from "next/link";
import { MapPin, ChevronRight } from "lucide-react";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { MOCK_PROPERTIES } from "@/data/mock-properties";
import { SearchBar } from "@/components/search/SearchBar";
import { RecentlyViewedSection } from "@/components/ui/RecentlyViewedSection";
import { NearbySection } from "@/components/ui/NearbySection";
import { createClient } from "@supabase/supabase-js";
import type { Property } from "@/types";

const CATEGORIES = [
  { id: "apartment", emoji: "🏢", label: "Appartement" },
  { id: "villa",     emoji: "🏡", label: "Villa" },
  { id: "studio",    emoji: "🏠", label: "Studio" },
  { id: "house",     emoji: "🏘️", label: "Maison" },
  { id: "office",    emoji: "🏗️", label: "Bureau" },
  { id: "land",      emoji: "🌿", label: "Terrain" },
  { id: "room",      emoji: "🛏️", label: "Chambre" },
];

const POPULAR_NEIGHBORHOODS = [
  { id: "kipe",       name: "Kipé",       avgPrice: "2 500 000 GNF/mois" },
  { id: "hamdallaye", name: "Hamdallaye", avgPrice: "1 800 000 GNF/mois" },
  { id: "dixinn",     name: "Dixinn",     avgPrice: "3 200 000 GNF/mois" },
  { id: "ratoma",     name: "Ratoma",     avgPrice: "1 500 000 GNF/mois" },
  { id: "taouyah",    name: "Taouyah",    avgPrice: "2 000 000 GNF/mois" },
  { id: "sonfonia",   name: "Sonfonia",   avgPrice: "1 200 000 GNF/mois" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): Property {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    type: row.type,
    transactionType: row.transaction_type,
    status: row.status ?? "active",
    price: row.price,
    pricePeriod: row.price_period ?? "month",
    surface: row.surface,
    rooms: row.rooms,
    bathrooms: row.bathrooms,
    furnished: row.furnished ?? false,
    availableNow: row.available_now ?? true,
    neighborhood: row.neighborhood,
    city: row.city ?? "Conakry",
    features: row.features ?? [],
    images: (row.property_images ?? []).map((img: { id: string; url: string; alt: string; is_primary: boolean }) => ({
      id: img.id, url: img.url, alt: img.alt ?? "", isPrimary: img.is_primary ?? false,
    })),
    owner: {
      id: row.owner_id ?? "unknown",
      name: row.contact_phone ? "Propriétaire" : "Propriétaire",
      email: "",
      phone: row.contact_phone ?? "",
      whatsapp: row.contact_phone ?? "",
      role: "owner",
      verified: false,
      badges: [],
      trustScore: 50,
      totalListings: 1,
      avgRating: 4.5,
      reviewCount: 0,
      createdAt: new Date(Date.now()),
    },
    badges: [],
    views: row.views ?? 0,
    whatsappClicks: row.whatsapp_clicks ?? 0,
    isBoosted: row.is_boosted ?? false,
    boostExpiresAt: row.boost_expires_at ? new Date(row.boost_expires_at) : undefined,
    createdAt: new Date(row.created_at ?? Date.now()),
    updatedAt: new Date(row.updated_at ?? Date.now()),
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
  };
}

async function fetchHomeProperties(): Promise<Property[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return MOCK_PROPERTIES;
  try {
    const db = createClient(url, key);
    const { data, error } = await db
      .from("properties")
      .select("*, property_images(*)")
      .eq("status", "active")
      .order("is_boosted", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(12);
    if (error || !data || data.length === 0) return MOCK_PROPERTIES;
    return data.map(mapRow);
  } catch {
    return MOCK_PROPERTIES;
  }
}

export default async function HomePage() {
  const properties = await fetchHomeProperties();
  const featured = properties.filter((p) => p.isBoosted).slice(0, 6).length > 0
    ? properties.filter((p) => p.isBoosted).slice(0, 6)
    : properties.slice(0, 6);
  const recent = properties.filter((p) => !p.isBoosted).slice(0, 6).length >= 3
    ? properties.filter((p) => !p.isBoosted).slice(0, 6)
    : properties.slice(0, 6);

  return (
    <div className="bg-[#FAFAF8]">

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative bg-[#0f1219] overflow-hidden min-h-[480px] flex items-center">
        {/* Background texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Warm glow accents */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#F97316] rounded-full blur-[120px] opacity-[0.12] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#16A34A] rounded-full blur-[100px] opacity-[0.08] translate-y-1/2 -translate-x-1/3" />

        <div className="relative w-full max-w-5xl mx-auto px-4 py-20 md:py-28 text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white/80 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 border border-white/15">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            La plateforme N°1 de l&apos;immobilier en Guinée
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white leading-[1.1] tracking-tight mb-4">
            Trouvez votre logement<br />
            à <span className="text-[#F97316]">Conakry</span> en 5 min
          </h1>

          <p className="text-white/50 text-base md:text-lg max-w-xl mx-auto mb-10">
            Appartements, maisons, villas — louer ou acheter.<br className="hidden md:block" />
            Contactez le propriétaire directement sur WhatsApp.
          </p>

          <SearchBar />

          {/* Publish CTA strip */}
          <div className="mt-6 rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)" }}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4">
              <p className="text-white font-semibold text-sm text-center sm:text-left">
                Vous avez un bien à louer ou vendre ? Publiez gratuitement en 2 minutes
              </p>
              <Link
                href="/publier"
                className="flex-none bg-white text-[#F97316] font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-orange-50 transition-colors whitespace-nowrap shadow-sm"
              >
                Publier maintenant
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 pt-10 pb-2">
        <h2 className="text-xl font-black text-[#1A1A1A] mb-4">Chercher par type</h2>
        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/annonces?type=${cat.id}`}
              className="flex-none flex items-center gap-2.5 bg-white border border-[#E5E7EB] rounded-2xl px-4 py-3 shadow-sm hover:border-[#F97316] hover:shadow-md snap-start transition-all group"
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className="text-sm font-semibold text-[#1A1A1A] group-hover:text-[#F97316] whitespace-nowrap transition-colors">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── ANNONCES VEDETTES ─────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-black text-[#1A1A1A]">Annonces vedettes</h2>
              <p className="text-[#6B7280] text-sm">Sélectionnées pour vous</p>
            </div>
            <Link href="/annonces" className="flex items-center gap-1 text-[#F97316] text-sm font-semibold hover:underline">
              Voir tout <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {/* Horizontal scroll on mobile, grid on desktop */}
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0">
            {featured.map((p, i) => (
              <div key={p.id} className="flex-none w-[280px] snap-start lg:w-auto">
                <PropertyCard property={p} index={i} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── PRÈS DE VOUS ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 pt-2 pb-4">
        <NearbySection properties={properties} horizontal />
      </section>

      {/* ── RÉCEMMENT VUS ─────────────────────────────────────────── */}
      <RecentlyViewedSection />

      {/* ── ANNONCES RÉCENTES ─────────────────────────────────────── */}
      {recent.length > 0 && (
        <section className="bg-white py-10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-2xl font-black text-[#1A1A1A]">Annonces récentes</h2>
                <p className="text-[#6B7280] text-sm">Les dernières mises en ligne</p>
              </div>
              <Link href="/annonces" className="flex items-center gap-1 text-[#F97316] text-sm font-semibold hover:underline">
                Voir tout <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {recent.map((p, i) => (
                <PropertyCard key={p.id} property={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── QUARTIERS POPULAIRES ─────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-5">
          <h2 className="text-2xl font-black text-[#1A1A1A]">Quartiers populaires</h2>
          <p className="text-[#6B7280] text-sm">Prix moyens à Conakry</p>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory">
          {POPULAR_NEIGHBORHOODS.map((n) => (
            <Link
              key={n.id}
              href={`/annonces?neighborhood=${n.id}`}
              className="flex-none w-44 snap-start group bg-white rounded-2xl p-5 border border-[#E5E7EB] hover:border-[#F97316] hover:shadow-md hover:-translate-y-0.5 transition-all shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-3 group-hover:bg-[#F97316] transition-colors">
                <MapPin className="w-5 h-5 text-[#F97316] group-hover:text-white transition-colors" />
              </div>
              <p className="font-bold text-[#1A1A1A] group-hover:text-[#F97316] transition-colors text-sm">{n.name}</p>
              <p className="text-xs text-[#6B7280] mt-1 leading-tight">{n.avgPrice}</p>
              <p className="text-xs font-semibold text-[#F97316] mt-2">Voir les biens →</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── CTA PUBLIER ───────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 py-14">
        <div className="relative bg-[#0f1219] rounded-3xl p-8 md:p-12 text-center overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#F97316] rounded-full blur-3xl opacity-10" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#16A34A] rounded-full blur-3xl opacity-10" />
          <div className="relative">
            <p className="text-5xl mb-4">🏠</p>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
              Vous avez un logement à louer ou à vendre ?
            </h2>
            <p className="text-white/50 mb-8 max-w-lg mx-auto text-sm">
              Publiez votre annonce en 2 minutes. Touchez des milliers de locataires potentiels à Conakry.
            </p>
            <Link
              href="/publier"
              className="inline-flex items-center justify-center gap-2 bg-[#F97316] hover:bg-[#EA6C0A] text-white font-bold px-8 py-4 rounded-2xl transition-colors shadow-[0_8px_32px_rgba(249,115,22,0.4)]"
            >
              Publier gratuitement
            </Link>
            <p className="text-white/30 text-xs mt-4">Sans carte bancaire • Résultat immédiat</p>
          </div>
        </div>
      </section>
    </div>
  );
}
