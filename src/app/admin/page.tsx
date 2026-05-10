"use client";
import Link from "next/link";
import {
  TrendingUp, Users, FileText, CreditCard, AlertTriangle,
  CheckCircle, XCircle,
  ArrowUpRight, DollarSign
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { MOCK_PROPERTIES } from "@/data/mock-properties";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const STATS = [
  { label: "Revenus ce mois", value: "4 250 000 GNF", change: "+18%", icon: DollarSign, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
  { label: "Annonces actives", value: "284", change: "+24", icon: FileText, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
  { label: "Nouveaux utilisateurs", value: "67", change: "+12", icon: Users, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
  { label: "Signalements", value: "3", change: "-2", icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" },
];

const RECENT_PAYMENTS = [
  { user: "Mamadou Diallo", method: "Orange Money", amount: 50000, status: "success", date: "Il y a 2h", desc: "Boost 7 jours" },
  { user: "Fatoumata Camara", method: "MTN Money", amount: 200000, status: "success", date: "Il y a 5h", desc: "Abonnement Agent" },
  { user: "Ibrahim Bah", method: "Orange Money", amount: 30000, status: "failed", date: "Il y a 8h", desc: "Annonce supplémentaire" },
  { user: "Agence Premium", method: "Visa", amount: 750000, status: "success", date: "Hier", desc: "Abonnement Agence" },
  { user: "Aissatou Sylla", method: "MTN Money", amount: 150000, status: "pending", date: "Hier", desc: "Boost 30 jours" },
];

// LineChart: Annonces publiées / jour — last 7 days
const today = new Date(2026, 4, 10); // May 10 2026
const DAILY_LISTINGS_DATA = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(today);
  d.setDate(today.getDate() - (6 - i));
  const dayLabel = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
  return {
    jour: dayLabel,
    annonces: Math.floor(Math.random() * 10) + 3, // 3–12
  };
}).map((d, i) => ({
  ...d,
  annonces: [7, 5, 10, 3, 8, 12, 6][i],
}));

// BarChart: Inscriptions / semaine — last 4 weeks
const WEEKLY_SIGNUPS_DATA = [
  { semaine: "S-4", inscriptions: 18 },
  { semaine: "S-3", inscriptions: 24 },
  { semaine: "S-2", inscriptions: 21 },
  { semaine: "S-1", inscriptions: 31 },
];

// PieChart: Types de biens
const PIE_DATA = [
  { name: "Appartement", value: 45 },
  { name: "Maison", value: 25 },
  { name: "Studio", value: 20 },
  { name: "Autre", value: 10 },
];
const PIE_COLORS = ["#F97316", "#3b82f6", "#22c55e", "#8b5cf6"];

const PENDING_LISTINGS = MOCK_PROPERTIES.slice(0, 3);

const tooltipStyle = {
  contentStyle: {
    background: "#1e2430",
    border: "1px solid #2a3040",
    borderRadius: "12px",
    color: "#fff",
    fontSize: "12px",
  },
  labelStyle: { color: "#94a3b8" },
  cursor: { fill: "rgba(249,115,22,0.08)" },
};

export default function AdminDashboard() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Tableau de bord</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Vue d&apos;ensemble de GuImmo</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white dark:bg-[#1e2430] rounded-2xl p-4 border border-slate-100 dark:border-[#2a3040]">
              <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{s.label}</p>
              <p className={`text-xs font-semibold mt-1 ${s.change.startsWith("+") ? "text-green-500" : "text-red-500"}`}>{s.change} ce mois</p>
            </div>
          );
        })}
      </div>

      {/* Charts — LineChart full width */}
      <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-5 border border-slate-100 dark:border-[#2a3040]">
        <h2 className="font-bold text-slate-900 dark:text-white mb-1 text-sm">Annonces publiées / jour</h2>
        <p className="text-xs text-slate-400 mb-4">7 derniers jours</p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={DAILY_LISTINGS_DATA}>
            <XAxis dataKey="jour" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              contentStyle={tooltipStyle.contentStyle}
              labelStyle={tooltipStyle.labelStyle}
              cursor={tooltipStyle.cursor}
              formatter={(v) => [v, "Annonces"]}
            />
            <Line
              type="monotone"
              dataKey="annonces"
              stroke="#F97316"
              strokeWidth={2.5}
              dot={{ fill: "#F97316", r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: "#F97316" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* BarChart + PieChart side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart — weekly signups */}
        <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-5 border border-slate-100 dark:border-[#2a3040]">
          <h2 className="font-bold text-slate-900 dark:text-white mb-1 text-sm">Inscriptions / semaine</h2>
          <p className="text-xs text-slate-400 mb-4">4 dernières semaines</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={WEEKLY_SIGNUPS_DATA} barSize={32}>
              <XAxis dataKey="semaine" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={tooltipStyle.contentStyle}
                labelStyle={tooltipStyle.labelStyle}
                cursor={tooltipStyle.cursor}
                formatter={(v) => [v, "Inscriptions"]}
              />
              <Bar dataKey="inscriptions" fill="#F97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart — property types */}
        <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-5 border border-slate-100 dark:border-[#2a3040]">
          <h2 className="font-bold text-slate-900 dark:text-white mb-1 text-sm">Types de biens</h2>
          <p className="text-xs text-slate-400 mb-2">Répartition des annonces</p>
          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie
                data={PIE_DATA}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={78}
                dataKey="value"
                paddingAngle={3}
              >
                {PIE_DATA.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle.contentStyle}
                labelStyle={tooltipStyle.labelStyle}
                formatter={(v) => [`${v}%`, ""]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-1">
            {PIE_DATA.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i] }} />
                <span className="text-xs text-slate-500 dark:text-slate-400">{d.name} {d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent payments */}
        <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-5 border border-slate-100 dark:border-[#2a3040]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 dark:text-white">Paiements récents</h2>
            <Link href="/admin/paiements" className="text-[#F97316] text-xs font-semibold flex items-center gap-1">
              Voir tout <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {RECENT_PAYMENTS.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#F97316]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-4 h-4 text-[#F97316]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">{p.user}</p>
                  <p className="text-xs text-slate-400">{p.desc} • {p.method}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{formatPrice(p.amount)}</p>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    p.status === "success" ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" :
                    p.status === "failed" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
                    "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }`}>
                    {p.status === "success" ? "✓ Réussi" : p.status === "failed" ? "✗ Échoué" : "⏳ En attente"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending listings */}
        <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-5 border border-slate-100 dark:border-[#2a3040]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 dark:text-white">Annonces à valider</h2>
            <Link href="/admin/annonces" className="text-[#F97316] text-xs font-semibold flex items-center gap-1">
              Voir tout <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {PENDING_LISTINGS.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-[#151922]">
                  {p.images[0] && <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">{p.title}</p>
                  <p className="text-xs text-slate-400">{p.owner.name}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button className="w-7 h-7 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg flex items-center justify-center hover:bg-green-500 hover:text-white transition-colors">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </button>
                  <button className="w-7 h-7 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors">
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Gérer annonces", href: "/admin/annonces", icon: FileText, color: "text-blue-500" },
          { label: "Gérer utilisateurs", href: "/admin/utilisateurs", icon: Users, color: "text-purple-500" },
          { label: "Voir paiements", href: "/admin/paiements", icon: CreditCard, color: "text-green-500" },
          { label: "Signalements", href: "/admin/signalements", icon: AlertTriangle, color: "text-red-500" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="bg-white dark:bg-[#1e2430] rounded-2xl p-4 border border-slate-100 dark:border-[#2a3040] hover:border-[#F97316] transition-colors flex flex-col items-center gap-2 text-center group">
              <Icon className={`w-6 h-6 ${item.color} group-hover:scale-110 transition-transform`} />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
