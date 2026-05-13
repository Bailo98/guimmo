import Link from "next/link";
import { MapPin, Home, ChevronRight, CheckCircle } from "lucide-react";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { MOCK_PROPERTIES } from "@/data/mock-properties";
import { POPULAR_NEIGHBORHOODS } from "@/data/neighborhoods";
import { SearchBar } from "@/components/search/SearchBar";
import { RecentlyViewedSection } from "@/components/ui/RecentlyViewedSection";
import { NearbySection } from "@/components/ui/NearbySection";
import { createClient } from "@supabase/supabase-js";
import type { Property } from "@/types";

const POPULAR_NEIGHBORHOOD_CARDS = [
  { id: "kipe", name: "Kipé", avgPrice: "2 500 000 GNF/mois" },
  { id: "hamdallaye", name: "Hamdallaye", avgPrice: "1 800 000 GNF/mois" },
  { id: "dixinn", name: "Dixinn", avgPrice: "3 200 000 GNF/mois" },
  { id: "ratoma", name: "Ratoma", avgPrice: "1 500 000 GNF/mois" },
  { id: "taouyah", name: "Taouyah", avgPrice: "2 000 000 GNF/mois" },
  { id: "sonfonia", name: "Sonfonia", avgPrice: "1 200 000 GNF/mois" },
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
      id: img.id,
      url: img.url,
      alt: img.alt ?? "",
      isPrimary: img.is_primary ?? false,
    })),
    owner: {
      id: row.profiles?.id ?? row.owner_id ?? "unknown",
      name: row.profiles?.full_name ?? "Propriétaire",
      email: "",
      phone: row.contact_phone ?? row.profiles?.phone ?? "",
      whatsapp: row.contact_phone ?? row.profiles?.phone ?? "",
      role: row.profiles?.role ?? "owner",
      verified: row.profiles?.is_verified ?? false,
      badges: [],
      trustScore: 50,
      totalListings: 1,
      avgRating: 4.5,
      reviewCount: 0,
      createdAt: new Date(row.profiles?.created_at ?? Date.now()),
    },
    badges: [],
    views: row.views ?? 0,
    whatsappClicks: row.whatsapp_clicks ?? 0,
    isBoosted: row.is_boosted ?? false,
    boostExpiresAt: row.boost_expires_at ? new Date(row.boost_expires_at) : undefined,
    createdAt: new Date(row.created_at ?? Date.now()),
    updatedAt: new Date(row.updated_at ?? Date.now()),
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
      .select("*, property_images(*), profiles(*)")
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
  const featured = properties.filter((p) => p.isBoosted).slice(0, 4).length > 0
    ? properties.filter((p) => p.isBoosted).slice(0, 4)
    : properties.slice(0, 4);
  const recent = properties.filter((p) => !p.isBoosted).slice(0, 6).length >= 3
    ? properties.filter((p) => !p.isBoosted).slice(0, 6)
    : properties.slice(0, 6);

  return (
    <div>
      {/* HERO */}
      <section className="relative bg-[#111418] overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F97316] rounded-full blur-3xl opacity-10 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#16A34A] rounded-full blur-3xl opacity-10 translate-y-1/2 -translate-x-1/2" />

        <div className="relative max-w-5xl mx-auto px-4 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white/90 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-white/20">
            <CheckCircle className="w-3.5 h-3.5 text-green-400" />
            La plateforme N°1 de l&apos;immobilier en Guinée
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4">
            Trouvez votre logement à{" "}
            <span className="text-[#F97316]">Conakry</span>
            <br />
            en 5 minutes
          </h1>

          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Appartements, maisons, villas — louer ou acheter. Contactez le propriétaire directement sur WhatsApp.
          </p>

          <SearchBar />

          <div className="mt-6 rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)" }}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4">
              <p className="text-white font-semibold text-sm md:text-base text-center sm:text-left">
                Vous avez un bien à louer ou à vendre ? Publiez gratuitement en 2 minutes
              </p>
              <Link
                href="/publier"
                className="flex-none bg-white text-[#F97316] font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-orange-50 transition-colors whitespace-nowrap shadow-sm"
              >
                Publier maintenant
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            {POPULAR_NEIGHBORHOODS.slice(0, 6).map((n) => (
              <Link
                key={n.id}
                href={`/annonces?neighborhood=${n.id}`}
                className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-sm px-3 py-1.5 rounded-full transition-colors border border-white/10 hover:border-white/30"
              >
                <MapPin className="w-3 h-3" />
                {n.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PROPERTIES */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Annonces vedettes</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Sélectionnées pour vous</p>
            </div>
            <Link href="/annonces" className="flex items-center gap-1 text-[#F97316] text-sm font-semibold hover:underline">
              Voir tout <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featured.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </section>
      )}

      {/* NEARBY — géolocalisation, client-side */}
      <section className="max-w-7xl mx-auto px-4 pt-10">
        <NearbySection properties={properties} horizontal />
      </section>

      {/* RECENTLY VIEWED */}
      <RecentlyViewedSection />

      {/* POPULAR NEIGHBORHOODS */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Quartiers populaires</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Prix moyens à Conakry</p>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
          {POPULAR_NEIGHBORHOOD_CARDS.map((n) => (
            <Link
              key={n.id}
              href={`/annonces?neighborhood=${n.id}`}
              className="flex-none w-48 snap-start group bg-white dark:bg-[#1e2430] rounded-2xl p-5 border border-slate-100 dark:border-[#2a3040] hover:border-[#F97316] hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center mb-3 group-hover:bg-[#F97316] transition-colors">
                <MapPin className="w-5 h-5 text-[#F97316] group-hover:text-white transition-colors" />
              </div>
              <p className="font-bold text-slate-800 dark:text-white group-hover:text-[#F97316] transition-colors">{n.name}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-tight">{n.avgPrice}</p>
              <p className="text-xs font-semibold text-[#F97316] mt-2">Voir les biens &rarr;</p>
            </Link>
          ))}
        </div>
      </section>

      {/* RECENT PROPERTIES */}
      {recent.length > 0 && (
        <section className="bg-slate-50 dark:bg-[#1a1f2e] py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Annonces récentes</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Les dernières mises en ligne</p>
              </div>
              <Link href="/annonces" className="flex items-center gap-1 text-[#F97316] text-sm font-semibold hover:underline">
                Voir tout <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recent.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SEARCH BY NEIGHBORHOOD */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Chercher par quartier</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Les quartiers les plus demandés à Conakry</p>
          </div>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {POPULAR_NEIGHBORHOODS.map((n) => (
            <Link
              key={n.id}
              href={`/annonces?neighborhood=${n.id}`}
              className="group bg-white dark:bg-[#1e2430] rounded-2xl p-4 text-center hover:border-[#F97316] border border-slate-100 dark:border-[#2a3040] transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center mx-auto mb-2 group-hover:bg-[#F97316] transition-colors">
                <MapPin className="w-5 h-5 text-[#F97316] group-hover:text-white transition-colors" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-[#F97316] transition-colors">{n.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{n.commune}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA PUBLIER */}
      <section className="max-w-4xl mx-auto px-4 py-14">
        <div className="relative bg-[#111418] dark:bg-[#1e2430] rounded-3xl p-8 md:p-12 text-center overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#F97316] rounded-full blur-3xl opacity-10" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#16A34A] rounded-full blur-3xl opacity-10" />
          <div className="relative">
            <div className="w-16 h-16 bg-[#F97316]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Home className="w-8 h-8 text-[#F97316]" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
              Vous avez un logement à louer ou à vendre ?
            </h2>
            <p className="text-white/60 mb-6 max-w-lg mx-auto">
              Publiez votre annonce en 2 minutes. Touchez des milliers de locataires potentiels à Conakry.
            </p>
            <Link
              href="/publier"
              className="inline-flex items-center justify-center gap-2 bg-[#F97316] hover:bg-[#EA6C0A] text-white font-bold px-8 py-4 rounded-2xl transition-colors shadow-[0_8px_32px_rgba(249,115,22,0.4)]"
            >
              Publier gratuitement
            </Link>
            <p className="text-white/40 text-xs mt-4">Sans carte bancaire • Résultat immédiat</p>
          </div>
        </div>
      </section>
    </div>
  );
}
