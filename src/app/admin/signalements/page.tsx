"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "@/lib/toast";

interface Report {
  id: string;
  property: string;
  reporter: string;
  reason: string;
  date: string;
  status: "pending" | "resolved";
}

const INITIAL_REPORTS: Report[] = [
  { id: "r1", property: "Studio meublé à Dixinn", reporter: "Kader Kouyaté", reason: "Prix suspect / arnaque probable", date: "08 Mai 2026", status: "pending" },
  { id: "r2", property: "Appartement 2ch à Kaloum", reporter: "Mariam Balde", reason: "Photos volées d'un autre site", date: "07 Mai 2026", status: "pending" },
  { id: "r3", property: "Villa 5ch Hamdallaye", reporter: "Sékou Camara", reason: "Annonce dupliquée avec prix différent", date: "07 Mai 2026", status: "pending" },
  { id: "r4", property: "Bureau Kaloum Centre", reporter: "Alpha Diallo", reason: "Coordonnées inexistantes", date: "06 Mai 2026", status: "pending" },
  { id: "r5", property: "Chambre à Madina", reporter: "Oumar Diallo", reason: "Annonceur ne répond pas", date: "06 Mai 2026", status: "resolved" },
  { id: "r6", property: "Maison Taouyah", reporter: "Hawa Barry", reason: "Logement non disponible malgré l'annonce", date: "05 Mai 2026", status: "resolved" },
];

export default function AdminSignalementsPage() {
  const [reports, setReports] = useState<Report[]>(INITIAL_REPORTS);

  const pending = reports.filter((r) => r.status === "pending").length;
  const resolved = reports.filter((r) => r.status === "resolved").length;

  function handleDelete(id: string) {
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: "resolved" } : r));
    toast("Annonce supprimée et signalement résolu.", "success");
  }

  function handleIgnore(id: string) {
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: "resolved" } : r));
    toast("Signalement ignoré.", "info");
  }

  function handleResolveAll() {
    setReports((prev) => prev.map((r) => r.status === "pending" ? { ...r, status: "resolved" } : r));
    toast(`${pending} signalement(s) marqué(s) comme résolus.`, "success");
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Signalements</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{pending} signalement(s) en attente</p>
        </div>
        {pending > 0 && (
          <button
            onClick={handleResolveAll}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors flex-shrink-0"
          >
            <CheckCircle className="w-4 h-4" /> Tout résoudre
          </button>
        )}
      </div>

      {/* Stats bar */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl px-4 py-2.5">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-sm font-bold text-red-600 dark:text-red-400">{pending} en attente</span>
        </div>
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-xl px-4 py-2.5">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-sm font-bold text-green-600 dark:text-green-400">{resolved} résolus</span>
        </div>
      </div>

      {/* Reports list */}
      <div className="space-y-3">
        {reports.map((r) => (
          <div
            key={r.id}
            className={`bg-white dark:bg-[#1e2430] rounded-2xl p-4 border transition-all ${
              r.status === "pending"
                ? "border-red-200 dark:border-red-900/40"
                : "border-slate-100 dark:border-[#2a3040] opacity-60"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  r.status === "pending"
                    ? "bg-red-100 dark:bg-red-900/20"
                    : "bg-green-100 dark:bg-green-900/20"
                }`}
              >
                <AlertTriangle
                  className={`w-4 h-4 ${r.status === "pending" ? "text-red-500" : "text-green-500"}`}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">{r.property}</p>
                  {r.status === "resolved" && (
                    <span className="text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full flex-shrink-0">
                      Résolu
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Signalé par {r.reporter} · {r.date}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{r.reason}</p>
                {r.status === "pending" && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                    >
                      <XCircle className="w-3 h-3" /> Supprimer annonce
                    </button>
                    <button
                      onClick={() => handleIgnore(r.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg border border-slate-200 dark:border-[#2a3040] text-slate-600 dark:text-slate-300 hover:border-green-500 hover:text-green-500 transition-colors"
                    >
                      <CheckCircle className="w-3 h-3" /> Ignorer
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
