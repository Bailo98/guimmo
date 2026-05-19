import type { Metadata } from "next";
import Link from "next/link";
import {
  FileText, AlertTriangle, TrendingDown, Scale,
  MapPin, ArrowRight, Home, ChevronRight,
} from "lucide-react";
import { POPULAR_NEIGHBORHOODS } from "@/data/neighborhoods";

export const metadata: Metadata = {
  title: "Guide location Conakry | LogerBien",
  description:
    "Guide complet pour bien louer en Guinée : documents à demander, red flags à éviter, droits du locataire, conseils de négociation et quartiers populaires de Conakry.",
};

const SECTIONS = [
  {
    id: "documents",
    icon: FileText,
    color: "#3b82f6",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    title: "Les documents à demander au propriétaire",
    items: [
      { label: "Titre foncier", desc: "Demandez à voir l'original du titre foncier. C'est la preuve légale de propriété en Guinée." },
      { label: "Factures eau & électricité récentes", desc: "Vérifiez que les factures sont au nom du propriétaire et qu'elles sont à jour." },
      { label: "Photo d'identité du propriétaire", desc: "Conservez une copie de la pièce d'identité (CNI, passeport) du bailleur." },
      { label: "Contrat de bail écrit", desc: "Exigez un contrat signé indiquant le loyer, la durée, les charges et la caution." },
    ],
  },
  {
    id: "red-flags",
    icon: AlertTriangle,
    color: "#ef4444",
    bg: "bg-red-50 dark:bg-red-900/20",
    title: "Les red flags à éviter",
    items: [
      { label: "Agences fantômes", desc: "Méfiez-vous des agences sans adresse physique vérifiable ou sans numéro RCCM." },
      { label: "Paiement avant visite", desc: "Ne versez jamais d'argent avant d'avoir visité le logement en personne." },
      { label: "Prix anormalement bas", desc: "Un loyer 30-40% en dessous du marché est souvent le signe d'une arnaque." },
      { label: "Pression pour signer vite", desc: "Un propriétaire sérieux vous laisse le temps de réfléchir et de vérifier." },
    ],
  },
  {
    id: "negociation",
    icon: TrendingDown,
    color: "#E9E900",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    title: "Négocier son loyer en Guinée",
    items: [
      { label: "Renseignez-vous sur le marché local", desc: "Comparez les prix du même quartier sur LogerBien avant de négocier." },
      { label: "Proposez de payer plusieurs mois d'avance", desc: "Offrir 3 à 6 mois d'avance peut vous permettre d'obtenir une réduction de 10-15%." },
      { label: "Signalez les défauts du logement", desc: "Humidité, peinture abimée, équipements défectueux — utilisez-les comme levier de négociation." },
      { label: "Négociez les charges incluses", desc: "Demandez si l'eau, le gardien ou le groupe électrogène peuvent être inclus dans le loyer." },
    ],
  },
  {
    id: "droits",
    icon: Scale,
    color: "#E9E900",
    bg: "bg-green-50 dark:bg-green-900/20",
    title: "Vos droits en tant que locataire",
    items: [
      { label: "Restitution de la caution", desc: "La caution doit vous être restituée dans les 30 jours suivant votre départ, déductions justifiées." },
      { label: "Préavis de résiliation", desc: "Un préavis d'au moins 1 mois est requis de chaque côté pour résilier un bail en bonne et due forme." },
      { label: "Réparations à la charge du propriétaire", desc: "Les grosses réparations (toiture, plomberie, électricité principale) sont à la charge du bailleur." },
      { label: "Augmentation de loyer", desc: "Toute augmentation de loyer doit être notifiée par écrit avec un préavis raisonnable." },
    ],
  },
];

export default function GuidePage() {
  const popularNeighborhoods = POPULAR_NEIGHBORHOODS.slice(0, 8);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-400 mb-8">
        <Link href="/" className="hover:text-[#E9E900] transition-colors flex items-center gap-1">
          <Home className="w-3.5 h-3.5" /> Accueil
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 dark:text-slate-300 font-medium">Guide location</span>
      </nav>

      {/* Hero */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 bg-[#E9E900]/10 text-[#E9E900] text-xs font-bold px-3 py-1.5 rounded-full mb-4">
          Guide complet
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4 leading-tight">
          Bien louer en Guinée :<br className="hidden sm:block" /> le guide complet
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl leading-relaxed">
          Documents à demander, arnaques à éviter, droits du locataire et conseils pratiques pour trouver votre logement en toute sécurité à Conakry.
        </p>
      </div>

      {/* Main sections */}
      <div className="space-y-10">
        {SECTIONS.map((section, sIdx) => {
          const Icon = section.icon;
          return (
            <section
              key={section.id}
              id={section.id}
              className={`rounded-3xl p-6 md:p-8 ${sIdx % 2 === 0 ? "bg-[#2c2f36] border border-[#1e2a30]" : "bg-[#2c2f36] border border-[#1e2a30]"}`}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-11 h-11 ${section.bg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5" style={{ color: section.color }} />
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">{section.title}</h2>
              </div>
              <ul className="space-y-4">
                {section.items.map((item) => (
                  <li key={item.label} className="flex gap-3">
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2"
                      style={{ background: section.color }}
                    />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{item.label}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        {/* Neighborhoods section */}
        <section id="quartiers" className="bg-[#2c2f36] rounded-3xl p-6 md:p-8 border border-[#1e2a30]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-purple-500" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Les quartiers les plus populaires</h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-5">
            Découvrez les annonces disponibles dans les quartiers les plus recherchés de Conakry.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {popularNeighborhoods.map((n) => (
              <Link
                key={n.id}
                href={`/annonces?neighborhood=${n.id}`}
                className="group flex flex-col items-center gap-2 p-3 rounded-2xl bg-[#2c2f36] border border-[#1e2a30] hover:border-[#E9E900] hover:bg-[#c4c400]/5 transition-all text-center"
              >
                <MapPin className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-[#E9E900] transition-colors" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-[#E9E900] transition-colors">{n.name}</span>
                <span className="text-[10px] text-slate-400">{n.commune}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* CTA */}
      <div className="mt-12 bg-[#111418] dark:bg-[#0d1014] rounded-3xl p-8 text-center">
        <h2 className="text-2xl font-black text-white mb-3">Prêt à trouver votre logement ?</h2>
        <p className="text-slate-400 mb-6 max-w-md mx-auto">
          Parcourez des centaines d&apos;annonces vérifiées à Conakry et trouvez votre prochain chez-vous en toute sécurité.
        </p>
        <Link
          href="/annonces"
          className="inline-flex items-center gap-2 bg-[#E9E900] text-white font-bold px-8 py-3.5 rounded-2xl hover:bg-[#c4c400] transition-colors"
        >
          Trouver mon logement sur LogerBien <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
