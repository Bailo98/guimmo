"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, CheckCircle, EyeOff, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";

// ─── Tokens ──────────────────────────────────────────────────────────────────
const SURFACE  = "#111a1f";
const BORDER   = "#1e2a30";
const TEXT_PRI = "#ffffff";
const TEXT_SEC = "rgba(255,255,255,0.55)";

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
  fraud:         "Annonce frauduleuse / arnaque",
  already_taken: "Logement déjà loué / vendu",
  fake_photos:   "Photos fausses ou volées",
  wrong_price:   "Prix incorrect",
  other:         "Autre",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminSignalementsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]       = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("reports")
      .select("*, properties(title)")
      .eq("is_handled", false)
      .order("created_at", { ascending: false });
    if (error) {
      toast("Erreur de chargement", "error");
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setReports((data ?? []).map((r: any) => ({ ...r, property_title: r.properties?.title ?? null })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  async function reportAction(action: string, payload: Record<string, unknown>): Promise<boolean> {
    try {
      const res = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = (body as { error?: string }).error ?? `Erreur ${res.status}`;
        console.error(`[admin] reports/${action} failed:`, msg);
        toast(`Erreur : ${msg}`, "error");
        return false;
      }
      return true;
    } catch (err) {
      console.error(`[admin] reports/${action} fetch error:`, err);
      toast("Erreur réseau — vérifiez votre connexion.", "error");
      return false;
    }
  }

  async function handleMasquer(r: Report) {
    setBusy(r.id + "-masquer");
    const ok = await reportAction("masquer", { id: r.id, propertyId: r.property_id });
    if (ok) {
      setReports((prev) => prev.filter((x) => x.id !== r.id));
      toast("Annonce masquée et signalement supprimé ✓", "success");
    }
    setBusy(null);
  }

  async function handleIgnorer(r: Report) {
    setBusy(r.id + "-ignorer");
    const ok = await reportAction("ignorer", { id: r.id });
    if (ok) {
      setReports((prev) => prev.filter((x) => x.id !== r.id));
      toast("Signalement marqué comme traité ✓", "success");
    }
    setBusy(null);
  }

  async function handleIgnoreAll() {
    if (reports.length === 0) return;
    setBusy("all");
    const count = reports.length;
    const ok = await reportAction("ignore-all", {});
    if (ok) {
      setReports([]);
      toast(`${count} signalement(s) traité(s) ✓`, "success");
    }
    setBusy(null);
  }

  return (
    <div style={{ padding: "28px 24px 40px", maxWidth: 1200 }} className="px-4 md:px-6">

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ color: TEXT_PRI, fontWeight: 900, fontSize: "clamp(20px,4vw,26px)" }}>Signalements</h1>
          <p style={{ color: TEXT_SEC, fontSize: 13, marginTop: 2 }}>
            {loading ? "Chargement…" : `${reports.length} signalement(s)`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => load()}
            disabled={loading}
            title="Actualiser"
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 10,
              border: `1px solid ${BORDER}`, background: "transparent",
              color: TEXT_SEC, fontSize: 13, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
            }}
          >
            <RefreshCw size={15} style={{ animation: loading ? "spin 0.8s linear infinite" : "none" }} />
            Actualiser
          </button>
          {reports.length > 0 && !loading && (
            <button
              onClick={handleIgnoreAll}
              disabled={busy === "all"}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 10,
                border: `1px solid ${BORDER}`, background: "transparent",
                color: TEXT_PRI, fontSize: 13, fontWeight: 600,
                cursor: "pointer",
                opacity: busy === "all" ? 0.5 : 1,
              }}
            >
              <CheckCircle size={15} /> Ignorer tout
            </button>
          )}
        </div>
      </div>

      {/* Stats badge */}
      {!loading && reports.length > 0 && (
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.20)",
            borderRadius: 10, padding: "8px 14px",
          }}>
            <AlertTriangle size={15} color="#ef4444" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>{reports.length} en attente</span>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid #D4AF37", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
        </div>
      )}

      {/* Empty */}
      {!loading && reports.length === 0 && (
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 48, textAlign: "center" }}>
          <CheckCircle size={40} color="#D4AF37" style={{ margin: "0 auto 12px" }} />
          <p style={{ color: TEXT_SEC, fontWeight: 600, fontSize: 14 }}>Aucun signalement en attente</p>
        </div>
      )}

      {/* List */}
      {!loading && reports.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {reports.map((r) => {
            const isBusy = busy?.startsWith(r.id);
            return (
              <div
                key={r.id}
                style={{
                  background: SURFACE, border: "1px solid rgba(239,68,68,0.20)",
                  borderRadius: 12, padding: 16,
                  opacity: isBusy ? 0.5 : 1, transition: "opacity 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  {/* Icon */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: "rgba(239,68,68,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <AlertTriangle size={16} color="#ef4444" />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: TEXT_PRI, fontWeight: 600, fontSize: 14 }}>
                      {r.property_title ?? "Annonce inconnue"}
                    </p>
                    <p style={{ color: TEXT_SEC, fontSize: 12, marginTop: 2 }}>
                      {formatDate(r.created_at)}{r.reporter_phone ? ` · ${r.reporter_phone}` : ""}
                    </p>
                    <p style={{ color: TEXT_PRI, fontSize: 13, marginTop: 6, fontWeight: 500 }}>
                      {REASON_LABELS[r.reason] ?? r.reason}
                    </p>
                    {r.details && (
                      <p style={{ color: TEXT_SEC, fontSize: 12, marginTop: 4, fontStyle: "italic" }}>{r.details}</p>
                    )}

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button
                        onClick={() => handleMasquer(r)}
                        disabled={!!busy}
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          padding: "6px 12px", borderRadius: 8,
                          border: "none", background: "#ef4444",
                          color: "white", fontSize: 12, fontWeight: 600,
                          cursor: busy ? "not-allowed" : "pointer",
                          opacity: busy ? 0.5 : 1,
                        }}
                      >
                        {busy === r.id + "-masquer"
                          ? <Loader2 size={12} style={{ animation: "spin 0.8s linear infinite" }} />
                          : <EyeOff size={12} />}
                        Masquer l&apos;annonce
                      </button>
                      <button
                        onClick={() => handleIgnorer(r)}
                        disabled={!!busy}
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          padding: "6px 12px", borderRadius: 8,
                          border: `1px solid ${BORDER}`, background: "transparent",
                          color: TEXT_PRI, fontSize: 12, fontWeight: 600,
                          cursor: busy ? "not-allowed" : "pointer",
                          opacity: busy ? 0.5 : 1,
                        }}
                      >
                        {busy === r.id + "-ignorer"
                          ? <Loader2 size={12} style={{ animation: "spin 0.8s linear infinite" }} />
                          : <CheckCircle size={12} />}
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
