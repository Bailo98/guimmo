import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, X, MessageCircle, ArrowRight, Zap, Star, Building2 } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Tarifs LogerBien — Plans et abonnements",
  description: "Découvrez nos plans gratuit, Pro et Agence. Publiez et boostez vos annonces immobilières en Guinée.",
};

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "224628000000";

const PLANS = [
  {
    id: "gratuit",
    icon: "🏠",
    name: "Gratuit",
    price: "0 GNF",
    period: "pour toujours",
    color: "#ffffff",
    borderColor: "rgba(255,255,255,0.12)",
    bg: "rgba(255,255,255,0.03)",
    cta: "Commencer gratuitement",
    ctaHref: "/inscription",
    ctaBg: "rgba(255,255,255,0.10)",
    ctaColor: "#ffffff",
    highlight: false,
    features: [
      { label: "5 annonces actives",              ok: true },
      { label: "Photos HD (10 max)",              ok: true },
      { label: "Contact WhatsApp direct",         ok: true },
      { label: "Profil vendeur",                  ok: true },
      { label: "Je cherche — demandes inversées", ok: true },
      { label: "Badge vérifié",                   ok: false },
      { label: "Statistiques avancées",           ok: false },
      { label: "Boost annonce (en vedette)",      ok: false },
      { label: "Annonces illimitées",             ok: false },
    ],
  },
  {
    id: "pro",
    icon: "⭐",
    name: "Pro",
    price: "50 000 GNF",
    period: "/ mois",
    color: "#D4AF37",
    borderColor: "rgba(212,175,55,0.40)",
    bg: "rgba(212,175,55,0.07)",
    cta: "Choisir le plan Pro",
    ctaHref: `https://wa.me/${WHATSAPP}?text=Bonjour%2C%20je%20souhaite%20souscrire%20au%20plan%20Pro%20LogerBien.`,
    ctaBg: "#D4AF37",
    ctaColor: "#0B0F19",
    highlight: true,
    badge: "⭐ Recommandé",
    features: [
      { label: "20 annonces actives",             ok: true },
      { label: "Photos HD (10 max)",              ok: true },
      { label: "Contact WhatsApp direct",         ok: true },
      { label: "Profil vendeur",                  ok: true },
      { label: "Je cherche — demandes inversées", ok: true },
      { label: "Badge vérifié ✅",                ok: true },
      { label: "Statistiques avancées",           ok: true },
      { label: "1 boost par mois inclus",         ok: true },
      { label: "Annonces illimitées",             ok: false },
    ],
  },
  {
    id: "agence",
    icon: "🏢",
    name: "Agence",
    price: "150 000 GNF",
    period: "/ mois",
    color: "#60a5fa",
    borderColor: "rgba(96,165,250,0.30)",
    bg: "rgba(96,165,250,0.06)",
    cta: "Choisir le plan Agence",
    ctaHref: `https://wa.me/${WHATSAPP}?text=Bonjour%2C%20je%20souhaite%20souscrire%20au%20plan%20Agence%20LogerBien.`,
    ctaBg: "#60a5fa",
    ctaColor: "#0A1216",
    highlight: false,
    features: [
      { label: "Annonces illimitées",             ok: true },
      { label: "Photos HD (10 max)",              ok: true },
      { label: "Contact WhatsApp direct",         ok: true },
      { label: "Profil agence premium",           ok: true },
      { label: "Je cherche — demandes inversées", ok: true },
      { label: "Tous les badges",                 ok: true },
      { label: "Statistiques avancées",           ok: true },
      { label: "Boost prioritaire (5/mois)",      ok: true },
      { label: "Priorité affichage",              ok: true },
    ],
  },
];

const FAQ = [
  {
    q: "Est-ce que le plan gratuit est vraiment gratuit ?",
    a: "Oui, 100 % gratuit. Aucune carte de crédit requise, aucun engagement. Vous pouvez publier jusqu'à 5 annonces actives gratuitement.",
  },
  {
    q: "Comment souscrire au plan Pro ou Agence ?",
    a: "Cliquez sur le bouton du plan souhaité pour nous contacter via WhatsApp. Notre équipe valide votre abonnement en moins de 24h.",
  },
  {
    q: "Qu'est-ce que le badge vérifié ?",
    a: "Le badge vérifié (✅) est attribué par notre équipe après vérification de votre identité et de vos annonces. Il rassure les locataires sur l'authenticité du propriétaire.",
  },
  {
    q: "Qu'est-ce qu'un boost ?",
    a: "Un boost place votre annonce en tête de liste dans les résultats et sur la page d'accueil avec le badge '⭐ En vedette', pendant 7 jours.",
  },
];

