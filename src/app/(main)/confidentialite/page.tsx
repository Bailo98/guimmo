import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Politique de confidentialité de GuImmo — comment nous protégeons vos données.",
};

export default function ConfidentialitePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 pb-24">
      <nav className="flex items-center gap-2 text-xs text-slate-400 mb-8">
        <Link href="/" className="hover:text-[#009460]">Accueil</Link>
        <span>/</span>
        <span className="text-slate-600 dark:text-slate-300">Confidentialité</span>
      </nav>

      <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Politique de confidentialité</h1>
      <p className="text-slate-400 text-sm mb-10">Dernière mise à jour : 1er janvier 2025</p>

      <div className="space-y-8 text-slate-600 dark:text-slate-300 leading-relaxed">
        <section>
          <h2 className="text-lg font-black text-slate-900 dark:text-white mb-3">1. Données collectées</h2>
          <p>GuImmo collecte uniquement les données nécessaires au bon fonctionnement de la plateforme :</p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
            <li>Nom, prénom et numéro de téléphone lors de l'inscription</li>
            <li>Adresse e-mail pour la communication</li>
            <li>Photos et descriptions des biens publiés</li>
            <li>Données de navigation anonymisées (pages visitées, durée)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-900 dark:text-white mb-3">2. Utilisation des données</h2>
          <p className="text-sm">Vos données sont utilisées exclusivement pour :</p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
            <li>La mise en relation entre propriétaires et locataires</li>
            <li>L'envoi de notifications liées à votre compte</li>
            <li>L'amélioration de l'expérience utilisateur</li>
            <li>La vérification des annonces et des comptes</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-900 dark:text-white mb-3">3. Partage des données</h2>
          <p className="text-sm">GuImmo ne vend jamais vos données personnelles à des tiers. Vos informations de contact (numéro WhatsApp) ne sont partagées qu'avec les utilisateurs que vous choisissez de contacter directement via la plateforme.</p>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-900 dark:text-white mb-3">4. Cookies</h2>
          <p className="text-sm">Nous utilisons des cookies techniques indispensables au fonctionnement du site (préférences de thème, session). Aucun cookie publicitaire tiers n'est déposé sans votre consentement.</p>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-900 dark:text-white mb-3">5. Vos droits</h2>
          <p className="text-sm">Conformément aux lois en vigueur, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour exercer ces droits, contactez-nous à <a href="mailto:contact@GuImmo.gn" className="text-[#009460] hover:underline">contact@GuImmo.gn</a>.</p>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-900 dark:text-white mb-3">6. Sécurité</h2>
          <p className="text-sm">Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, perte ou altération.</p>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-900 dark:text-white mb-3">7. Contact</h2>
          <p className="text-sm">Pour toute question relative à cette politique, écrivez-nous à <a href="mailto:contact@GuImmo.gn" className="text-[#009460] hover:underline">contact@GuImmo.gn</a> ou via notre <Link href="/contact" className="text-[#009460] hover:underline">page de contact</Link>.</p>
        </section>
      </div>
    </div>
  );
}
