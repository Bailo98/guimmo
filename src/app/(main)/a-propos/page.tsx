import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { MapPin, Users, Shield, TrendingUp, ArrowRight } from "lucide-react";
import { StatsSection } from "./StatsSection";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "À propos de LogerBien",
  description: "Découvrez LogerBien, la plateforme immobilière de confiance en Guinée.",
};

const VALUES = [
  { icon: Shield, title: "Confiance", desc: "Chaque annonce est vérifiée par notre équipe avant publication." },
  { icon: MapPin, title: "Local d'abord", desc: "Conçu par des Guinéens, pour les Guinéens. Nous connaissons nos quartiers." },
  { icon: Users, title: "Communauté", desc: "Nous aidons les familles à trouver un toit sûr et abordable." },
  { icon: TrendingUp, title: "Croissance", desc: "Nous grandissons avec vous : propriétaires et locataires confondus." },
];

export default function AProposPage() {
  return (
    <div style={{ background: "var(--LogerBien-bg)" }}>
      <PageHero
        title="L'immobilier guinéen, enfin accessible"
        subtitle="LogerBien est née d'un constat simple : trouver un logement à Conakry était trop difficile, trop opaque et trop risqué. Nous avons changé ça."
        badge="✦ À propos de LogerBien"
        align="center"
      />
    <div className="max-w-4xl mx-auto px-4 py-10 pb-24">

      {/* Stats — chargées depuis Supabase */}
      <StatsSection />

      {/* Mission */}
      <div className="rounded-2xl p-8 mb-14" style={{ background: "rgba(200,144,30,0.08)", border: "1px solid rgba(200,144,30,0.20)" }}>
        <h2 className="text-xl font-black text-white mb-3">Notre mission</h2>
        <p className="text-white/60 leading-relaxed">
          Rendre la recherche de logement en Guinée transparente, rapide et sécurisée. Que vous cherchiez un studio à Dixinn ou une villa à Hamdallaye, LogerBien vous connecte directement aux propriétaires vérifiés — sans intermédiaires abusifs, sans frais cachés.
        </p>
      </div>

      {/* Values */}
      <h2 className="text-xl font-black text-white mb-6">Nos valeurs</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-14">
        {VALUES.map((v) => (
          <div key={v.title} className="rounded-2xl p-5 flex gap-4" style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", border: "1px solid rgba(255,255,255,0.10)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.10)" }}>
              <v.icon className="w-5 h-5 text-white/60" />
            </div>
            <div>
              <h3 className="font-bold text-white mb-1">{v.title}</h3>
              <p className="text-white/50 text-sm">{v.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Fondateur */}
      <h2 className="text-xl font-black text-white mb-6">L&apos;équipe</h2>
      <div className="flex justify-center mb-14">
        <div className="rounded-2xl p-6 text-center w-48" style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", border: "1px solid rgba(255,255,255,0.10)" }}>
          <div className="w-14 h-14 bg-gradient-to-br from-[#CE1126] to-[#009460] rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto mb-3">
            D
          </div>
          <p className="font-bold text-white text-sm">Diallo Baïlo</p>
          <p className="text-white/40 text-xs mt-0.5">Fondateur &amp; CEO</p>
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-2xl p-8 text-center text-white" style={{ background: "linear-gradient(135deg, var(--LogerBien-amber), #8a5e10)" }}>
        <h2 className="text-xl font-black mb-2">Rejoignez la communauté LogerBien</h2>
        <p className="text-white/80 mb-6 text-sm">Publiez votre bien ou trouvez votre logement dès maintenant.</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/annonces" className="flex items-center gap-2 bg-[#ffffff] text-[#0A1216] font-bold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors text-sm">
            Voir les annonces <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/publier" className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm border border-white/30">
            Publier mon bien
          </Link>
        </div>
      </div>
    </div>
    </div>
  );
}