export default function TarifsPage() {
  return (
    <div style={{ background: "var(--bg-primary)" }}>
      <PageHero
        title="Plans & tarifs"
        subtitle="Choisissez la formule qui correspond à vos besoins. Commencez gratuitement, passez en Pro ou Agence quand vous êtes prêt."
        badge="✦ Tarifs"
        align="center"
      />

      <div className="max-w-5xl mx-auto px-4 py-12 pb-24">

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              style={{
                background: plan.bg,
                border: `1px solid ${plan.borderColor}`,
                borderRadius: 24,
                padding: 24,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                boxShadow: plan.highlight ? `0 8px 40px rgba(212,175,55,0.12)` : undefined,
              }}
            >
              {/* Recommended badge */}
              {plan.badge && (
                <div style={{
                  position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                  background: "#D4AF37", color: "#0B0F19",
                  fontSize: 11, fontWeight: 800, padding: "4px 14px", borderRadius: 20,
                  whiteSpace: "nowrap",
                }}>
                  {plan.badge}
                </div>
              )}

              {/* Header */}
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 32 }}>{plan.icon}</span>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: plan.color, marginTop: 8, marginBottom: 4 }}>
                  {plan.name}
                </h2>
                <div>
                  <span style={{ fontSize: 28, fontWeight: 900, color: "var(--text-primary)" }}>{plan.price}</span>
                  <span style={{ fontSize: 13, color: "var(--text-primary-faint)", marginLeft: 4 }}>{plan.period}</span>
                </div>
              </div>

              {/* Features */}
              <ul style={{ flex: 1, listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                {plan.features.map((f) => (
                  <li key={f.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {f.ok ? (
                      <CheckCircle style={{ width: 15, height: 15, color: plan.color, flexShrink: 0 }} />
                    ) : (
                      <X style={{ width: 15, height: 15, color: "rgba(255,255,255,0.20)", flexShrink: 0 }} />
                    )}
                    <span style={{
                      fontSize: 13, color: f.ok ? "var(--text-primary-dim)" : "rgba(255,255,255,0.30)",
                      textDecoration: f.ok ? "none" : "line-through",
                    }}>
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href={plan.ctaHref}
                target={plan.ctaHref.startsWith("https") ? "_blank" : undefined}
                rel={plan.ctaHref.startsWith("https") ? "noopener noreferrer" : undefined}
                className="hover:opacity-80 transition-opacity duration-200"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "13px 0", borderRadius: 14, border: "none",
                  background: plan.ctaBg, color: plan.ctaColor,
                  fontWeight: 700, fontSize: 14, textDecoration: "none",
                }}
              >
                {plan.cta}
                <ArrowRight style={{ width: 14, height: 14 }} />
              </a>
            </div>
          ))}
        </div>

        {/* Feature comparison note */}
        <div
          className="rounded-2xl p-6 mb-12 text-center"
          style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.18)" }}
        >
          <p style={{ color: "var(--text-primary-dim)", fontSize: 14, lineHeight: 1.7 }}>
            💡 <strong style={{ color: "var(--text-primary)" }}>Actuellement en phase de lancement</strong> — toutes les fonctionnalités sont disponibles gratuitement.
            Les plans Pro et Agence seront activés progressivement. Vous serez prévenus 30 jours avant.
          </p>
        </div>

        {/* FAQ */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginBottom: 20, textAlign: "center" }}>
            Questions fréquentes
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {FAQ.map((item) => (
              <div key={item.q} style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16, padding: "16px 20px",
              }}>
                <p style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 14, marginBottom: 6 }}>{item.q}</p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, lineHeight: 1.6 }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp CTA */}
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.20)" }}
        >
          <MessageCircle className="w-8 h-8 mx-auto mb-3" style={{ color: "#25D366" }} />
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>
            Une question sur les tarifs ?
          </h3>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, marginBottom: 20 }}>
            Notre équipe répond en moins d&apos;une heure sur WhatsApp.
          </p>
          <a
            href={`https://wa.me/${WHATSAPP}?text=Bonjour%20LogerBien%2C%20j%27ai%20une%20question%20sur%20les%20tarifs.`}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 24px", borderRadius: 14,
              background: "rgba(37,211,102,0.15)", border: "1px solid rgba(37,211,102,0.30)",
              color: "#25D366", fontWeight: 700, fontSize: 14, textDecoration: "none",
            }}
          >
            <MessageCircle style={{ width: 16, height: 16 }} />
            Nous contacter sur WhatsApp
          </a>
        </div>

      </div>
    </div>
  );
}
