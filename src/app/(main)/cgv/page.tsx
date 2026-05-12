export default function CGVPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <h1 className="text-3xl font-black text-slate-900 dark:text-white">Conditions Générales d&apos;Utilisation</h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm">Dernière mise à jour : Mai 2025</p>
      {[
        { title: "1. Présentation de GuImmo", content: "GuImmo est une plateforme immobilière en ligne opérant en République de Guinée. Notre mission est de connecter locataires, acheteurs, propriétaires et agents immobiliers de manière simple, rapide et fiable." },
        { title: "2. Utilisation du service", content: "L'utilisation de GuImmo est gratuite pour la consultation des annonces. La publication d'annonces est limitée à 3 gratuites par compte. Au-delà, des offres payantes sont disponibles. L'utilisateur s'engage à fournir des informations exactes et à ne pas publier de fausses annonces." },
        { title: "3. Annonces et responsabilité", content: "GuImmo n'est pas responsable des transactions entre utilisateurs. La plateforme sert d'intermédiaire de mise en relation uniquement. Chaque utilisateur est responsable des informations publiées dans ses annonces." },
        { title: "4. Paiements", content: "Les paiements pour les services premium sont traités via Orange Money, MTN Mobile Money ou Visa/Mastercard. GuImmo ne stocke jamais les données bancaires des utilisateurs." },
        { title: "5. Protection des données", content: "Les données personnelles collectées (nom, téléphone, email) sont utilisées uniquement pour le fonctionnement du service. Elles ne sont pas vendues à des tiers." },
        { title: "6. Contact", content: "Pour toute question, contactez-nous sur WhatsApp au +224 628 222 510 ou par email à contact@guimmo.gn." },
      ].map((s) => (
        <section key={s.title}>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{s.title}</h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{s.content}</p>
        </section>
      ))}
    </div>
  );
}
