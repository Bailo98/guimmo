import Link from "next/link";
import { Home, Search, ArrowLeft, MapPin, Building2 } from "lucide-react";

const SUGGESTIONS = [
  { href: "/annonces", label: "Toutes les annonces", icon: Search },
  { href: "/annonces?type=apartment&transactionType=rent", label: "Appartements à louer", icon: Building2 },
  { href: "/quartiers/kipe", label: "Logements à Kipé", icon: MapPin },
  { href: "/quartiers/hamdallaye", label: "Logements à Hamdallaye", icon: MapPin },
];

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#111418] flex flex-col items-center justify-center px-4 text-center">
      {/* Animated 404 */}
      <div className="relative mb-6">
        <div className="text-[9rem] font-black leading-none select-none">
          <span className="text-[var(--accent-gold)]">4</span>
          <span className="text-white/10">0</span>
          <span className="text-[var(--accent-gold)]">4</span>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-[var(--accent-gold)]/10 flex items-center justify-center border border-[var(--accent-gold)]/20">
            <Home className="w-8 h-8 text-[var(--accent-gold)]" />
          </div>
        </div>
      </div>

      <h1 className="text-2xl font-black text-white mb-2">Page introuvable</h1>
      <p className="text-slate-400 mb-8 max-w-sm leading-relaxed">
        Cette page n&apos;existe pas ou a été déplacée. Voici quelques liens utiles pour continuer votre recherche de logement.
      </p>

      {/* Primary actions */}
      <div className="flex flex-wrap gap-3 justify-center mb-10">
        <Link
          href="/"
          className="flex items-center gap-2 bg-[var(--accent-gold)] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#B8963A] transition-colors"
        >
          <Home className="w-4 h-4" /> Accueil
        </Link>
        <Link
          href="/annonces"
          className="flex items-center gap-2 bg-white/10 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-colors border border-white/20"
        >
          <Search className="w-4 h-4" /> Annonces
        </Link>
      </div>

      {/* Suggestions */}
      <div className="w-full max-w-md">
        <p className="text-slate-500 text-xs uppercase tracking-widest mb-3 font-semibold">Suggestions</p>
        <div className="space-y-2">
          {SUGGESTIONS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[var(--accent-gold)]/40 rounded-xl text-slate-300 hover:text-white transition-all group"
            >
              <Icon className="w-4 h-4 text-[var(--accent-gold)]" />
              <span className="text-sm font-medium flex-1 text-left">{label}</span>
              <ArrowLeft className="w-4 h-4 rotate-180 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--accent-gold)]" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
