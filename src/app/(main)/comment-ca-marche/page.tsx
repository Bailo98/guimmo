import Link from "next/link";
import { Search, MessageCircle, Home, Shield, CheckCircle, ArrowRight } from "lucide-react";

const STEPS_SEARCH = [
  { n: 1, icon: Search, title: "Cherchez un logement", desc: "Filtrez par quartier, prix, nombre de chambres. Résultats instantanés sans inscription." },
  { n: 2, icon: Shield, title: "Vérifiez la fiabilité", desc: "Regardez les badges GuImmo Safe : annonce vérifiée, propriétaire vérifié, photos réelles." },
  { n: 3, icon: MessageCircle, title: "Contactez sur WhatsApp", desc: "Un clic et vous êtes directement sur WhatsApp avec le propriétaire. Simple et rapide." },
  { n: 4, icon: Home, title: "Visitez et signez", desc: "Visitez le logement, négociez le prix, signez le contrat. GuImmo vous a mis en relation." },
];

const STEPS_PUBLISH = [
  { n: 1, title: "Créez un compte", desc: "Inscription gratuite en 2 minutes. Téléphone ou WhatsApp." },
  { n: 2, title: "Publiez votre annonce", desc: "3 annonces gratuites. Photos, description, prix — en 5 minutes." },
  { n: 3, title: "Recevez des contacts", desc: "Les locataires vous contactent directement sur WhatsApp." },
  { n: 4, title: "Louez rapidement", desc: "Gérez les visites et trouvez votre locataire en quelques jours." },
];

export default function CommentCaMarchePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-16">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">Comment ça marche ?</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-3 max-w-xl mx-auto">
          GuImmo connecte directement locataires et propriétaires en Guinée. Simple, rapide, sans intermédiaire.
        </p>
      </div>

      {/* For searchers */}
      <div>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[#E9E900] rounded-2xl flex items-center justify-center">
            <Search className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Je cherche un logement</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {STEPS_SEARCH.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.n} className="bg-[#2c2f36] rounded-2xl p-5 border border-[#1e2a30] flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-[#E9E900] rounded-2xl flex items-center justify-center text-white font-black">{s.n}</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4 text-[#E9E900]" />
                    <h3 className="font-bold text-slate-900 dark:text-white">{s.title}</h3>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 text-center">
          <Link href="/annonces" className="inline-flex items-center gap-2 bg-[#E9E900] text-white font-bold px-8 py-3.5 rounded-2xl hover:bg-[#c4c400] transition-colors">
            Chercher un logement <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* For publishers */}
      <div>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-green-500 rounded-2xl flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Je publie un logement</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {STEPS_PUBLISH.map((s) => (
            <div key={s.n} className="bg-[#2c2f36] rounded-2xl p-5 border border-[#1e2a30] flex gap-4">
              <div className="w-10 h-10 bg-green-500 rounded-2xl flex items-center justify-center text-white font-black flex-shrink-0">{s.n}</div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">{s.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link href="/publier" className="inline-flex items-center gap-2 bg-green-500 text-white font-bold px-8 py-3.5 rounded-2xl hover:bg-green-600 transition-colors">
            Publier gratuitement <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Guide link */}
      <div className="text-center">
        <Link href="/guide" className="inline-flex items-center gap-2 text-[#E9E900] font-semibold hover:underline">
          Lire notre guide complet → <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Documents à demander, red flags, droits du locataire et plus encore.</p>
      </div>

      {/* Trust section */}
      <div className="bg-[#111418] dark:bg-[#1e2430] rounded-3xl p-8 text-center">
        <Shield className="w-12 h-12 text-[#E9E900] mx-auto mb-4" />
        <h2 className="text-2xl font-black text-white mb-3">GuImmo Safe</h2>
        <p className="text-slate-400 max-w-lg mx-auto mb-6">Notre équipe vérifie chaque annonce avant publication. Badges de confiance, signalement d&apos;arnaques, modération active.</p>
        <div className="flex flex-wrap gap-3 justify-center">
          {["Annonces vérifiées", "Propriétaires vérifiés", "Photos réelles", "Anti-arnaque", "Signalement 24h"].map((f) => (
            <span key={f} className="flex items-center gap-1.5 bg-white/10 text-white text-sm px-3 py-1.5 rounded-full">
              <CheckCircle className="w-3.5 h-3.5 text-yellow-400" />{f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
