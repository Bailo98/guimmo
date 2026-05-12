import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales de GuImmo — informations légales sur l'éditeur et l'hébergeur.",
};

export default function MentionsLegalesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 pb-24">
      <nav className="flex items-center gap-2 text-xs text-slate-400 mb-8">
        <Link href="/" className="hover:text-[#009460]">Accueil</Link>
        <span>/</span>
        <span className="text-slate-600 dark:text-slate-300">Mentions légales</span>
      </nav>

      <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Mentions légales</h1>
      <p className="text-slate-400 text-sm mb-10">En vigueur depuis le 1er janvier 2025</p>

      <div className="space-y-8 text-slate-600 dark:text-slate-300 leading-relaxed">
        <section>
          <h2 className="text-lg font-black text-slate-900 dark:text-white mb-3">Éditeur de la plateforme</h2>
          <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-5 border border-slate-100 dark:border-[#2a3040] text-sm space-y-1">
            <p><span className="font-semibold text-slate-900 dark:text-white">Dénomination sociale :</span> GuImmo SARL</p>
            <p><span className="font-semibold text-slate-900 dark:text-white">Siège social :</span> Kipé, Conakry, République de Guinée</p>
            <p><span className="font-semibold text-slate-900 dark:text-white">Directeur de la publication :</span> Aliou Barry</p>
            <p><span className="font-semibold text-slate-900 dark:text-white">Email :</span> <a href="mailto:contact@guimmo.gn" className="text-[#009460] hover:underline">contact@guimmo.gn</a></p>
            <p><span className="font-semibold text-slate-900 dark:text-white">Téléphone :</span> <a href="tel:+224628222510" className="text-[#009460] hover:underline">+224 628 222 510</a></p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-900 dark:text-white mb-3">Hébergement</h2>
          <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-5 border border-slate-100 dark:border-[#2a3040] text-sm space-y-1">
            <p><span className="font-semibold text-slate-900 dark:text-white">Hébergeur :</span> Vercel Inc.</p>
            <p><span className="font-semibold text-slate-900 dark:text-white">Adresse :</span> 440 N Barranca Ave #4133, Covina, CA 91723, USA</p>
            <p><span className="font-semibold text-slate-900 dark:text-white">Site :</span> vercel.com</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-900 dark:text-white mb-3">Propriété intellectuelle</h2>
          <p className="text-sm">L'ensemble des éléments constituant la plateforme GuImmo (textes, logos, images, structure) est protégé par le droit de la propriété intellectuelle. Toute reproduction, totale ou partielle, sans autorisation préalable écrite est interdite.</p>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-900 dark:text-white mb-3">Responsabilité</h2>
          <p className="text-sm">GuImmo est une plateforme de mise en relation entre propriétaires et locataires. Les annonces publiées relèvent de la seule responsabilité de leurs auteurs. GuImmo met en œuvre tous les moyens raisonnables pour vérifier la conformité des annonces, sans pouvoir garantir l'exhaustivité de cette vérification.</p>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-900 dark:text-white mb-3">Données personnelles</h2>
          <p className="text-sm">Le traitement des données personnelles est régi par notre <Link href="/confidentialite" className="text-[#009460] hover:underline">Politique de confidentialité</Link>.</p>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-900 dark:text-white mb-3">Droit applicable</h2>
          <p className="text-sm">Les présentes mentions légales sont soumises au droit guinéen. En cas de litige, les tribunaux compétents de Conakry seront saisis.</p>
        </section>
      </div>
    </div>
  );
}
