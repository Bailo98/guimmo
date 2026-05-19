import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { MOCK_PROPERTIES } from "@/data/mock-properties";
import { POPULAR_NEIGHBORHOODS } from "@/data/neighborhoods";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { formatPrice } from "@/lib/utils";
import { MapPin, Home, TrendingUp, Clock, ArrowLeft, Building2 } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = Array.from(new Set(MOCK_PROPERTIES.map((p) => p.neighborhood)));
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const neighborhood = POPULAR_NEIGHBORHOODS.find((n) => n.id === slug);
  const name = neighborhood?.name ?? slug;
  return {
    title: `Logements à ${name} | LogerBien`,
    description: `Découvrez toutes les annonces immobilières disponibles à ${name}, Conakry. Appartements, villas, studios à louer ou à vendre.`,
  };
}

export default async function QuartierPage({ params }: PageProps) {
  const { slug } = await params;

  const neighborhood = POPULAR_NEIGHBORHOODS.find((n) => n.id === slug);
  if (!neighborhood) notFound();

  const properties = MOCK_PROPERTIES.filter(
    (p) => p.neighborhood === slug && p.status === "active"
  );

  const availableNow = properties.filter((p) => p.available_now).length;
  const avgPrice =
    properties.length
      ? Math.round(properties.reduce((s, p) => s + p.price, 0) / properties.length)
      : 0;
  const rentCount = properties.filter((p) => p.transaction_type === "rent").length;
  const saleCount = properties.filter((p) => p.transaction_type === "sale").length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1117]">
      {/* Hero banner */}
      <div className="bg-gradient-to-br from-[#E9E900] via-[#c4c400] to-[#c2540a] text-white">
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
          <Link
            href="/annonces"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux annonces
          </Link>

          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <MapPin className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-sm font-medium uppercase tracking-wider mb-1">
                Quartier · {neighborhood.commune}
              </p>
              <h1 className="text-3xl md:text-4xl font-bold">{neighborhood.name}</h1>
              <p className="text-white/80 mt-2 text-base">
                Conakry, Guinée
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Home className="w-4 h-4 text-white/70" />
                <span className="text-white/70 text-xs font-medium uppercase tracking-wide">Annonces</span>
              </div>
              <p className="text-2xl font-bold">{properties.length}</p>
              <p className="text-white/60 text-xs mt-0.5">
                {rentCount} location · {saleCount} vente
              </p>
            </div>

            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-white/70" />
                <span className="text-white/70 text-xs font-medium uppercase tracking-wide">Prix moyen</span>
              </div>
              <p className="text-2xl font-bold">
                {avgPrice > 0 ? formatPrice(avgPrice) : "—"}
              </p>
              <p className="text-white/60 text-xs mt-0.5">par mois</p>
            </div>

            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-white/70" />
                <span className="text-white/70 text-xs font-medium uppercase tracking-wide">Disponibles</span>
              </div>
              <p className="text-2xl font-bold">{availableNow}</p>
              <p className="text-white/60 text-xs mt-0.5">maintenant</p>
            </div>

            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-white/70" />
                <span className="text-white/70 text-xs font-medium uppercase tracking-wide">Commune</span>
              </div>
              <p className="text-xl font-bold leading-tight">{neighborhood.commune}</p>
              <p className="text-white/60 text-xs mt-0.5">Conakry</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        {properties.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {properties.length} annonce{properties.length > 1 ? "s" : ""} à{" "}
                <span className="text-[#E9E900]">{neighborhood.name}</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {properties.map((property, index) => (
                <PropertyCard key={property.id} property={property} index={index} />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-[#1e2430] flex items-center justify-center mb-5">
              <Home className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Aucune annonce à {neighborhood.name}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">
              Il n&apos;y a pas encore d&apos;annonces actives dans ce quartier. Consultez toutes
              nos annonces disponibles à Conakry.
            </p>
            <Link
              href="/annonces"
              className="inline-flex items-center gap-2 bg-[#E9E900] hover:bg-[#c4c400] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voir toutes les annonces
            </Link>
          </div>
        )}

        {properties.length > 0 && (
          <div className="mt-10 text-center">
            <Link
              href="/annonces"
              className="inline-flex items-center gap-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#E9E900] hover:text-[#E9E900] font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voir toutes les annonces
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
