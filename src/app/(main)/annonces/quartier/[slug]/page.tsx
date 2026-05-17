import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { MapPin, ArrowLeft } from "lucide-react";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { NEIGHBORHOODS, getNeighborhoodName } from "@/data/neighborhoods";
import type { Metadata } from "next";
import type { Property } from "@/types";

const SLUGS = [
  "kipe", "hamdallaye", "dixinn", "ratoma", "taouyah", "sonfonia",
  "lambanyi", "kaloum", "matam", "madina", "cosa", "nongo",
];

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const hood = NEIGHBORHOODS.find((n) => n.id === slug);
  if (!hood) return { title: "Quartier introuvable — BienLoger" };
  const name = hood.name;
  return {
    title: `Appartements et maisons à louer à ${name} — BienLoger`,
    description: `Trouvez un appartement, une maison ou un studio à louer à ${name}, Conakry. Annonces vérifiées, contact direct avec les propriétaires.`,
    alternates: {
      canonical: `/annonces/quartier/${slug}`,
    },
    openGraph: {
      title: `Logements à ${name} — BienLoger`,
      description: `Appartements et maisons disponibles à ${name}, Conakry (Guinée). Louer ou acheter.`,
    },
  };
}

async function getProperties(slug: string): Promise<Property[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  const db = createClient(url, key);
  const { data } = await db
    .from("properties")
    .select("*, property_images(*)")
    .eq("neighborhood", slug)
    .eq("status", "active")
    .not("title", "is", null)
    .order("created_at", { ascending: false })
    .limit(24);
  return (data ?? []) as Property[];
}

export const revalidate = 3600;

export default async function QuartierPage({ params }: Props) {
  const { slug } = await params;
  if (!SLUGS.includes(slug)) notFound();

  const hood = NEIGHBORHOODS.find((n) => n.id === slug);
  const name = hood?.name ?? getNeighborhoodName(slug);
  const properties = await getProperties(slug);

  const avgPrice =
    properties.length > 0
      ? Math.round(properties.reduce((s, p) => s + p.price, 0) / properties.length)
      : null;

  const avgFormatted = avgPrice
    ? new Intl.NumberFormat("fr-GN", { maximumFractionDigits: 0 }).format(avgPrice)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-white/40 mb-6">
        <Link href="/" className="hover:text-white/70">Accueil</Link>
        <span>/</span>
        <Link href="/annonces" className="hover:text-white/70">Annonces</Link>
        <span>/</span>
        <span className="text-white/60">{name}</span>
      </nav>

      {/* Back */}
      <Link
        href="/annonces"
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Toutes les annonces
      </Link>

      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-[#daa84a] text-sm font-semibold mb-2">
          <MapPin className="w-4 h-4" />
          <span>{hood?.commune ?? "Conakry"}, Guinée</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white mb-3">
          Appartements et maisons à louer à {name}
        </h1>
        <p className="text-white/50 text-sm leading-relaxed max-w-2xl">
          Découvrez toutes les annonces immobilières disponibles à {name}. Appartements, maisons, studios et villas — contact direct avec les propriétaires, sans intermédiaire.
        </p>

        {/* Stats */}
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)" }}>
            {properties.length} annonce{properties.length !== 1 ? "s" : ""}
          </div>
          {avgFormatted && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
              style={{ background: "rgba(200,144,30,0.12)", border: "1px solid rgba(200,144,30,0.25)", color: "#daa84a" }}>
              Prix moyen : {avgFormatted} GNF
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      {properties.length === 0 ? (
        <div className="rounded-2xl p-12 text-center"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-5xl mb-4">🏠</p>
          <h2 className="text-lg font-bold text-white mb-2">Aucune annonce disponible à {name}</h2>
          <p className="text-white/40 text-sm mb-6">Revenez bientôt ou explorez d'autres quartiers.</p>
          <Link
            href="/annonces"
            className="inline-flex items-center gap-2 bg-[#c8901e] hover:bg-[#b87c18] text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            Voir toutes les annonces
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {properties.map((p, i) => (
            <PropertyCard key={p.id} property={p} index={i} />
          ))}
        </div>
      )}

      {/* Other quartiers */}
      <div className="mt-12 pt-8 border-t border-white/8">
        <h2 className="text-lg font-bold text-white mb-4">Autres quartiers</h2>
        <div className="flex flex-wrap gap-2">
          {SLUGS.filter((s) => s !== slug).map((s) => (
            <Link
              key={s}
              href={`/annonces/quartier/${s}`}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-colors"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.6)" }}
            >
              {getNeighborhoodName(s)}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
