"use client";

import { useCallback, useEffect, useState } from "react";
import { Flag, CheckCircle, XCircle, RefreshCw, BadgeCheck } from "lucide-react";
import { toast } from "@/lib/toast";
import { supabase } from "@/lib/supabase";
import { getNeighborhoodName } from "@/data/neighborhoods";
import { formatPrice } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";

const TYPE_LABELS: Record<string, string> = {
  apartment: "Appartement", studio: "Studio", villa: "Villa",
  house: "Maison", room: "Chambre", office: "Bureau",
  shop: "Boutique", land: "Terrain",
};

const ACCENT = "#D4AF37";
const S_CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: "14px 16px",
};

interface PendingProperty {
  id: string;
  title: string;
  type: string;
  neighborhood: string;
  price: number;
  price_period: string | null;
  transaction_type: string | null;
  contact_phone: string | null;
  created_at: string;
  owner_id: string | null;
}

interface Report {
  id: string;
  property_id: string | null;
  reporter_id: string | null;
  reason: string | null;
  created_at: string;
  resolved: boolean | null;
  property?: { title: string } | null;
  reporter?: { full_name: string | null; email: string | null } | null;
}


function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminModerationPage() {
  const [pending, setPending]         = useState<PendingProperty[]>([]);
  const [reports, setReports]         = useState<Report[]>([]);
  const [loading, setLoading]         = useState(true);
  const [actionId, setActionId]       = useState<string | null>(null);
  const [tab, setTab]                 = useState<"pending" | "reports">("pending");
  const [rejectId, setRejectId]       = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const [propRes, repRes] = await Promise.all([
      supabase
        .from("properties")
        .select("id,title,type,neighborhood,price,price_period,transaction_type,contact_phone,created_at,owner_id")
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
      supabase
        .from("reports")
        .select("id,property_id,reporter_id,reason,created_at,resolved,property:properties(title),reporter:profiles(full_name,email)")
        .eq("resolved", false)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    setPending((propRes.data ?? []) as PendingProperty[]);
    setReports((repRes.data ?? []) as unknown as Report[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function approve(prop: PendingProperty) {
    if (!supabase) return;
    setActionId(prop.id);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from("properties")
      .update({ status: "active", expires_at: expiresAt })
      .eq("id", prop.id);
    if (error) { toast(`Erreur : ${error.message}`, "error"); }
    else {
      setPending((p) => p.filter((x) => x.id !== prop.id));
      toast("✅ Annonce approuvée et publiée", "success");
      // Notify owner
      if (prop.owner_id) {
        await createNotification({
          userId: prop.owner_id,
          type: "listing_approved",
          title: "✅ Annonce approuvée",
          body: `Votre annonce "${prop.title}" est maintenant publiée.`,
          data: { property_id: prop.id },
        });
      }
    }
    setActionId(null);
  }

  async function reject(prop: PendingProperty) {
    const reason = rejectReason.trim() || "Non conforme à nos conditions d'utilisation";
    if (!supabase) return;
    setActionId(prop.id);
    const { error } = await supabase
      .from("properties")
      .update({ status: "archived", rejection_reason: reason })
      .eq("id", prop.id);
    if (error) { toast(`Erreur : ${error.message}`, "error"); }
    else {
      setPending((p) => p.filter((x) => x.id !== prop.id));
      setRejectId(null);
      setRejectReason("");
      toast("Annonce rejetée", "info");
      // Notify owner
      if (prop.owner_id) {
        await createNotification({
          userId: prop.owner_id,
          type: "listing_rejected",
          title: "❌ Annonce rejetée",
          body: `Votre annonce "${prop.title}" n'a pas été approuvée. Raison : ${reason}`,
          data: { property_id: prop.id, reason },
        });
      }
    }
    setActionId(null);
  }

  async function markVerified(prop: PendingProperty) {
    if (!supabase) return;
    setActionId(prop.id);
    const { data } = await supabase.from("properties").select("badges").eq("id", prop.id).single();
    const current: string[] = Array.isArray((data as { badges?: string[] } | null)?.badges)
      ? (data as { badges: string[] }).badges
      : [];
    const updated = current.includes("verifie") ? current : [...current, "verifie"];
    const { error } = await supabase.from("properties").update({ badges: updated }).eq("id", prop.id);
    if (error) toast(`Erreur : ${error.message}`, "error");
    else toast("✅ Badge vérifié ajouté à l'annonce", "success");
    setActionId(null);
  }

  async function resolveReport(report: Report, action: "keep" | "remove") {
    if (!supabase) return;
    setActionId(report.id);
    await supabase.from("reports").update({ resolved: true }).eq("id", report.id);
    if (action === "remove" && report.property_id) {
      await supabase.from("properties").update({ status: "archived" }).eq("id", report.property_id);
    }
    setReports((r) => r.filter((x) => x.id !== report.id));
    toast(action === "keep" ? "Signalement résolu — annonce maintenue" : "Annonce retirée", action === "keep" ? "success" : "info");
    setActionId(null);
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "10px 16px",
    borderRadius: 10,
    border: "none",
    background: active ? ACCENT : "transparent",
    color: active ? "#fff" : "rgba(255,255,255,0.55)",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    transition: "background 0.15s, color 0.15s",
  });

  return (
    <div style={{ padding: "24px 20px", maxWidth: 860, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: 24, margin: "0 0 4px" }}>
          Modération
        </h1>
        <p style={{ color: "#666666", fontSize: 13, margin: 0 }}>
          Annonces en attente d&apos;approbation et signalements
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "var(--border-subtle)", borderRadius: 12, padding: 4, marginBottom: 20 }}>
        <button style={tabStyle(tab === "pending")} onClick={() => setTab("pending")}>
          En attente
          {pending.length > 0 && (
            <span style={{ marginLeft: 8, background: "rgba(255,255,255,0.25)", borderRadius: 999, fontSize: 11, padding: "1px 7px" }}>
              {pending.length}
            </span>
          )}
        </button>
        <button style={tabStyle(tab === "reports")} onClick={() => setTab("reports")}>
          Signalements
          {reports.length > 0 && (
            <span style={{ marginLeft: 8, background: "rgba(239,68,68,0.35)", borderRadius: 999, fontSize: 11, padding: "1px 7px" }}>
              {reports.length}
            </span>
          )}
        </button>
        <button
          onClick={load}
          style={{ padding: "8px 12px", borderRadius: 10, border: "none", background: "transparent", color: "rgba(134,239,172,0.4)", cursor: "pointer" }}
          title="Actualiser"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <div style={{ width: 32, height: 32, border: `2px solid ${ACCENT}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : tab === "pending" ? (

        /* ── Pending listings ── */
        pending.length === 0 ? (
          <div style={{ ...S_CARD, textAlign: "center", padding: "48px 20px" }}>
            <CheckCircle size={32} style={{ color: "#D4AF37", margin: "0 auto 12px", display: "block" }} />
            <p style={{ color: "var(--text-primary)", fontWeight: 700, marginBottom: 4 }}>File vide !</p>
            <p style={{ color: "#666666", fontSize: 13 }}>Toutes les annonces ont été traitées.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pending.map((prop) => {
              const busy = actionId === prop.id;
              return (
                <div key={prop.id} style={{ ...S_CARD, opacity: busy ? 0.6 : 1, transition: "opacity 0.2s" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
                        <p style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 15, margin: 0 }}>{prop.title}</p>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: "rgba(212,175,55,0.15)", color: ACCENT }}>
                          {TYPE_LABELS[prop.type] ?? prop.type}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: "var(--border-subtle)", color: "var(--text-primary-dim)" }}>
                          {prop.transaction_type === "rent" ? "Location" : "Vente"}
                        </span>
                      </div>
                      <p style={{ color: "#666666", fontSize: 12, margin: "0 0 4px" }}>
                        {getNeighborhoodName(prop.neighborhood)}, Conakry · {formatPrice(prop.price, "GNF", prop.price_period)} · {fmtDate(prop.created_at)}
                      </p>
                      {prop.contact_phone && (
                        <p style={{ color: "#666666", fontSize: 11, margin: 0 }}>
                          📞 {prop.contact_phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button
                      disabled={busy}
                      onClick={() => approve(prop)}
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 14px", borderRadius: 10, border: "none", background: "#D4AF37", color: "#0A1216", fontWeight: 700, fontSize: 13, cursor: busy ? "not-allowed" : "pointer" }}
                    >
                      <CheckCircle size={15} /> Approuver
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => markVerified(prop)}
                      title="Ajouter le badge vérifié à cette annonce"
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 14px", borderRadius: 10, background: "rgba(34,197,94,0.12)", color: "#22c55e", fontWeight: 700, fontSize: 13, cursor: busy ? "not-allowed" : "pointer", border: "1px solid rgba(34,197,94,0.25)", whiteSpace: "nowrap" } as React.CSSProperties}
                    >
                      <BadgeCheck size={15} /> Vérifier
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => { setRejectId(prop.id); setRejectReason(""); }}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 14px", borderRadius: 10, background: "rgba(239,68,68,0.12)", color: "#f87171", fontWeight: 700, fontSize: 13, cursor: busy ? "not-allowed" : "pointer", border: "1px solid rgba(239,68,68,0.25)" } as React.CSSProperties}
                    >
                      <XCircle size={15} /> Rejeter
                    </button>
                    <a
                      href={`/annonces/${prop.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ padding: "9px 14px", borderRadius: 10, border: "1px solid var(--border)", color: "var(--text-primary-dim)", fontWeight: 600, fontSize: 12, textDecoration: "none", whiteSpace: "nowrap" }}
                    >
                      Voir →
                    </a>
                  </div>
                  {/* Inline rejection reason */}
                  {rejectId === prop.id && (
                    <div style={{ marginTop: 10, padding: "12px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.20)", borderRadius: 10 }}>
                      <p style={{ color: "#f87171", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Raison du rejet</p>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Ex : photos insuffisantes, prix anormal, description trop courte…"
                        rows={2}
                        style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "8px 10px", color: "var(--text-primary)", fontSize: 12, resize: "none", outline: "none", boxSizing: "border-box" }}
                      />
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <button
                          onClick={() => reject(prop)}
                          style={{ flex: 1, padding: "7px 12px", borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}
                        >
                          Confirmer le rejet
                        </button>
                        <button
                          onClick={() => { setRejectId(null); setRejectReason(""); }}
                          style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-primary-dim)", fontWeight: 600, fontSize: 12, cursor: "pointer" }}
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )

      ) : (

        /* ── Reports ── */
        reports.length === 0 ? (
          <div style={{ ...S_CARD, textAlign: "center", padding: "48px 20px" }}>
            <Flag size={32} style={{ color: "rgba(255,255,255,0.25)", margin: "0 auto 12px", display: "block" }} />
            <p style={{ color: "var(--text-primary)", fontWeight: 700, marginBottom: 4 }}>Aucun signalement en attente</p>
            <p style={{ color: "#666666", fontSize: 13 }}>Tous les signalements ont été traités.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {reports.map((rep) => {
              const busy = actionId === rep.id;
              const reporterName = (rep.reporter as { full_name?: string | null; email?: string | null } | null)?.full_name
                ?? (rep.reporter as { full_name?: string | null; email?: string | null } | null)?.email
                ?? "Anonyme";
              const propTitle = (rep.property as { title?: string } | null)?.title ?? rep.property_id ?? "Annonce inconnue";
              return (
                <div key={rep.id} style={{ ...S_CARD, borderColor: "rgba(239,68,68,0.25)", opacity: busy ? 0.6 : 1 }}>
                  <div style={{ marginBottom: 10 }}>
                    <p style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 14, margin: "0 0 3px" }}>{propTitle}</p>
                    <p style={{ color: "#f87171", fontSize: 12, margin: "0 0 2px" }}>{rep.reason ?? "Raison non précisée"}</p>
                    <p style={{ color: "#666666", fontSize: 11, margin: 0 }}>
                      Signalé par {reporterName} · {fmtDate(rep.created_at)}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      disabled={busy}
                      onClick={() => resolveReport(rep, "keep")}
                      style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: "none", background: "rgba(212,175,55,0.12)", color: "#D4AF37", fontWeight: 700, fontSize: 13, cursor: busy ? "not-allowed" : "pointer" }}
                    >
                      Maintenir l&apos;annonce
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => resolveReport(rep, "remove")}
                      style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: "none", background: "rgba(239,68,68,0.12)", color: "#f87171", fontWeight: 700, fontSize: 13, cursor: busy ? "not-allowed" : "pointer" } as React.CSSProperties}
                    >
                      Retirer l&apos;annonce
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
