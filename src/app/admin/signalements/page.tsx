"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, CheckCircle, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";

interface Report {
  id: string;
  property_id: string | null;
  reason: string;
  details: string | null;
  reporter_phone: string | null;
  created_at: string;
  property_title?: string | null;
}

const REASON_LABELS: Record<string, string> = {
  fraud:        "Annonce frauduleuse / arnaque",
  already_taken:"Logement déjà loué / vendu",
  fake_photos:  "Photos fausses ou volées",
  wrong_price:  "Prix incorrect",
  other:        "Autre",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminSignalementsPage() {
  const [reports, setReports]   = useState<Report[]>([]);
  const [loading, setLoading]   = useState(true);
  const [busy, setBusy]         = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("reports")
      .select("*, properties(title)")
      .order("created_at", { ascending: false });
    if (error) {
      toast("Erreur de chargement", "error");
    } else {
      setReports(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (data ?? []).map((r: any) => ({
          ...r,
          property_title: r.properties?.title ?? null,
        }))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleMasquer(r: Report) {
    if (!supabase) return;
    setBusy(r.id + "-masquer");
    await supabase.from("reports").delete().eq("id", r.id);
    if (r.property_id) {
      await supabase.from("properties").update({ status: "archived" }).eq("id", r.property_id);
    }
    setReports((prev) => prev.filter((x) => x.id !== r.id));
    toast("✅ Annonce masquée et signalement supprimé", "success");
    setBusy(null);
  }

  async function handleIgnorer(r: Report) {
    if (!supabase) return;
    setBusy(r.id + "-ignorer");
    const { error } = await supabase.from("reports").delete().eq("id", r.id);
    if (error) {
      toast("Erreur", "error");
    } else {
      setReports((prev) => prev.filter((x) => x.id !== r.id));
      toast("Signalement ignoré", "success");
    }
    setBusy(null);
  }

  async function handleIgnoreAll() {
    if (!supabase || reports.length === 0) return;
    setBusy("all");
    await supabase.from("reports").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    setReports([]);
    toast(`${reports.length} signalement(s) ignoré(s)`, "success");
    setBusy(null);
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Signalements</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {loading ? "Chargement…" : `${reports.length} signalement(s)`}
          </p>
        </div>
        {reports.length > 0 && !loading && (
          <button
            onClick={handleIgnoreAll}
            disabled={busy === "all"}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-slate-200 dark:bg-[#2a3040] text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-[#3a4050] transition-colors flex-shrink-0"
          >
            <CheckCircle className="w-4 h-4" /> Ignorer tout
          </button>
        )}
      </div>

      {/* Stats bar */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl px-4 py-2.5">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span className="text-sm font-bold text-red-600 dark:text-red-400">{reports.length} en attente</span>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-12 border border-slate-100 dark:border-[#2a3040] text-center">
          <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-semibold">Aucun signalement en attente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            const isBusy = busy?.startsWith(r.id);
            return (
              <div
                key={r.id}
                className={`bg-white dark:bg-[#1e2430] rounded-2xl p-4 border border-red-200 dark:border-red-900/40 transition-opacity ${isBusy ? "opacity-50" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">
                      {r.property_title ?? "Annonce inconnue"}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatDate(r.created_at)}
                      {r.reporter_phone && ` · ${r.reporter_phone}`}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 font-medium">
                      {REASON_LABELS[r.reason] ?? r.reason}
                    </p>
                    {r.details && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 italic">{r.details}</p>
                    )}

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleMasquer(r)}
                        disabled={!!busy}
                        className="flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-40"
                      >
                        {busy === r.id + "-masquer" ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <EyeOff className="w-3 h-3" />
                        )}
                        Masquer l&apos;annonce
                      </button>
                      <button
                        onClick={() => handleIgnorer(r)}
                        disabled={!!busy}
                        className="flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg border border-slate-200 dark:border-[#2a3040] text-slate-600 dark:text-slate-300 hover:border-green-500 hover:text-green-500 transition-colors disabled:opacity-40"
                      >
                        {busy === r.id + "-ignorer" ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3 h-3" />
                        )}
                        Ignorer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
