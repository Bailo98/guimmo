"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, Zap, Star, Building, ArrowRight, MessageCircle, X, ChevronDown } from "lucide-react";
import { PLANS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

const LISTING_PLANS = [
  {
    id: "boost_7",
    name: "Boost 7 jours",
    price: PLANS.boost_7.price,
    icon: "⚡",
    color: "orange",
    features: [
      "Annonce mise en avant 7 jours",
      "Badge 'Boosté' visible",
      "Position prioritaire dans les résultats",
      "Alertes aux utilisateurs correspondants",
    ],
  },
  {
    id: "boost_30",
    name: "Boost 30 jours",
    price: PLANS.boost_30.price,
    icon: "🚀",
    color: "orange",
    popular: true,
    features: [
      "Annonce mise en avant 30 jours",
      "Badge 'Boosté' visible",
      "Position prioritaire dans les résultats",
      "Alertes aux utilisateurs correspondants",
      "Statistiques détaillées",
    ],
  },
  {
    id: "listing_extra",
    name: "Annonce supplémentaire",
    price: PLANS.listing_extra.price,
    icon: "🏠",
    color: "blue",
    features: [
      "1 annonce supplémentaire",
      "Valable sans limite de temps",
      "Toutes les fonctionnalités standard",
    ],
  },
];

const SUBSCRIPTION_PLANS = [
  {
    id: "agent_monthly",
    name: "Agent Pro",
    price: PLANS.agent_monthly.price,
    period: "/ mois",
    icon: Star,
    color: "from-orange-500 to-orange-600",
    description: "Pour les agents immobiliers professionnels",
    features: [
      "Annonces illimitées",
      "Badge 'Agent vérifié'",
      "Profil public dédié",
      "Boosts inclus (2/mois)",
      "Statistiques avancées",
      "Support prioritaire",
    ],
  },
  {
    id: "agency_monthly",
    name: "Agence Premium",
    price: PLANS.agency_monthly.price,
    period: "/ mois",
    icon: Building,
    color: "from-purple-500 to-purple-600",
    description: "Pour les agences immobilières",
    features: [
      "Annonces illimitées",
      "Badge 'Agence vérifiée'",
      "Page agence dédiée",
      "Catalogue annonces",
      "Boosts inclus (5/mois)",
      "Analytics business",
      "Gestionnaire de compte dédié",
      "Support WhatsApp 24h",
    ],
  },
];

const COMPARISON_FEATURES = [
  { label: "Annonces gratuites", gratuit: "3", essentiel: "Illimité", pro: "Illimité" },
  { label: "Boost inclus", gratuit: "—", essentiel: "1/semaine", pro: "5/mois" },
  { label: "Badge vérifié", gratuit: false, essentiel: false, pro: true },
  { label: "Statistiques avancées", gratuit: false, essentiel: false, pro: true },
  { label: "Support prioritaire", gratuit: false, essentiel: false, pro: true },
  { label: "Profil public dédié", gratuit: false, essentiel: false, pro: true },
  { label: "Contact WhatsApp", gratuit: true, essentiel: true, pro: true },
  { label: "Favoris", gratuit: true, essentiel: true, pro: true },
];

const TESTIMONIALS = [
  {
    name: "Mamadou Bah",
    role: "Propriétaire à Kipé",
    quote: "Après avoir boosté mon appartement, j'ai reçu 3 fois plus d'appels en une semaine. L'investissement est rentabilisé en 2 jours !",
    avatar: "M",
    views: "+312% de vues",
  },
  {
    name: "Aïssatou Diallo",
    role: "Agent immobilier, Ratoma",
    quote: "Avec l'abonnement Pro, mes annonces sont toujours en première position. Mes clients me disent qu'ils me trouvent facilement sur GuImmo.",
    avatar: "A",
    views: "+180% de contacts",
  },
  {
    name: "Ibrahima Kouyaté",
    role: "Propriétaire à Hamdallaye",
    quote: "Simple et efficace. J'ai loué ma villa en 4 jours grâce au boost. Je n'avais jamais eu autant de visibilité avec les autres plateformes.",
    avatar: "I",
    views: "Loué en 4 jours",
  },
];

const FAQS = [
  {
    q: "Comment fonctionne le boost ?",
    a: "Le boost place votre annonce en tête des résultats de recherche pour la durée choisie (7 ou 30 jours). Elle bénéficie également d'un badge 'Boosté' visible et d'alertes envoyées aux utilisateurs correspondant à votre bien.",
  },
  {
    q: "Quels moyens de paiement ?",
    a: "Nous acceptons Orange Money, MTN Money, ainsi que les cartes Visa et Mastercard. Le paiement est sécurisé et instantané. Vous recevez un SMS de confirmation après chaque transaction.",
  },
  {
    q: "Puis-je booster plusieurs annonces ?",
    a: "Oui, vous pouvez booster autant d'annonces que vous le souhaitez. Chaque boost s'applique à une annonce spécifique. Les abonnements Pro incluent des boosts mensuels que vous pouvez répartir librement.",
  },
  {
    q: "Combien de temps dure le boost ?",
    a: "Le Boost 7 jours est actif pendant exactement 7 jours calendaires à partir de l'activation. Le Boost 30 jours court sur 30 jours. Vous pouvez renouveler à tout moment depuis votre espace compte.",
  },
  {
    q: "Comment mesurer les résultats ?",
    a: "Depuis votre espace Statistiques, vous voyez en temps réel le nombre de vues, de clics et de contacts WhatsApp générés par chaque annonce. Un graphique avant/après boost vous permet de mesurer l'impact directement.",
  },
];

function CheckCell({ value }: { value: boolean | string }) {
  if (value === true) return <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />;
  if (value === false) return <X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />;
  return <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{value}</span>;
}

export default function TarifsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 text-[#F97316] text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
          <Zap className="w-3.5 h-3.5" />
          Tarifs adaptés à la Guinée
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">
          Choisissez votre offre
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-3 max-w-xl mx-auto">
          Commencez gratuitement avec 3 annonces. Boostez votre visibilité avec nos offres payantes adaptées au marché guinéen.
        </p>
      </div>

      {/* Free plan */}
      <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-2xl p-6 mb-8 flex items-center gap-4">
        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">🎁</span>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-900 dark:text-white">Plan Gratuit — Pour commencer</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">3 annonces gratuites • Recherche illimitée • Contact WhatsApp • Favoris</p>
        </div>
        <Link href="/inscription" className="flex items-center gap-1.5 bg-green-500 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-green-600 transition-colors flex-shrink-0">
          Commencer <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Listing boosts */}
      <h2 className="text-xl font-black text-slate-900 dark:text-white mb-4">Booster une annonce</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {LISTING_PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-white dark:bg-[#1e2430] rounded-2xl p-6 border ${plan.popular ? "border-[#F97316] shadow-[0_4px_20px_rgba(249,115,22,0.2)]" : "border-slate-100 dark:border-[#2a3040]"}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F97316] text-white text-xs font-bold px-3 py-1 rounded-full">
                Le plus choisi
              </div>
            )}
            <div className="text-3xl mb-3">{plan.icon}</div>
            <h3 className="font-bold text-slate-900 dark:text-white">{plan.name}</h3>
            <p className="text-2xl font-black text-[#F97316] mt-2">{formatPrice(plan.price)}</p>
            <ul className="space-y-2 mt-4 mb-5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/compte/paiements"
              className={`flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${plan.popular ? "bg-[#F97316] text-white hover:bg-[#EA6C0A]" : "border-2 border-[#F97316] text-[#F97316] hover:bg-[#F97316] hover:text-white"}`}
            >
              Choisir <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ))}
      </div>

      {/* Subscriptions */}
      <h2 className="text-xl font-black text-slate-900 dark:text-white mb-4">Abonnements professionnels</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const Icon = plan.icon;
          return (
            <div key={plan.id} className="relative bg-white dark:bg-[#1e2430] rounded-2xl overflow-hidden border border-slate-100 dark:border-[#2a3040]">
              <div className={`bg-gradient-to-r ${plan.color} p-6 text-white`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg">{plan.name}</h3>
                    <p className="text-white/80 text-sm">{plan.description}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-black">{formatPrice(plan.price)}</span>
                  <span className="text-white/70 text-sm ml-1">{plan.period}</span>
                </div>
              </div>
              <div className="p-6">
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/compte/paiements"
                  className="flex items-center justify-center gap-1.5 w-full py-3 rounded-xl text-sm font-bold bg-[#F97316] text-white hover:bg-[#EA6C0A] transition-colors"
                >
                  S&apos;abonner maintenant <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison table */}
      <h2 className="text-xl font-black text-slate-900 dark:text-white mb-4">Comparer les offres</h2>
      <div className="bg-white dark:bg-[#1e2430] rounded-2xl border border-slate-100 dark:border-[#2a3040] overflow-hidden mb-10">
        <div className="grid grid-cols-4 bg-slate-50 dark:bg-[#151922] border-b border-slate-100 dark:border-[#2a3040]">
          <div className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Fonctionnalité</div>
          <div className="p-4 text-center">
            <p className="font-black text-sm text-slate-900 dark:text-white">Gratuit</p>
            <p className="text-xs text-slate-400 mt-0.5">0 GNF</p>
          </div>
          <div className="p-4 text-center bg-orange-50 dark:bg-orange-900/10">
            <p className="font-black text-sm text-[#F97316]">Essentiel</p>
            <p className="text-xs text-slate-400 mt-0.5">50 000 GNF/sem</p>
          </div>
          <div className="p-4 text-center">
            <p className="font-black text-sm text-slate-900 dark:text-white">Pro</p>
            <p className="text-xs text-slate-400 mt-0.5">150 000 GNF/mois</p>
          </div>
        </div>
        {COMPARISON_FEATURES.map((row, i) => (
          <div
            key={row.label}
            className={`grid grid-cols-4 border-b border-slate-50 dark:border-[#2a3040] last:border-0 ${i % 2 === 1 ? "bg-slate-50/50 dark:bg-[#151922]/50" : ""}`}
          >
            <div className="p-4 text-sm text-slate-600 dark:text-slate-300">{row.label}</div>
            <div className="p-4 text-center"><CheckCell value={row.gratuit} /></div>
            <div className="p-4 text-center bg-orange-50/40 dark:bg-orange-900/5"><CheckCell value={row.essentiel} /></div>
            <div className="p-4 text-center"><CheckCell value={row.pro} /></div>
          </div>
        ))}
      </div>

      {/* Testimonials */}
      <h2 className="text-xl font-black text-slate-900 dark:text-white mb-4">Ce que disent nos propriétaires</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {TESTIMONIALS.map((t) => (
          <div key={t.name} className="bg-white dark:bg-[#1e2430] rounded-2xl p-5 border border-slate-100 dark:border-[#2a3040]">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-lg flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #F97316, #EA6C0A)" }}
              >
                {t.avatar}
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">{t.name}</p>
                <p className="text-xs text-slate-400">{t.role}</p>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed italic mb-3">
              &ldquo;{t.quote}&rdquo;
            </p>
            <span className="inline-block text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full">
              {t.views}
            </span>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <h2 className="text-xl font-black text-slate-900 dark:text-white mb-4">Questions fréquentes</h2>
      <div className="space-y-2 mb-10">
        {FAQS.map((faq, i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#1e2430] rounded-2xl border border-slate-100 dark:border-[#2a3040] overflow-hidden"
          >
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full flex items-center justify-between p-5 text-left"
            >
              <span className="font-semibold text-slate-900 dark:text-white text-sm pr-4">{faq.q}</span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
              />
            </button>
            {openFaq === i && (
              <div className="px-5 pb-5">
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{faq.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Payment methods */}
      <div className="bg-slate-50 dark:bg-[#1a1f2e] rounded-2xl p-6 text-center">
        <p className="font-semibold text-slate-900 dark:text-white mb-3">Modes de paiement acceptés</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {["🟠 Orange Money", "🟡 MTN Money", "💳 Visa", "💳 Mastercard"].map((m) => (
            <span
              key={m}
              className="bg-white dark:bg-[#1e2430] text-slate-700 dark:text-slate-300 text-sm font-medium px-4 py-2 rounded-xl border border-slate-200 dark:border-[#2a3040]"
            >
              {m}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 mt-4">
          <MessageCircle className="w-4 h-4 text-[#25D366]" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Besoin d&apos;aide ? Contactez-nous sur{" "}
            <a href="https://wa.me/224620000000" className="text-[#25D366] font-semibold hover:underline">
              WhatsApp
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
