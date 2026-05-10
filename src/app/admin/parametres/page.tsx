export default function AdminParametresPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Paramètres admin</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Configuration de la plateforme</p>
      </div>
      <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-5 border border-slate-100 dark:border-[#2a3040] space-y-4">
        {[
          { label: "Nom de la plateforme", value: "GuImmo" },
          { label: "Email de contact", value: "contact@guimmo.gn" },
          { label: "Téléphone WhatsApp", value: "+224 620 000 000" },
          { label: "Annonces gratuites par compte", value: "3" },
        ].map((s) => (
          <div key={s.label}>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">{s.label}</label>
            <input defaultValue={s.value} className="w-full bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F97316]" />
          </div>
        ))}
        <button className="w-full bg-[#F97316] text-white font-bold py-2.5 rounded-xl hover:bg-[#EA6C0A] transition-colors text-sm">
          Enregistrer les paramètres
        </button>
      </div>
    </div>
  );
}
