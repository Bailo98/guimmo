import Link from "next/link";
import { CreditCard, CheckCircle, Clock, XCircle, Zap, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";

const PAYMENTS = [
  { desc: "Boost 7 jours — Appartement 3ch Kipé", method: "Orange Money", amount: 50000, status: "success", date: "08 Mai 2025" },
  { desc: "Abonnement Agent Pro — Mai 2025", method: "MTN Money", amount: 200000, status: "success", date: "01 Mai 2025" },
  { desc: "Boost 30 jours — Villa Hamdallaye", method: "Orange Money", amount: 150000, status: "failed", date: "28 Avr 2025" },
  { desc: "Annonce supplémentaire", method: "Orange Money", amount: 30000, status: "success", date: "15 Avr 2025" },
];

const STATUS = {
  success: { label: "Réussi", icon: CheckCircle, color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/20" },
  failed: { label: "Échoué", icon: XCircle, color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/20" },
  pending: { label: "En attente", icon: Clock, color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10 dark:bg-[#D4AF37]/15" },
};

export default function PaiementsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Paiements & Abonnements</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Historique de vos transactions</p>
      </div>

      {/* Current subscription */}
      <div className="bg-gradient-to-r from-[#D4AF37] to-[#B8963A] rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-xs font-semibold uppercase tracking-wide">Abonnement actuel</p>
            <p className="text-xl font-black mt-1">Agent Pro</p>
            <p className="text-white/80 text-sm">Expire le 01 Juin 2025</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black">200k</p>
            <p className="text-white/70 text-xs">GNF / mois</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/20 flex gap-3">
          <Link href="/tarifs" className="flex-1 text-center bg-white/20 hover:bg-white/30 text-white text-sm font-semibold py-2 rounded-xl transition-colors">
            Changer de plan
          </Link>
          <button className="flex-1 text-center bg-white text-[#D4AF37] text-sm font-bold py-2 rounded-xl hover:bg-white/90 transition-colors">
            Renouveler
          </button>
        </div>
      </div>

      {/* Upgrade CTA */}
      <div className="bg-[var(--bg-card-light)] rounded-2xl p-4 border border-[#D4AF37]/30 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-[#D4AF37]" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-slate-900 dark:text-white text-sm">Booster une annonce</p>
          <p className="text-slate-400 text-xs">À partir de 50.000 GNF / 7 jours</p>
        </div>
        <Link href="/tarifs" className="flex items-center gap-1 text-[#D4AF37] text-sm font-bold hover:underline flex-shrink-0">
          Voir <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* History */}
      <div>
        <h2 className="font-bold text-slate-900 dark:text-white mb-3">Historique</h2>
        <div className="space-y-3">
          {PAYMENTS.map((p, i) => {
            const s = STATUS[p.status as keyof typeof STATUS];
            const Icon = s.icon;
            return (
              <div key={i} className="bg-[var(--bg-card-light)] rounded-2xl p-4 border border-[var(--color-border)] flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--bg-card-light)] rounded-xl flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">{p.desc}</p>
                  <p className="text-xs text-slate-400">{p.method} · {p.date}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{formatPrice(p.amount)}</p>
                  <span className={`flex items-center gap-1 text-[10px] font-semibold ${s.color}`}>
                    <Icon className="w-3 h-3" />{s.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
