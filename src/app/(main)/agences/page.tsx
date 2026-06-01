import type { Metadata } from "next";
import Link from "next/link";
import { Phone, Star, CheckCircle2, Building2, Tag } from "lucide-react";

export const metadata: Metadata = {
  title: "Agences immobilières partenaires | LogerBien",
  description:
    "Découvrez nos agences immobilières partenaires à Conakry. Des professionnels vérifiés pour vous accompagner dans votre recherche de logement en Guinée.",
};

interface Agency {
  id: string;
  name: string;
  initials: string;
  specialties: string[];
  phone: string;
  address: string;
  listings: number;
  rating: number;
  verified: boolean;
  description: string;
}

const AGENCIES: Agency[] = [
  {
    id: "ag-001",
    name: "Conakry Prestige Immobilier",
    initials: "CP",
    specialties: ["Vente", "Location", "Gestion"],
    phone: "+224 622 111 222",
    address: "Kaloum, Conakry",
    listings: 24,
    rating: 4.8,
    verified: true,
    description: "Leader de l'immobilier de prestige à Conakry depuis 2010.",
  },
  {
    id: "ag-002",
    name: "Guinée Habitat",
    initials: "GH",
    specialties: ["Location", "Investissement"],
    phone: "+224 655 333 444",
    address: "Ratoma, Conakry",
    listings: 18,
    rating: 4.5,
    verified: true,
    description: "Spécialiste de la location résidentielle et professionnelle.",
  },
  {
    id: "ag-003",
    name: "Alpha Immobilier",
    initials: "AI",
    specialties: ["Vente", "Promotion"],
    phone: "+224 628 555 666",
    address: "Kipé, Conakry",
    listings: 31,
    rating: 4.7,
    verified: false,
    description: "Promoteur immobilier avec +15 ans d'expérience.",
  },
  {
    id: "ag-004",
    name: "Conakry Realty Group",
    initials: "CR",
    specialties: ["Location", "Vente", "Évaluation"],
    phone: "+224 664 777 888",
    address: "Dixinn, Conakry",
    listings: 12,
    rating: 4.3,
    verified: true,
    description: "Service personnalisé pour expatriés et entreprises.",
  },
  {
    id: "ag-005",
    name: "Delta Immobilier Guinée",
    initials: "DI",
    specialties: ["Terrain", "Construction", "Vente"],
    phone: "+224 621 999 000",
    address: "Hamdallaye, Conakry",
    listings: 8,
    rating: 4.6,
    verified: false,
    description: "Expert en vente de terrains et projets de construction.",
  },
];

// Rotating avatar background colors (orange shades + complementary)
const AVATAR_COLORS = [
  "bg-[var(--accent-gold)]",
  "bg-[#B8963A]",
  "bg-[var(--accent-gold)]",
  "bg-[#c2540a]",
  "bg-[#f59e0b]",
];

function StarRatingDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i < Math.floor(rating)
              ? "text-amber-400 fill-amber-400"
              : i < rating
              ? "text-amber-400 fill-amber-200"
              : "text-slate-300 dark:text-slate-600"
          }`}
        />
      ))}
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 ml-1">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

export default function AgencesPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[var(--bg-primary)]">
      {/* Page header */}
      <div className="bg-white dark:bg-[#1e2430] border-b border-slate-100 dark:border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 py-10 md:py-14">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-gold)]/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[var(--accent-gold)]" />
            </div>
            <span className="text-[var(--accent-gold)] font-semibold text-sm uppercase tracking-wider">
              Partenaires officiels
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3">
            Agences immobilières partenaires
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl">
            Des professionnels de confiance sélectionnés par LogerBien pour vous accompagner
            dans tous vos projets immobiliers à Conakry.
          </p>

          {/* Trust strip */}
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Agences vérifiées</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>Notées par les clients</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Phone className="w-4 h-4 text-[var(--accent-gold)]" />
              <span>Contact direct</span>
            </div>
          </div>
        </div>
      </div>

      {/* Agency grid */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {AGENCIES.map((agency, index) => (
            <div
              key={agency.id}
              className="bg-white dark:bg-[#1e2430] rounded-2xl border border-slate-100 dark:border-[var(--border)] overflow-hidden hover:shadow-xl transition-shadow duration-200 flex flex-col"
            >
              {/* Card top */}
              <div className="p-5 flex-1">
                <div className="flex items-start gap-4 mb-4">
                  {/* Avatar */}
                  <div
                    className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-white font-bold text-lg ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}
                  >
                    {agency.initials}
                  </div>

                  {/* Name + badge */}
                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                      {agency.name}
                    </h2>
                    {agency.verified && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-[var(--accent-gold)] bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full mt-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Agence vérifiée
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4">
                  {agency.description}
                </p>

                {/* Specialties */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {agency.specialties.map((spec) => (
                    <span
                      key={spec}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-gold)] bg-[var(--accent-gold)]/10 px-2.5 py-1 rounded-full"
                    >
                      <Tag className="w-3 h-3" />
                      {spec}
                    </span>
                  ))}
                </div>

                {/* Stats row */}
                <div className="flex items-center justify-between py-3 border-t border-slate-100 dark:border-[var(--border)]">
                  <div className="text-center">
                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                      {agency.listings}
                    </p>
                    <p className="text-xs text-slate-400">annonces</p>
                  </div>
                  <div className="w-px h-8 bg-slate-100 dark:bg-[#2a3040]" />
                  <StarRatingDisplay rating={agency.rating} />
                  <div className="w-px h-8 bg-slate-100 dark:bg-[#2a3040]" />
                  <div className="text-right">
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
                      {agency.address}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card actions */}
              <div className="p-4 pt-0 flex gap-2">
                <a
                  href={`tel:${agency.phone.replace(/\s/g, "")}`}
                  className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] transition-colors flex-shrink-0"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {agency.phone}
                </a>
                <Link
                  href="/annonces"
                  className="flex-1 text-center text-xs font-bold py-2.5 px-3 rounded-xl bg-[var(--accent-gold)] hover:bg-[#B8963A] text-white transition-colors"
                >
                  Voir les annonces
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-14 text-center bg-white dark:bg-[#1e2430] rounded-2xl border border-slate-100 dark:border-[var(--border)] p-8">
          <Building2 className="w-10 h-10 text-[var(--accent-gold)] mx-auto mb-3" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Vous êtes une agence immobilière ?
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-5 max-w-md mx-auto">
            Rejoignez notre réseau de partenaires et bénéficiez d&apos;une visibilité
            accrue auprès de milliers de chercheurs de logements en Guinée.
          </p>
          <Link
            href="/publier"
            className="inline-flex items-center gap-2 bg-[var(--accent-gold)] hover:bg-[#B8963A] text-white font-bold px-7 py-3 rounded-xl transition-colors"
          >
            Devenir partenaire
          </Link>
        </div>
      </div>
    </div>
  );
}
