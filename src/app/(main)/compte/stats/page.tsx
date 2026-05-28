"use client";

import { useState } from "react";
import { TrendingUp, Eye, MessageCircle, MapPin, Home, BarChart3, Zap, X } from "lucide-react";
import { toast } from "@/lib/toast";

const WEEKLY_VIEWS = [120, 98, 145, 167, 134, 189, 203];
const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const maxViews = Math.max(...WEEKLY_VIEWS);

const TOP_PROPERTIES = [
  { title: "Appartement 3ch à Kipé", views: 342, clicks: 45, neighborhood: "Kipé" },
  { title: "Appartement 2ch à Ratoma - Vue mer", views: 567, clicks: 78, neighborhood: "Ratoma" },
  { title: "Maison 5ch à Taouyah", views: 423, clicks: 56, neighborhood: "Taouyah" },
];

const BOOST_ANNONCES = [
  { id: "a1", title: "Appartement 3ch à Kipé" },
  { id: "a2", title: "Appartement 2ch à Ratoma" },
  { id: "a3", title: "Maison 5ch à Taouyah" },
];

const BEFORE_VIEWS = 45;
const AFTER_VIEWS = 234;
const maxBar = AFTER_VIEWS;

export default function StatsPage() {
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [selectedAnnonce, setSelectedAnnonce] = useState(BOOST_ANNONCES[0].id);
  const [phone, setPhone] = useState("+224 6XX XXX XXX");

  function handlePayment() {
    setShowBoostModal(false);
    toast("Paiement en cours de traitement... Vous recevrez un SMS de confirmation.", "info");
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Statistiques</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Performances de vos annonces</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Vues ce mois", value: "1 247", change: "+12%", icon: Eye, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "Contacts WhatsApp", value: "89", change: "+8", icon: MessageCircle, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
          { label: "Annonces actives", value: "3", change: "", icon: Home, color: "text-[#E9E900]", bg: "bg-orange-50 dark:bg-orange-900/20" },
          { label: "Taux de contact", value: "7.1%", change: "+2%", icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-[#2c2f36] rounded-2xl p-4 border border-[#1e2a30]">
              <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-xl font-black text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs">{s.label}</p>
              {s.change && <p className="text-green-500 text-xs font-semibold mt-0.5">{s.change} ce mois</p>}
            </div>
          );
        })}
      </div>

      {/* Weekly chart */}
      <div className="bg-[#2c2f36] rounded-2xl p-5 border border-[#1e2a30]">
        <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#E9E900]" /> Vues cette semaine
        </h2>
        <div className="flex items-end gap-2 h-32">
          {WEEKLY_VIEWS.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-slate-400">{v}</span>
              <div className="w-full bg-[#E9E900] rounded-t-lg transition-all" style={{ height: `${(v / maxViews) * 96}px` }} />
              <span className="text-[10px] text-slate-400">{DAYS[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top properties */}
      <div className="bg-[#2c2f36] rounded-2xl p-5 border border-[#1e2a30]">
        <h2 className="font-bold text-slate-900 dark:text-white mb-4">Top annonces</h2>
        <div className="space-y-3">
          {TOP_PROPERTIES.map((p, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-6 h-6 bg-[#E9E900]/10 text-[#E9E900] text-xs font-black rounded-full flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">{p.title}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />{p.neighborhood}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {p.views} <span className="text-slate-400 font-normal text-xs">vues</span>
                </p>
                <p className="text-xs text-green-500">{p.clicks} contacts</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Boost performance */}
      <div className="bg-[#2c2f36] rounded-2xl p-5 border border-[#1e2a30]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#E9E900]" /> Performances du boost
          </h2>
          <span className="text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-[#D4AF37] px-2.5 py-1 rounded-full">
            +420% de visibilité
          </span>
        </div>

        <div className="space-y-3">
          {/* Before */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">Avant boost</span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{BEFORE_VIEWS} vues/jour</span>
            </div>
            <div className="h-3 bg-slate-100 dark:bg-[#151922] rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-400 dark:bg-slate-600 rounded-full"
                style={{ width: `${(BEFORE_VIEWS / maxBar) * 100}%` }}
              />
            </div>
          </div>

          {/* After */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">Après boost</span>
              <span className="text-xs font-bold text-[#E9E900]">{AFTER_VIEWS} vues/jour</span>
            </div>
            <div className="h-3 bg-slate-100 dark:bg-[#151922] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#E9E900] rounded-full"
                style={{ width: `${(AFTER_VIEWS / maxBar) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowBoostModal(true)}
          className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#E9E900] text-white font-bold text-sm hover:bg-[#c4c400] transition-colors"
        >
          <Zap className="w-4 h-4" /> Booster une annonce
        </button>
      </div>

      {/* Boost modal */}
      {showBoostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="bg-[#2c2f36] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span style={{ color: "#FF7900" }}>⚡</span> Booster une annonce
              </h3>
              <button
                onClick={() => setShowBoostModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#2a3040] flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Annonce selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Choisir une annonce
                </label>
                <select
                  value={selectedAnnonce}
                  onChange={(e) => setSelectedAnnonce(e.target.value)}
                  className="w-full bg-[#2c2f36] border border-[#1e2a30] rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E9E900]"
                >
                  {BOOST_ANNONCES.map((a) => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Montant du boost (7 jours)</span>
                  <span className="font-black text-lg" style={{ color: "#FF7900" }}>50.000 GNF</span>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Numéro Orange Money
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#2c2f36] border border-[#1e2a30] rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E9E900]"
                />
              </div>

              {/* Pay button */}
              <button
                onClick={handlePayment}
                className="w-full py-3 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#FF7900" }}
              >
                Payer avec Orange Money
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
