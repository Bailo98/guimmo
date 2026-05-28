import type { Metadata } from "next";
import Link from "next/link";
import { Star, Zap, Award, Heart, ArrowRight } from "lucide-react";
import { MOCK_PROPERTIES } from "@/data/mock-properties";
import { PropertyCard } from "@/components/ui/PropertyCard";

export const metadata: Metadata = {
  title: "Notre sélection | LogerBien",
  description:
    "Les meilleures annonces immobilières choisies par notre équipe éditoriale. Propriétés vérifiées, coups de cœur et logements d'exception à Conakry.",
};

function getSortedProperties() {
  return [...MOCK_PROPERTIES]
    .filter((p) => p.status === "active")
    .sort((a, b) => {
      if (a.is_boosted && !b.is_boosted) return -1;
      if (!a.is_boosted && b.is_boosted) return 1;
      return (b.views ?? 0) - (a.views ?? 0);
    });
}

export default function SelectionPage() {
  const sorted = getSortedProperties();
  const boosted = sorted.filter((p) => p.is_boosted);
  const regular = sorted.filter((p) => !p.is_boosted);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1117]">
      {/* Editorial hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-[#1e1008] text-white">
        {/* Decorative orb */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#E9E900]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#E9E900]/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 py-14 md:py-20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#E9E900]/20 border border-[#E9E900]/30 flex items-center justify-center">
              <Award className="w-5 h-5 text-[#E9E900]" />
            </div>
            <span className="text-[#E9E900] font-semibold text-sm uppercase tracking-widest">
              Sélection éditoriale
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Notre sélection
          </h1>
          <p className="text-slate-300 text-xl max-w-2xl mb-8 leading-relaxed">
            Les meilleures annonces choisies par notre équipe — vérifiées sur place,
            photographiées avec soin, et disponibles maintenant.
          </p>

          {/* Curation process */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="flex items-start gap-3 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-[#E9E900]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Star className="w-4 h-4 text-[#E9E900]" />
              </div>
              <div>
                <p className="font-semibold text-sm">Qualité garantie</p>
                <p className="text-slate-400 text-xs mt-0.5">
                  Chaque annonce est évaluée selon nos critères éditoriaux stricts.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Award className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <div>
                <p className="font-semibold text-sm">Vérifiées sur place</p>
                <p className="text-slate-400 text-xs mt-0.5">
                  Notre équipe visite les biens avant publication.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Heart className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <p className="font-semibold text-sm">Coups de cœur</p>
                <p className="text-slate-400 text-xs mt-0.5">
                  Les biens les plus appréciés par notre communauté.
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/annonces"
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white text-sm transition-colors"
          >
            Voir toutes les annonces
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Boosted / Coups de coeur section */}
        {boosted.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 bg-[#E9E900] text-white px-4 py-2 rounded-full font-bold text-sm">
                <Zap className="w-4 h-4" />
                ⭐ Coups de cœur
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {boosted.length} annonce{boosted.length > 1 ? "s" : ""} mise{boosted.length > 1 ? "s" : ""} en avant
              </p>
            </div>

            {/* Highlighted card strip */}
            <div className="relative mb-2">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#E9E900]/10 to-transparent pointer-events-none" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {boosted.map((property, index) => (
                  <div key={property.id} className="relative">
                    {/* Editorial badge */}
                    <div className="absolute -top-2.5 left-4 z-10">
                      <span className="inline-flex items-center gap-1 bg-[#E9E900] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
                        <Star className="w-2.5 h-2.5 fill-white" />
                        Coup de cœur
                      </span>
                    </div>
                    <PropertyCard property={property} index={index} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Regular listings */}
        {regular.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Sélection complète
              </h2>
              <span className="text-slate-400 text-sm">
                {regular.length} annonce{regular.length > 1 ? "s" : ""}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {regular.map((property, index) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  index={index + boosted.length}
                />
              ))}
            </div>
          </section>
        )}

        {sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-[#1e2430] flex items-center justify-center mb-5">
              <Star className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Aucune sélection disponible
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">
              Notre équipe travaille à sélectionner les meilleures annonces. Revenez bientôt !
            </p>
            <Link
              href="/annonces"
              className="inline-flex items-center gap-2 bg-[#E9E900] hover:bg-[#c4c400] text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              Toutes les annonces
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Bottom editorial note */}
        {sorted.length > 0 && (
          <div className="mt-12 bg-[#2c2f36] border border-[#1e2a30] rounded-2xl p-6 text-center">
            <p className="text-slate-400 dark:text-slate-500 text-sm max-w-lg mx-auto">
              Notre sélection est mise à jour chaque semaine par l&apos;équipe LogerBien. Seuls les biens
              ayant passé notre processus de vérification sont inclus.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
