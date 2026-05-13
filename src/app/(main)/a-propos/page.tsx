import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { MapPin, Users, Shield, TrendingUp, ArrowRight } from "lucide-react";
import { StatsSection } from "./StatsSection";

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
    <div className="max-w-4xl mx-auto px-4 py-10 pb-24">
      <nav className="flex items-center gap-2 text-xs text-white/40 mb-8">
        <Link href="/" className="hover:text-white">Accueil</Link>
        <span>/</span>
        <span className="text-white/60">À propos</span>
      </nav>

      {/* Hero */}
      <div className="text-center mb-14">
        <div className="flex justify-center mb-4">
          <Logo size="lg" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white mb-4">
          L&apos;immobilier guinéen,<br />enfin accessible à tous
        </h1>
        <p className="text-white/50 max-w-xl mx-auto leading-relaxed">
          LogerBien est née d&apos;un constat simple : trouver un logement à Conakry était trop difficile, trop opaque et trop risqué. Nous avons changé ça.
        </p>
      </div>

      {/* Stats — chargées depuis Supabase */}
      <StatsSection />

      {/* Mission */}
      <div className="rounded-2xl p-8 mb-14" style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.20)" }}>
        <h2 className="text-xl font-black text-white mb-3">Notre mission</h2>
        <p className="text-white/60 leading-relaxed">
          Rendre la recherche de logement en Guinée transparente, rapide et sécurisée. Que vous cherchiez un studio à Dixinn ou une villa à Hamdallaye, LogerBien vous connecte directement aux propriétaires vérifiés — sans intermédiaires abusifs, sans frais cachés.
        </p>
      </div>

      {/* Values */}
      <h2 className="text-xl font-black text-white mb-6">Nos valeurs</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-14">
        {VALUES.map((v) => (
          <div key={v.title} className="rounded-2xl p-5 flex gap-4" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <div className="w-10 h-10 bg-[#F97316]/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <v.icon className="w-5 h-5 text-[#F97316]" />
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
        <div className="rounded-2xl p-6 text-center w-48" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
          <div className="w-14 h-14 bg-gradient-to-br from-[#CE1126] to-[#009460] rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto mb-3">
            D
          </div>
          <p className="font-bold text-white text-sm">Diallo Baïlo</p>
          <p className="text-white/40 text-xs mt-0.5">Fondateur &amp; CEO</p>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-[#009460] rounded-2xl p-8 text-center text-white">
        <h2 className="text-xl font-black mb-2">Rejoignez la communauté LogerBien</h2>
        <p className="text-white/80 mb-6 text-sm">Publiez votre bien ou trouvez votre logement dès maintenant.</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/annonces" className="flex items-center gap-2 bg-white text-[#009460] font-bold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors text-sm">
            Voir les annonces <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/publier" className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm border border-white/30">
            Publier mon bien
          </Link>
        </div>
      </div>
    </div>
  );
}
