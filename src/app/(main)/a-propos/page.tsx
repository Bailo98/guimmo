import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { MapPin, Users, Shield, TrendingUp, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "À propos de GuImmo",
  description: "Découvrez GuImmo, la plateforme immobilière de confiance en Guinée.",
};

const STATS = [
  { value: "1 200+", label: "Annonces actives" },
  { value: "350+", label: "Propriétaires" },
  { value: "12", label: "Quartiers couverts" },
  { value: "98%", label: "Satisfaction" },
];

const TEAM = [
  { name: "Aliou Barry", role: "Fondateur & CEO", avatar: "A" },
  { name: "Fatoumata Diallo", role: "Responsable Partenariats", avatar: "F" },
  { name: "Ibrahim Camara", role: "Directeur Technique", avatar: "I" },
  { name: "Mariama Bah", role: "Chargée de Communication", avatar: "M" },
];

const VALUES = [
  { icon: Shield, title: "Confiance", desc: "Chaque annonce est vérifiée par notre équipe avant publication." },
  { icon: MapPin, title: "Local d'abord", desc: "Conçu par des Guinéens, pour les Guinéens. Nous connaissons nos quartiers." },
  { icon: Users, title: "Communauté", desc: "Nous aidons les familles à trouver un toit sûr et abordable." },
  { icon: TrendingUp, title: "Croissance", desc: "Nous grandissons avec vous : propriétaires et locataires confondus." },
];

export default function AProposPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 pb-24">
      <nav className="flex items-center gap-2 text-xs text-slate-400 mb-8">
        <Link href="/" className="hover:text-[#009460]">Accueil</Link>
        <span>/</span>
        <span className="text-slate-600 dark:text-slate-300">À propos</span>
      </nav>

      {/* Hero */}
      <div className="text-center mb-14">
        <div className="flex justify-center mb-4">
          <Logo size="lg" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4">
          L&apos;immobilier guinéen,<br />enfin accessible à tous
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          GuImmo est née d&apos;un constat simple : trouver un logement à Conakry était trop difficile, trop opaque et trop risqué. Nous avons changé ça.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
        {STATS.map((s) => (
          <div key={s.label} className="bg-white dark:bg-[#1e2430] rounded-2xl p-5 border border-slate-100 dark:border-[#2a3040] text-center">
            <p className="text-2xl font-black text-[#009460]">{s.value}</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Mission */}
      <div className="bg-gradient-to-br from-[#CE1126]/10 via-[#FCD116]/10 to-[#009460]/10 rounded-2xl p-8 border border-[#009460]/20 mb-14">
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">Notre mission</h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          Rendre la recherche de logement en Guinée transparente, rapide et sécurisée. Que vous cherchiez un studio à Dixinn ou une villa à Hamdallaye, GuImmo vous connecte directement aux propriétaires vérifiés — sans intermédiaires abusifs, sans frais cachés.
        </p>
      </div>

      {/* Values */}
      <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6">Nos valeurs</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-14">
        {VALUES.map((v) => (
          <div key={v.title} className="bg-white dark:bg-[#1e2430] rounded-2xl p-5 border border-slate-100 dark:border-[#2a3040] flex gap-4">
            <div className="w-10 h-10 bg-[#009460]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <v.icon className="w-5 h-5 text-[#009460]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">{v.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{v.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Team */}
      <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6">L&apos;équipe</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
        {TEAM.map((m) => (
          <div key={m.name} className="bg-white dark:bg-[#1e2430] rounded-2xl p-4 border border-slate-100 dark:border-[#2a3040] text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-[#CE1126] to-[#009460] rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto mb-3">
              {m.avatar}
            </div>
            <p className="font-bold text-slate-900 dark:text-white text-sm">{m.name}</p>
            <p className="text-slate-400 text-xs mt-0.5">{m.role}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="bg-[#009460] rounded-2xl p-8 text-center text-white">
        <h2 className="text-xl font-black mb-2">Rejoignez la communauté GuImmo</h2>
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
