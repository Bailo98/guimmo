import Link from "next/link";
import { Search, MapPin, Shield, Zap, MessageCircle, Star, TrendingUp, Home, ChevronRight, CheckCircle } from "lucide-react";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { MOCK_PROPERTIES } from "@/data/mock-properties";
import { POPULAR_NEIGHBORHOODS } from "@/data/neighborhoods";
import { SearchBar } from "@/components/search/SearchBar";
import { RecentlyViewedSection } from "@/components/ui/RecentlyViewedSection";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";

const TRUST_FEATURES = [
  {
    icon: Shield,
    title: "Annonces vérifiées",
    description: "Chaque annonce est vérifiée par notre équipe. Zéro faux logement.",
    color: "text-green-500",
    bg: "bg-green-50 dark:bg-green-900/20",
  },
  {
    icon: MessageCircle,
    title: "Contact WhatsApp direct",
    description: "Contactez le propriétaire directement sur WhatsApp en un clic.",
    color: "text-[#25D366]",
    bg: "bg-green-50 dark:bg-green-900/20",
  },
  {
    icon: Zap,
    title: "Résultats instantanés",
    description: "Trouvez votre logement en moins de 5 minutes. Ultra rapide.",
    color: "text-[#F97316]",
    bg: "bg-orange-50 dark:bg-orange-900/20",
  },
  {
    icon: Star,
    title: "Agents de confiance",
    description: "Agents et agences vérifiés avec badges de confiance visibles.",
    color: "text-yellow-500",
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
  },
];

const STATS = [
  { value: "2 400+", label: "Annonces actives" },
  { value: "850+", label: "Propriétaires vérifiés" },
  { value: "15 000+", label: "Utilisateurs actifs" },
  { value: "98%", label: "Taux de satisfaction" },
];

const POPULAR_NEIGHBORHOOD_CARDS = [
  { id: "kipe", name: "Kipé", avgPrice: "2 500 000 GNF/mois" },
  { id: "hamdallaye", name: "Hamdallaye", avgPrice: "1 800 000 GNF/mois" },
  { id: "dixinn", name: "Dixinn", avgPrice: "3 200 000 GNF/mois" },
  { id: "ratoma", name: "Ratoma", avgPrice: "1 500 000 GNF/mois" },
  { id: "taouyah", name: "Taouyah", avgPrice: "2 000 000 GNF/mois" },
  { id: "sonfonia", name: "Sonfonia", avgPrice: "1 200 000 GNF/mois" },
];

export default function HomePage() {
  const featuredProperties = MOCK_PROPERTIES.filter((p) => p.isBoosted || p.status === "active").slice(0, 4);
  const recentProperties = MOCK_PROPERTIES.filter((p) => p.status === "active").slice(0, 6);

  return (
    <div>
      {/* HERO */}
      <section className="relative bg-[#111418] dark:bg-[#111418] overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F97316] rounded-full blur-3xl opacity-10 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#16A34A] rounded-full blur-3xl opacity-10 translate-y-1/2 -translate-x-1/2" />

        <div className="relative max-w-5xl mx-auto px-4 py-16 md:py-24 text-center">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white/90 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-white/20">
            <CheckCircle className="w-3.5 h-3.5 text-green-400" />
            Plateforme N°1 de confiance en Guinée
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4">
            Trouvez votre{" "}
            <span className="text-[#F97316]">logement idéal</span>
            <br />
            en Guinée
          </h1>

          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Appartements, maisons, villas — louer ou acheter à Conakry et partout en Guinée. Simple, rapide, fiable.
          </p>

          {/* Search */}
          <SearchBar />

          {/* CTA banner */}
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

          {/* Quick links */}
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

      {/* STATS */}
      <section className="bg-[#F97316]">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            <div className="text-center">
              <p className="text-white font-black text-2xl md:text-3xl">
                <AnimatedCounter target={1247} suffix=" +" className="" />
              </p>
              <p className="text-white/80 text-xs md:text-sm">Annonces disponibles</p>
            </div>
            <div className="text-center">
              <p className="text-white font-black text-2xl md:text-3xl">
                <AnimatedCounter target={850} suffix=" +" />
              </p>
              <p className="text-white/80 text-xs md:text-sm">Propriétaires vérifiés</p>
            </div>
            <div className="text-center">
              <p className="text-white font-black text-2xl md:text-3xl">
                <AnimatedCounter target={15} suffix=" 000 +" />
              </p>
              <p className="text-white/80 text-xs md:text-sm">Utilisateurs actifs</p>
            </div>
            <div className="text-center">
              <p className="text-white font-black text-2xl md:text-3xl">
                <AnimatedCounter target={98} suffix=" %" />
              </p>
              <p className="text-white/80 text-xs md:text-sm">Taux de satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED PROPERTIES */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Annonces vedettes</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Sélectionnées pour vous</p>
          </div>
          <Link
            href="/annonces"
            className="flex items-center gap-1 text-[#F97316] text-sm font-semibold hover:underline"
          >
            Voir tout <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredProperties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      </section>

      {/* RECENTLY VIEWED */}
      <RecentlyViewedSection />

      {/* POPULAR NEIGHBORHOODS CARDS */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Quartiers populaires</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Prix moyens au mois à Conakry</p>
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

      {/* NEIGHBORHOODS */}
      <section className="bg-slate-50 dark:bg-[#1a1f2e] py-12">
        <div className="max-w-7xl mx-auto px-4">
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
        </div>
      </section>

      {/* RECENT PROPERTIES */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Annonces récentes</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Mises en ligne cette semaine</p>
          </div>
          <Link
            href="/annonces"
            className="flex items-center gap-1 text-[#F97316] text-sm font-semibold hover:underline"
          >
            Voir tout <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentProperties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      </section>

      {/* WHY LOGERBIEN */}
      <section className="bg-slate-50 dark:bg-[#1a1f2e] py-14">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">
              Pourquoi choisir{" "}
              <span className="text-[#F97316]">GuImmo</span> ?
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Si c&apos;est sur GuImmo, c&apos;est fiable.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TRUST_FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="flex items-start gap-4 bg-white dark:bg-[#1e2430] rounded-2xl p-5 border border-slate-100 dark:border-[#2a3040]"
                >
                  <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-6 h-6 ${f.color}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{f.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{f.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
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
              Publiez votre annonce en 2 minutes. 3 annonces gratuites pour commencer. Touchez des milliers de locataires potentiels.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/publier"
                className="inline-flex items-center justify-center gap-2 bg-[#F97316] hover:bg-[#EA6C0A] text-white font-bold px-8 py-4 rounded-2xl transition-colors shadow-[0_8px_32px_rgba(249,115,22,0.4)]"
              >
                <TrendingUp className="w-5 h-5" />
                Publier gratuitement
              </Link>
              <Link
                href="/tarifs"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-2xl transition-colors border border-white/20"
              >
                Voir les tarifs
              </Link>
            </div>
            <p className="text-white/40 text-xs mt-4">
              3 annonces gratuites • Sans carte bancaire • Résultat immédiat
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
