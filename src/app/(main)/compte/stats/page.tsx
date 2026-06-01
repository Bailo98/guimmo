"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, Eye, MessageCircle, MapPin, Home, BarChart3, Zap, X } from "lucide-react";
import { toast } from "@/lib/toast";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

interface PropertyStat {
  id: string;
  title: string;
  neighborhood: string;
  views: number;
  whatsapp_clicks: number;
}

export default function StatsPage() {
  const { user } = useAuth();
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [phone, setPhone] = useState("+224 6XX XXX XXX");
  const [selectedAnnonce, setSelectedAnnonce] = useState("");
  const [properties, setProperties] = useState<PropertyStat[]>([]);
  const [weeklyViews, setWeeklyViews] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [totalViewsMonth, setTotalViewsMonth] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || !user) { setLoading(false); return; }

    // 1. Active properties + view counts
    const { data: props } = await supabase
      .from("properties")
      .select("id, title, neighborhood, views, whatsapp_clicks")
      .eq("owner_id", user.id)
      .eq("status", "active")
      .order("views", { ascending: false })
      .limit(10);

    const propList = (props ?? []) as PropertyStat[];
    setProperties(propList);
    setActiveCount(propList.length);
    if (propList.length > 0) setSelectedAnnonce(propList[0].id);

    // 2. Total views this month from property_views table
    const monthStart = new Date();
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const propertyIds = propList.map((p) => p.id);

    if (propertyIds.length > 0) {
      const { count } = await supabase
        .from("property_views")
        .select("*", { count: "exact", head: true })
        .in("property_id", propertyIds)
        .gte("viewed_at", monthStart.toISOString())
        // Silently ignore if table doesn't exist
        .then((r) => r);
      setTotalViewsMonth(count ?? propList.reduce((s, p) => s + (p.views ?? 0), 0));

      // 3. Weekly views (last 7 days) from property_views
      const weekly: number[] = [0, 0, 0, 0, 0, 0, 0];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date(today);
        dayStart.setDate(today.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);
        const { count: c } = await supabase
          .from("property_views")
          .select("*", { count: "exact", head: true })
          .in("property_id", propertyIds)
          .gte("viewed_at", dayStart.toISOString())
          .lte("viewed_at", dayEnd.toISOString())
          .then((r) => r);
        weekly[6 - i] = c ?? 0;
      }
      setWeeklyViews(weekly);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const maxViews = Math.max(...weeklyViews, 1);
  const totalWhatsApp = properties.reduce((s, p) => s + (p.whatsapp_clicks ?? 0), 0);
  const contactRate = totalViewsMonth > 0 ? ((totalWhatsApp / totalViewsMonth) * 100).toFixed(1) : "0.0";

  function handlePayment() {
    setShowBoostModal(false);
    toast("Paiement en cours de traitement... Vous recevrez un SMS de confirmation.", "info");
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 flex justify-center">
        <div style={{ width: 32, height: 32, border: "2px solid var(--accent-gold)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
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
          { label: "Vues ce mois", value: totalViewsMonth.toLocaleString("fr-FR"), icon: Eye, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "Contacts WhatsApp", value: String(totalWhatsApp), icon: MessageCircle, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
          { label: "Annonces actives", value: String(activeCount), icon: Home, color: "text-[var(--accent-gold)]", bg: "bg-orange-50 dark:bg-orange-900/20" },
          { label: "Taux de contact", value: `${contactRate}%`, icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--border)]">
              <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-xl font-black" style={{ color: "var(--text-primary)" }}>{s.value}</p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Weekly chart */}
      <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)]">
        <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <BarChart3 className="w-4 h-4 text-[var(--accent-gold)]" /> Vues cette semaine
        </h2>
        <div className="flex items-end gap-2 h-32">
          {weeklyViews.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              {v > 0 && <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>{v}</span>}
              <div className="w-full bg-[var(--accent-gold)] rounded-t-lg transition-all" style={{ height: `${(v / maxViews) * 96}px`, minHeight: v > 0 ? 4 : 0 }} />
              <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>{DAYS[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top properties */}
      <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)]">
        <h2 className="font-bold mb-4" style={{ color: "var(--text-primary)" }}>Top annonces</h2>
        {properties.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: "var(--text-secondary)" }}>
            Aucune annonce active pour le moment.
          </p>
        ) : (
          <div className="space-y-3">
            {properties.slice(0, 5).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="w-6 h-6 bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] text-xs font-black rounded-full flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold line-clamp-1" style={{ color: "var(--text-primary)" }}>{p.title}</p>
                  <p className="text-xs flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
                    <MapPin className="w-3 h-3" />{p.neighborhood}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                    {(p.views ?? 0).toLocaleString("fr-FR")} <span className="font-normal text-xs" style={{ color: "var(--text-secondary)" }}>vues</span>
                  </p>
                  <p className="text-xs text-green-500">{p.whatsapp_clicks ?? 0} contacts</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Boost CTA */}
      <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Zap className="w-4 h-4 text-[var(--accent-gold)]" /> Boostez vos annonces
          </h2>
        </div>
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          Passez en tête des résultats et multipliez vos vues par 5 pendant 7 jours.
        </p>
        <button
          onClick={() => setShowBoostModal(true)}
          disabled={properties.length === 0}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-40"
          style={{ background: "var(--accent-gold)", color: "var(--bg-primary)" }}
        >
          <Zap className="w-4 h-4" /> Booster une annonce
        </button>
      </div>

      {/* Boost modal */}
      {showBoostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="bg-[var(--bg-card-light)] rounded-2xl p-6 w-full max-w-md shadow-2xl">
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
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Choisir une annonce
                </label>
                <select
                  value={selectedAnnonce}
                  onChange={(e) => setSelectedAnnonce(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-gold)]"
                  style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                >
                  {properties.map((a) => (
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
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Numéro Orange Money
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-gold)]"
                  style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-primary)" }}
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
