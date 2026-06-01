"use client";

import { useState, useEffect } from "react";
import { Bell, Sparkles, Clock, RefreshCw } from "lucide-react";
import { MOCK_PROPERTIES } from "@/data/mock-properties";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { toast } from "@/lib/toast";

const DAYS_THRESHOLD = 90;

function getRecentProperties() {
  const cutoff = Date.now() - DAYS_THRESHOLD * 24 * 60 * 60 * 1000;
  return MOCK_PROPERTIES.filter(
    (p) => p.status === "active" && new Date(p.created_at ?? 0).getTime() >= cutoff
  ).sort(
    (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
  );
}

function getThisWeekCount(properties: typeof MOCK_PROPERTIES) {
  const weekCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return properties.filter(
    (p) => new Date(p.created_at ?? 0).getTime() >= weekCutoff
  ).length;
}

export default function NouveautesPage() {
  const [properties, setProperties] = useState<typeof MOCK_PROPERTIES>([]);
  const [weekCount, setWeekCount] = useState(0);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const recent = getRecentProperties();
    setProperties(recent);
    setWeekCount(getThisWeekCount(recent));
  }, []);

  function handleSubscribe() {
    if (subscribed) {
      toast("Vous êtes déjà abonné aux alertes", "info");
      return;
    }
    toast("Fonctionnalité bientôt disponible !", "info");
    setSubscribed(true);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[var(--bg-primary)]">
      {/* Orange hero banner */}
      <div className="bg-gradient-to-br from-[var(--accent-gold)] via-[#B8963A] to-[#c2540a] text-white">
        <div className="max-w-6xl mx-auto px-4 py-10 md:py-14">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-white/80 font-semibold text-sm uppercase tracking-wider">
              Mises à jour
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Nouveautés
          </h1>
          <p className="text-white/80 text-lg max-w-xl mb-6">
            🔔 Soyez le premier à voir les nouvelles annonces. Toutes les
            propriétés ajoutées au cours des {DAYS_THRESHOLD} derniers jours.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            {/* Week count chip */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
              <Clock className="w-4 h-4 text-white/80" />
              <span className="text-white font-semibold text-sm">
                {weekCount > 0
                  ? `${weekCount} nouvelle${weekCount > 1 ? "s" : ""} annonce${weekCount > 1 ? "s" : ""} cette semaine`
                  : "Aucune nouvelle annonce cette semaine"}
              </span>
            </div>

            {/* Subscribe button */}
            <button
              onClick={handleSubscribe}
              className={`inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl transition-all ${
                subscribed
                  ? "bg-white/30 text-white cursor-default"
                  : "bg-[var(--accent-gold)] text-[var(--bg-primary)] hover:bg-[#B8963A]"
              }`}
            >
              <Bell className={`w-4 h-4 ${subscribed ? "fill-white" : ""}`} />
              {subscribed ? "Alertes activées ✓" : "S'abonner aux alertes"}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Result summary */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {properties.length > 0 ? (
                <>
                  <span className="text-[var(--accent-gold)]">{properties.length}</span>{" "}
                  annonce{properties.length > 1 ? "s" : ""} récente{properties.length > 1 ? "s" : ""}
                </>
              ) : (
                "Aucune annonce récente"
              )}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              Ajoutées dans les {DAYS_THRESHOLD} derniers jours · triées par date
            </p>
          </div>

          <button
            onClick={() => {
              const recent = getRecentProperties();
              setProperties(recent);
              setWeekCount(getThisWeekCount(recent));
              toast("Liste mise à jour", "success");
            }}
            className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-[var(--accent-gold)] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>

        {properties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {properties.map((property, index) => (
              <PropertyCard key={property.id} property={property} index={index} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center mb-5">
              <Sparkles className="w-10 h-10 text-[var(--accent-gold)]" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Pas encore de nouveautés
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">
              Abonnez-vous aux alertes pour être notifié dès qu&apos;une nouvelle annonce
              est publiée dans votre secteur.
            </p>
            <button
              onClick={handleSubscribe}
              className="inline-flex items-center gap-2 bg-[var(--accent-gold)] hover:bg-[#B8963A] text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              <Bell className="w-4 h-4" />
              Activer les alertes
            </button>
          </div>
        )}

        {/* Alert CTA strip */}
        {properties.length > 0 && (
          <div className="mt-12 bg-[var(--accent-gold)]/10 dark:bg-[var(--accent-gold)]/5 border border-[var(--accent-gold)]/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--accent-gold)]/20 flex items-center justify-center flex-shrink-0">
              <Bell className="w-6 h-6 text-[var(--accent-gold)]" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-bold text-slate-900 dark:text-white">
                Ne manquez aucune annonce
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                Recevez une notification dès qu&apos;une propriété correspondant à vos critères
                est publiée.
              </p>
            </div>
            <button
              onClick={handleSubscribe}
              className={`flex-shrink-0 inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl transition-all ${
                subscribed
                  ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-[var(--accent-gold)]"
                  : "bg-[var(--accent-gold)] hover:bg-[#B8963A] text-white"
              }`}
            >
              <Bell className={`w-4 h-4 ${subscribed ? "fill-current" : ""}`} />
              {subscribed ? "Alertes activées ✓" : "S'abonner gratuitement"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
