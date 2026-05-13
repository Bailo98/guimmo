"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, Zap, Star, Building, ArrowRight, MessageCircle, X, ChevronDown } from "lucide-react";
import { PLANS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { PageHero } from "@/components/ui/PageHero";

const LISTING_PLANS = [
  {
    id: "boost_7",
    name: "Boost 7 jours",
    price: PLANS.boost_7.price,
    icon: "⚡",
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
    gradientFrom: "#c8901e",
    gradientTo: "#8a5e10",
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
    gradientFrom: "#1a5c3a",
    gradientTo: "#0d3324",
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

// surface card style
const CARD: React.CSSProperties = {
  background: "var(--guimmo-surface)",
  border: "1px solid var(--guimmo-border)",
  borderRadius: "16px",
};

function CheckCell({ value }: { value: boolean | string }) {
  if (value === true) return <CheckCircle className="w-4 h-4 text-[#6ec97a] mx-auto" />;
  if (value === false) return <X className="w-4 h-4 text-white/20 mx-auto" />;
  return <span className="text-sm font-semibold" style={{ color: "var(--guimmo-cream)" }}>{value}</span>;
}

export default function TarifsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div style={{ background: "var(--guimmo-bg)" }}>
      <PageHero
        title="Tarifs & Offres"
        subtitle="Commencez gratuitement avec 3 annonces. Boostez votre visibilité avec nos offres adaptées au marché guinéen."
        badge="✦ Tarifs adaptés à la Guinée"
        align="center"
      />

      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Free plan */}
        <div className="rounded-2xl p-6 mb-8 flex items-center gap-4"
          style={{ background: "rgba(110,201,122,0.08)", border: "1px solid rgba(110,201,122,0.20)" }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(110,201,122,0.12)" }}>
            <span className="text-2xl">🎁</span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm" style={{ color: "var(--guimmo-cream)" }}>Plan Gratuit — Pour commencer</h3>
            <p className="text-sm mt-0.5" style={{ color: "var(--guimmo-cream-dim)" }}>3 annonces gratuites • Recherche illimitée • Contact WhatsApp • Favoris</p>
          </div>
          <Link href="/inscription"
            className="flex items-center gap-1.5 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors flex-shrink-0"
            style={{ background: "#6ec97a" }}
          >
            Commencer <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Listing boosts */}
        <h2 className="text-xl font-black mb-4" style={{ fontFamily: "var(--font-playfair), serif", color: "var(--guimmo-cream)" }}>
          Booster une annonce
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {LISTING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className="relative rounded-2xl p-6"
              style={plan.popular
                ? { background: "var(--guimmo-surface)", border: "1.5px solid var(--guimmo-amber)", boxShadow: "0 4px 24px rgba(200,144,30,0.18)" }
                : CARD}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-3 py-1 rounded-full"
                  style={{ background: "var(--guimmo-amber)" }}>
                  Le plus choisi
                </div>
              )}
              <div className="text-3xl mb-3">{plan.icon}</div>
              <h3 className="font-bold" style={{ color: "var(--guimmo-cream)" }}>{plan.name}</h3>
              <p className="text-2xl font-black mt-2"
                style={{ fontFamily: "var(--font-playfair), serif", color: "var(--guimmo-amber-light)" }}>
                {formatPrice(plan.price)}
              </p>
              <ul className="space-y-2 mt-4 mb-5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm" style={{ color: "var(--guimmo-cream-dim)" }}>
                    <CheckCircle className="w-4 h-4 text-[#6ec97a] flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/compte/paiements"
                className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-sm font-bold transition-colors text-white"
                style={plan.popular
                  ? { background: "var(--guimmo-amber)" }
                  : { border: "1.5px solid var(--guimmo-amber)", color: "var(--guimmo-amber-light)", background: "transparent" }}
              >
                Choisir <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>

        {/* Subscriptions */}
        <h2 className="text-xl font-black mb-4" style={{ fontFamily: "var(--font-playfair), serif", color: "var(--guimmo-cream)" }}>
          Abonnements professionnels
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const Icon = plan.icon;
            return (
              <div key={plan.id} className="relative rounded-2xl overflow-hidden" style={CARD}>
                <div className="p-6 text-white"
                  style={{ background: `linear-gradient(135deg, ${plan.gradientFrom}, ${plan.gradientTo})` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.20)" }}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg">{plan.name}</h3>
                      <p className="text-white/80 text-sm">{plan.description}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-black" style={{ fontFamily: "var(--font-playfair), serif" }}>
                      {formatPrice(plan.price)}
                    </span>
                    <span className="text-white/70 text-sm ml-1">{plan.period}</span>
                  </div>
                </div>
                <div className="p-6">
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm" style={{ color: "var(--guimmo-cream-dim)" }}>
                        <CheckCircle className="w-4 h-4 text-[#6ec97a] flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/compte/paiements"
                    className="flex items-center justify-center gap-1.5 w-full py-3 rounded-xl text-sm font-bold text-white transition-colors"
                    style={{ background: "var(--guimmo-amber)" }}
                  >
                    S&apos;abonner maintenant <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison table */}
        <h2 className="text-xl font-black mb-4" style={{ fontFamily: "var(--font-playfair), serif", color: "var(--guimmo-cream)" }}>
          Comparer les offres
        </h2>
        <div className="rounded-2xl overflow-hidden mb-10" style={CARD}>
          <div className="grid grid-cols-4" style={{ background: "var(--guimmo-bg-alt)", borderBottom: "1px solid var(--guimmo-border)" }}>
            <div className="p-4 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--guimmo-cream-dim)" }}>Fonctionnalité</div>
            <div className="p-4 text-center">
              <p className="font-black text-sm" style={{ color: "var(--guimmo-cream)" }}>Gratuit</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(240,230,204,0.40)" }}>0 GNF</p>
            </div>
            <div className="p-4 text-center" style={{ background: "rgba(200,144,30,0.10)" }}>
              <p className="font-black text-sm" style={{ color: "var(--guimmo-amber-light)" }}>Essentiel</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(240,230,204,0.40)" }}>50 000 GNF/sem</p>
            </div>
            <div className="p-4 text-center">
              <p className="font-black text-sm" style={{ color: "var(--guimmo-cream)" }}>Pro</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(240,230,204,0.40)" }}>150 000 GNF/mois</p>
            </div>
          </div>
          {COMPARISON_FEATURES.map((row, i) => (
            <div
              key={row.label}
              className="grid grid-cols-4"
              style={{ borderBottom: "1px solid var(--guimmo-border)", background: i % 2 === 1 ? "rgba(240,230,204,0.02)" : "transparent" }}
            >
              <div className="p-4 text-sm" style={{ color: "var(--guimmo-cream-dim)" }}>{row.label}</div>
              <div className="p-4 text-center"><CheckCell value={row.gratuit} /></div>
              <div className="p-4 text-center" style={{ background: "rgba(200,144,30,0.05)" }}><CheckCell value={row.essentiel} /></div>
              <div className="p-4 text-center"><CheckCell value={row.pro} /></div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <h2 className="text-xl font-black mb-4" style={{ fontFamily: "var(--font-playfair), serif", color: "var(--guimmo-cream)" }}>
          Ce que disent nos propriétaires
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="rounded-2xl p-5" style={CARD}>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-lg flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, var(--guimmo-amber), #8a5e10)` }}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: "var(--guimmo-cream)" }}>{t.name}</p>
                  <p className="text-xs" style={{ color: "rgba(240,230,204,0.50)" }}>{t.role}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed italic mb-3" style={{ color: "var(--guimmo-cream-dim)" }}>
                &ldquo;{t.quote}&rdquo;
              </p>
              <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: "rgba(110,201,122,0.15)", color: "#6ec97a" }}>
                {t.views}
              </span>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <h2 className="text-xl font-black mb-4" style={{ fontFamily: "var(--font-playfair), serif", color: "var(--guimmo-cream)" }}>
          Questions fréquentes
        </h2>
        <div className="space-y-2 mb-10">
          {FAQS.map((faq, i) => (
            <div key={i} className="rounded-2xl overflow-hidden" style={CARD}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="font-semibold text-sm pr-4" style={{ color: "var(--guimmo-cream)" }}>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                  style={{ color: "rgba(240,230,204,0.50)" }}
                />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5">
                  <p className="text-sm leading-relaxed" style={{ color: "var(--guimmo-cream-dim)" }}>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Payment methods */}
        <div className="rounded-2xl p-6 text-center" style={{ background: "var(--guimmo-bg-alt)", border: "1px solid var(--guimmo-border)" }}>
          <p className="font-semibold mb-3" style={{ color: "var(--guimmo-cream)" }}>Modes de paiement acceptés</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {["🟠 Orange Money", "🟡 MTN Money", "💳 Visa", "💳 Mastercard"].map((m) => (
              <span
                key={m}
                className="text-sm font-medium px-4 py-2 rounded-xl"
                style={{ background: "var(--guimmo-surface)", color: "var(--guimmo-cream-dim)", border: "1px solid var(--guimmo-border)" }}
              >
                {m}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 mt-4">
            <MessageCircle className="w-4 h-4 text-[#25D366]" />
            <p className="text-sm" style={{ color: "var(--guimmo-cream-dim)" }}>
              Besoin d&apos;aide ? Contactez-nous sur{" "}
              <a href="https://wa.me/224628222510" className="text-[#25D366] font-semibold hover:underline">
                WhatsApp
              </a>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
