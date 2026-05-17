import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, ArrowRight, MessageCircle } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Tarifs BienLoger — 100% gratuit pendant le lancement",
  description: "BienLoger est entièrement gratuit pendant la phase de lancement. Publiez vos annonces, contactez des propriétaires, trouvez votre logement — sans frais.",
};

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "224628000000";

const CARD = {
  background: "rgba(255,255,255,0.05)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.10)",
};

const FREE_FEATURES = [
  "Publication d'annonces illimitée",
  "Photos HD — jusqu'à 10 par annonce",
  "Contact direct propriétaire via WhatsApp",
  "Recherche avancée par quartier, budget, type",
  "Favoris et alertes de prix",
  "Messagerie intégrée",
  "Profil vendeur vérifié",
  "Visibilité complète sur la plateforme",
];

const FAQ = [
  {
    q: "Est-ce vraiment gratuit ?",
    a: "Oui, 100 % gratuit pendant toute la phase de lancement. Aucune carte de crédit requise, aucun engagement.",
  },
  {
    q: "Combien de temps dure le lancement ?",
    a: "Nous ne fixons pas de date de fin. Vous serez prévenus par email et WhatsApp au moins 30 jours avant tout changement de tarif.",
  },
  {
    q: "Combien d'annonces puis-je publier ?",
    a: "Autant que vous voulez pendant le lancement. Propriétaires particuliers comme agences immobilières.",
  },
  {
    q: "Y aura-t-il des options payantes à l'avenir ?",
    a: "Des options premium optionnelles (mise en avant, badge vérifié) sont envisagées. Le plan gratuit restera toujours disponible.",
  },
];

export default function TarifsPage() {
  return (
    <div style={{ background: "var(--BienLoger-bg)" }}>
      <PageHero
        title="100 % gratuit pendant le lancement"
        subtitle="BienLoger est en phase de lancement. Toutes les fonctionnalités sont offertes — propriétaires, locataires, agences."
        badge="✦ Tarifs"
        align="center"
      />

      <div className="max-w-3xl mx-auto px-4 py-12 pb-24 space-y-16">

        {/* Hero free card */}
        <div
          className="rounded-3xl p-8 md:p-12 text-center relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(200,144,30,0.18) 0%, rgba(34,197,94,0.12) 100%)", border: "1px solid rgba(200,144,30,0.30)" }}
        >
          <div className="text-6xl mb-4">🎉</div>
          <div className="inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4" style={{ background: "rgba(200,144,30,0.20)", border: "1px solid rgba(200,144,30,0.35)", color: "var(--BienLoger-amber-light)" }}>
            Offre de lancement
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-3">0 GNF</h2>
          <p className="text-white/60 mb-8 text-lg">Accès complet · Sans engagement · Sans carte bancaire</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-8 max-w-xl mx-auto">
            {FREE_FEATURES.map((f) => (
              <div key={f} className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--BienLoger-green, #22c55e)" }} />
                <span className="text-white/75 text-sm">{f}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/publier"
              className="inline-flex items-center justify-center gap-2 font-black px-8 py-3.5 rounded-2xl text-sm transition-all hover:opacity-90"
              style={{ background: "var(--BienLoger-amber)", color: "#fff", boxShadow: "0 4px 20px rgba(200,144,30,0.35)" }}
            >
              Publier une annonce gratuite <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/annonces"
              className="inline-flex items-center justify-center gap-2 font-semibold px-8 py-3.5 rounded-2xl text-sm transition-all hover:bg-white/10"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "var(--BienLoger-cream)" }}
            >
              Parcourir les annonces
            </Link>
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-xl font-black text-white mb-6 text-center">Questions fréquentes</h2>
          <div className="space-y-3">
            {FAQ.map((item) => (
              <div key={item.q} className="rounded-2xl p-5" style={CARD}>
                <p className="font-bold text-white text-sm mb-2">{item.q}</p>
                <p className="text-white/55 text-sm leading-relaxed">{item.a}</p>
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
          <h3 className="text-lg font-black text-white mb-2">Une question ?</h3>
          <p className="text-white/55 text-sm mb-5">Notre équipe répond en moins d'une heure.</p>
          <a
            href={`https://wa.me/${WHATSAPP}?text=Bonjour%20BienLoger%2C%20j%27ai%20une%20question%20sur%20les%20tarifs.`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-xl text-sm transition-colors"
            style={{ background: "rgba(37,211,102,0.15)", border: "1px solid rgba(37,211,102,0.30)", color: "#25D366" }}
          >
            <MessageCircle className="w-4 h-4" /> Nous contacter sur WhatsApp
          </a>
        </div>

      </div>
    </div>
  );
}
