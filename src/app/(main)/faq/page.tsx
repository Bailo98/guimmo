"use client";

import { useState } from "react";
import { ChevronDown, Search, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQ_SECTIONS = [
  {
    category: "Recherche & Filtres",
    questions: [
      {
        q: "Comment trouver une annonce dans mon quartier ?",
        a: "Utilisez les filtres de recherche sur /annonces : sélectionnez votre quartier dans le menu déroulant. Vous pouvez aussi utiliser la vue carte pour voir les annonces géolocalisées.",
      },
      {
        q: "Comment sont triées les annonces ?",
        a: "Par défaut, les annonces les plus récentes apparaissent en premier. Vous pouvez changer le tri (prix croissant/décroissant, popularité) dans les filtres avancés.",
      },
      {
        q: "Puis-je recevoir une alerte pour les nouvelles annonces ?",
        a: "Oui ! Utilisez le bouton 'Sauvegarder cette recherche' sur la page /annonces. Vous serez notifié des nouvelles annonces correspondant à vos critères.",
      },
    ],
  },
  {
    category: "Publication d'annonce",
    questions: [
      {
        q: "Est-ce gratuit de publier une annonce ?",
        a: "Oui, la publication de base est 100% gratuite et illimitée. Des options payantes (boost, mise en avant) sont disponibles pour augmenter la visibilité.",
      },
      {
        q: "Combien de temps avant que mon annonce soit visible ?",
        a: "Les annonces sont visibles immédiatement après publication. Notre équipe peut effectuer une vérification sous 24h pour les annonces boostées.",
      },
      {
        q: "Combien de photos puis-je ajouter ?",
        a: "Jusqu'à 10 photos par annonce (JPEG ou PNG, max 5 MB chacune). Les annonces avec photos reçoivent 5x plus de contacts.",
      },
    ],
  },
  {
    category: "Contact & Sécurité",
    questions: [
      {
        q: "Comment contacter un propriétaire ?",
        a: "Chaque annonce dispose de boutons 'Appeler' et 'WhatsApp' pour contacter directement l'annonceur. Ne communiquez jamais de données bancaires avant une visite.",
      },
      {
        q: "Comment signaler une annonce frauduleuse ?",
        a: "Cliquez sur 'Signaler' en bas de chaque fiche annonce. Notre équipe examine tous les signalements sous 24h.",
      },
      {
        q: "LogerBien demande-t-il un paiement ?",
        a: "Non. LogerBien ne perçoit jamais d'argent entre locataires et propriétaires. Méfiez-vous de toute demande de paiement avant visite.",
      },
    ],
  },
  {
    category: "Compte & Favoris",
    questions: [
      {
        q: "Comment sauvegarder des annonces ?",
        a: "Cliquez sur le cœur ❤️ sur n'importe quelle annonce pour l'ajouter à vos favoris. Retrouvez-les dans votre espace 'Favoris'.",
      },
      {
        q: "Mes favoris sont-ils sauvegardés ?",
        a: "Oui, vos favoris sont sauvegardés localement sur votre appareil. Créez un compte pour les synchroniser entre plusieurs appareils.",
      },
      {
        q: "Comment fonctionne le comparateur ?",
        a: "Cliquez sur l'icône ⚖️ sur jusqu'à 3 annonces, puis accédez à /comparer pour voir un tableau comparatif côte-à-côte.",
      },
    ],
  },
];

interface AccordionItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function AccordionItem({ question, answer, isOpen, onToggle }: AccordionItemProps) {
  return (
    <div className="border-b border-[var(--border)] last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-4 text-left"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-slate-800 dark:text-white text-sm md:text-base">
          {question}
        </span>
        <ChevronDown
          className={cn(
            "w-5 h-5 flex-shrink-0 text-[#D4AF37] transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-96 pb-4" : "max-h-0"
        )}
      >
        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  );
}

export default function FAQPage() {
  const [search, setSearch] = useState("");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filtered = FAQ_SECTIONS.map((section) => ({
    ...section,
    questions: section.questions.filter(
      (q) =>
        !search ||
        q.q.toLowerCase().includes(search.toLowerCase()) ||
        q.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((section) => section.questions.length > 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[var(--bg-primary)]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#D4AF37] via-[#B8963A] to-[#c2540a] text-white">
        <div className="max-w-3xl mx-auto px-4 py-16 md:py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-5">
            <HelpCircle className="w-4 h-4" />
            Aide &amp; Support
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Questions fréquentes
          </h1>
          <p className="text-white/80 text-lg mb-8">
            Trouvez rapidement la réponse à vos questions sur LogerBien.
          </p>

          {/* Search */}
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher une question..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-[var(--bg-card-light)] text-slate-800 dark:text-white placeholder-slate-400 border border-transparent focus:outline-none focus:ring-2 focus:ring-white/50 text-sm shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* FAQ content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <HelpCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400">
              Aucune question ne correspond à votre recherche.
            </p>
            <button
              onClick={() => setSearch("")}
              className="mt-4 text-[#D4AF37] text-sm font-semibold hover:underline"
            >
              Effacer la recherche
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {filtered.map((section) => (
              <div key={section.category}>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-[#D4AF37] rounded-full inline-block" />
                  {section.category}
                </h2>
                <div className="bg-[var(--bg-card-light)] rounded-2xl border border-[var(--border)] px-5 md:px-6">
                  {section.questions.map((q, qi) => {
                    const key = `${section.category}-${qi}`;
                    return (
                      <AccordionItem
                        key={key}
                        question={q.q}
                        answer={q.a}
                        isOpen={!!openItems[key]}
                        onToggle={() => toggleItem(key)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contact CTA */}
        <div className="mt-12 text-center p-8 bg-[var(--bg-card-light)] rounded-2xl border border-[var(--border)]">
          <h3 className="font-bold text-slate-900 dark:text-white mb-2">
            Vous n&apos;avez pas trouvé votre réponse ?
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-5">
            Notre équipe est disponible par WhatsApp pour vous aider.
          </p>
          <a
            href="https://wa.me/224628222510"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            Contacter le support
          </a>
        </div>
      </div>
    </div>
  );
}
