import { CheckCircle, Trash2, AlertTriangle, Info, Download } from "lucide-react";

const LOGS = [
  { id: 1, action: "approve", message: "Annonce 'Appartement 3ch Kipé' approuvée", admin: "Admin Principal", date: "2026-05-09 14:32", icon: "check" },
  { id: 2, action: "delete", message: "Annonce frauduleuse 'Studio Ratoma' supprimée", admin: "Admin Principal", date: "2026-05-09 11:15", icon: "trash" },
  { id: 3, action: "warning", message: "Signalement reçu pour 'Maison Taouyah'", admin: "Système", date: "2026-05-08 18:44", icon: "alert" },
  { id: 4, action: "approve", message: "Utilisateur 'Sékou Kouyaté' vérifié", admin: "Admin Principal", date: "2026-05-08 16:20", icon: "check" },
  { id: 5, action: "info", message: "Nouvel utilisateur inscrit: Mariama Diallo", admin: "Système", date: "2026-05-08 09:05", icon: "info" },
  { id: 6, action: "delete", message: "Compte utilisateur 'spam123' supprimé", admin: "Admin Principal", date: "2026-05-07 15:30", icon: "trash" },
  { id: 7, action: "warning", message: "Boost expiré pour 'Villa Hamdallaye'", admin: "Système", date: "2026-05-07 00:00", icon: "alert" },
  { id: 8, action: "info", message: "Paiement de 50 000 GNF reçu - Mamadou Keita", admin: "Système", date: "2026-05-06 12:18", icon: "info" },
  { id: 9, action: "approve", message: "Annonce 'Bureau Kaloum' approuvée", admin: "Admin Principal", date: "2026-05-05 10:45", icon: "check" },
  { id: 10, action: "warning", message: "3 tentatives de connexion échouées - IP 196.168.1.45", admin: "Système", date: "2026-05-04 22:10", icon: "alert" },
];

const ACTION_STYLES: Record<string, { bg: string; icon: React.ReactNode; label: string; dot: string }> = {
  approve: {
    bg: "bg-green-100 dark:bg-green-900/30",
    icon: <CheckCircle className="w-4 h-4 text-green-600 dark:text-yellow-400" />,
    label: "Approbation",
    dot: "bg-green-500",
  },
  delete: {
    bg: "bg-red-100 dark:bg-red-900/30",
    icon: <Trash2 className="w-4 h-4 text-red-500" />,
    label: "Suppression",
    dot: "bg-red-500",
  },
  warning: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    icon: <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />,
    label: "Avertissement",
    dot: "bg-yellow-500",
  },
  info: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    icon: <Info className="w-4 h-4 text-blue-500" />,
    label: "Information",
    dot: "bg-blue-500",
  },
};

export default function AdminLogsPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            Journal d&apos;activité
            <span className="text-sm font-bold bg-slate-100 dark:bg-[#2a3040] text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-full">
              {LOGS.length} entrées
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Historique complet des actions administratives</p>
        </div>
        <button className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border border-slate-200 dark:border-[#2a3040] text-slate-600 dark:text-slate-300 hover:border-[#E9E900] hover:text-[#E9E900] transition-colors">
          <Download className="w-4 h-4" />
          Exporter
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(ACTION_STYLES).map(([key, s]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className={`w-2 h-2 rounded-full ${s.dot}`} />
            {s.label}
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-100 dark:bg-[#2a3040]" />

        <div className="space-y-4">
          {LOGS.map((log, index) => {
            const style = ACTION_STYLES[log.action] ?? ACTION_STYLES.info;
            return (
              <div key={log.id} className="relative flex gap-4 items-start">
                {/* Icon circle */}
                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${style.bg} border-2 border-white dark:border-[#0f1117]`}>
                  {style.icon}
                </div>

                {/* Content */}
                <div className={`flex-1 bg-white dark:bg-[#1e2430] rounded-2xl p-4 border border-slate-100 dark:border-[#2a3040] ${index === 0 ? "border-l-4 border-l-[#E9E900]" : ""}`}>
                  <p className="text-sm font-medium text-slate-900 dark:text-white leading-snug">{log.message}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{log.admin}</span>
                    <span className="text-slate-300 dark:text-slate-600 text-xs">·</span>
                    <span className="text-xs text-slate-400">{log.date}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
