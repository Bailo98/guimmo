import { CheckCircle, XCircle, Clock } from "lucide-react";
import { formatPrice } from "@/lib/utils";

const PAYMENTS = [
  { user: "Mamadou Diallo", desc: "Boost 7 jours", method: "Orange Money", amount: 50000, status: "success", date: "08 Mai 2025" },
  { user: "Fatoumata Camara", desc: "Abonnement Agent Pro", method: "MTN Money", amount: 200000, status: "success", date: "01 Mai 2025" },
  { user: "Ibrahim Bah", desc: "Annonce supplémentaire", method: "Orange Money", amount: 30000, status: "failed", date: "28 Avr 2025" },
  { user: "Agence Premium", desc: "Abonnement Agence", method: "Visa", amount: 750000, status: "success", date: "01 Avr 2025" },
  { user: "Aissatou Sylla", desc: "Boost 30 jours", method: "MTN Money", amount: 150000, status: "pending", date: "30 Mar 2025" },
];

const STATUS = {
  success: { label: "Réussi", icon: CheckCircle, color: "text-green-500" },
  failed: { label: "Échoué", icon: XCircle, color: "text-red-500" },
  pending: { label: "En attente", icon: Clock, color: "text-[#D4AF37]" },
};

export default function AdminPaiementsPage() {
  const total = PAYMENTS.filter(p => p.status === "success").reduce((sum, p) => sum + p.amount, 0);
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Paiements</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Total encaissé : <span className="text-[#D4AF37] font-bold">{formatPrice(total)}</span></p>
        </div>
      </div>
      <div className="space-y-3">
        {PAYMENTS.map((p, i) => {
          const s = STATUS[p.status as keyof typeof STATUS];
          const Icon = s.icon;
          return (
            <div key={i} className="bg-[#2c2f36] rounded-2xl p-4 border border-[#1e2a30] flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white text-sm">{p.user}</p>
                <p className="text-xs text-slate-400">{p.desc} · {p.method} · {p.date}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-slate-900 dark:text-white">{formatPrice(p.amount)}</p>
                <span className={`flex items-center justify-end gap-1 text-xs font-semibold ${s.color}`}>
                  <Icon className="w-3 h-3" />{s.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
