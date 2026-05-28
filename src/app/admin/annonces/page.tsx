"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { CheckCircle, XCircle, Eye, Search, Download, Trash2, X, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatPrice, timeAgo } from "@/lib/utils";
import { toast } from "@/lib/toast";

// ─── Tokens ──────────────────────────────────────────────────────────────────
const SURFACE  = "var(--bl-surface)";
const BORDER   = "var(--color-border)";
const TEXT_PRI = "var(--bl-cream)";
const TEXT_SEC = "var(--bl-cream-dim)";
const ACCENT   = "#D4AF37";

// ─── Types ───────────────────────────────────────────────────────────────────
type DbStatus = "active" | "pending" | "paused" | "sold";

interface Property {
  id: string;
  title: string;
  status: DbStatus;
  price: number;
  price_period: string;
  type: string;
  neighborhood: string;
  views: number;
  contact_phone: string | null;
  owner_id: string;
  created_at: string;
  property_images: { url: string; is_primary: boolean; sort_order: number }[];
}

const STATUS_LABELS: Record<DbStatus, { label: string; color: string; bg: string }> = {
  active:  { label: "Actif",      color: "#D4AF37", bg: "rgba(212,175,55,0.12)" },
  pending: { label: "En attente", color: "#D4AF37", bg: "rgba(251,146,60,0.15)" },
  paused:  { label: "Suspendu",   color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
  sold:    { label: "Vendu",      color: TEXT_SEC,  bg: "rgba(255,255,255,0.06)" },
};

const STATUS_OPTIONS = [
  { value: "all",     label: "Tous" },
  { value: "active",  label: "Actifs" },
  { value: "pending", label: "En attente" },
  { value: "paused",  label: "Suspendus" },
  { value: "sold",    label: "Vendus" },
];

const NEIGHBORHOOD_LABELS: Record<string, string> = {
  kipe: "Kipé", lambanyi: "Lambanyi", ratoma: "Ratoma", sonfonia: "Sonfonia",
  cosa: "Cosa", hamdallaye: "Hamdallaye", nongo: "Nongo", taouyah: "Taouyah",
  dixinn: "Dixinn", matam: "Matam", madina: "Madina", kaloum: "Kaloum",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function exportCSV(properties: Property[]) {
  const headers = ["Titre", "Type", "Prix", "Quartier", "Statut", "Vues", "Date"];
  const rows = properties.map((p) => [
    `"${p.title.replace(/"/g, '""')}"`,
    p.type, p.price, p.neighborhood, p.status, p.views,
    new Date(p.created_at).toLocaleDateString("fr-FR"),
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url;
  a.download = "annonces-LogerBien.csv"; a.click();
  URL.revokeObjectURL(url);
  toast("Export CSV téléchargé !", "success");
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminAnnoncesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [confirmDelete, setConfirmDelete] = useState<Property | null>(null);

  const fetchProperties = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    // Corrected query: use * so admin can see all columns + images join
    const { data, error } = await supabase
      .from("properties")
      .select("*, property_images(url, is_primary, sort_order)")
      .order("created_at", { ascending: false });
    if (error) {
      toast("Erreur lors du chargement des annonces.", "error");
    } else {
      setProperties((data ?? []) as unknown as Property[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  async function adminAction(action: string, id: string): Promise<boolean> {
    try {
      const res = await fetch("/api/admin/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = (body as { error?: string }).error ?? `Erreur ${res.status}`;
        console.error(`[admin] ${action} failed:`, msg);
        toast(`Erreur : ${msg}`, "error");
        return false;
      }
      return true;
    } catch (err) {
      console.error(`[admin] ${action} fetch error:`, err);
      toast("Erreur réseau — vérifiez votre connexion.", "error");
      return false;
    }
  }

  async function handleApprove(id: string) {
    const ok = await adminAction("approve", id);
    if (!ok) return;
    setProperties((prev) => prev.map((p) => p.id === id ? { ...p, status: "active" as DbStatus } : p));
    toast("Annonce approuvée ✓", "success");
    // Recharge pour confirmer la mise à jour depuis Supabase
    setTimeout(() => fetchProperties(), 800);
  }

  async function handleSuspend(id: string) {
    const ok = await adminAction("suspend", id);
    if (!ok) return;
    setProperties((prev) => prev.map((p) => p.id === id ? { ...p, status: "paused" as DbStatus } : p));
    toast("Annonce suspendue ✓", "success");
    setTimeout(() => fetchProperties(), 800);
  }

  async function handleDelete(id: string) {
    const ok = await adminAction("delete", id);
    if (ok) {
      setProperties((prev) => prev.filter((p) => p.id !== id));
      toast("Annonce supprimée ✓", "success");
    }
    setConfirmDelete(null);
  }

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      const matchSearch = search === "" || p.title.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [properties, search, statusFilter]);

  function firstImage(p: Property) {
    const imgs = p.property_images ?? [];
    const primary = imgs.find((i) => i.is_primary);
    if (primary) return primary.url;
    return [...imgs].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null;
  }

  return (
    <div className="px-4 md:px-6" style={{ paddingTop: 28, paddingBottom: 40, maxWidth: 1200 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ color: TEXT_PRI, fontWeight: 900, fontSize: "clamp(20px,4vw,26px)" }}>Annonces</h1>
          <p style={{ color: TEXT_SEC, fontSize: 13, marginTop: 2 }}>
            {loading ? "Chargement…" : `${filtered.length} annonce(s) affichée(s)`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link
            href="/admin/annonces/nouvelle"
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: ACCENT, color: "white", fontSize: 13, fontWeight: 600,
              padding: "8px 14px", borderRadius: 10, textDecoration: "none", border: "none",
            }}
          >
            <Plus size={15} /> Ajouter
          </Link>
          <button
            onClick={() => exportCSV(properties)}
            disabled={loading || properties.length === 0}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "transparent", border: `1px solid ${BORDER}`,
              color: TEXT_SEC, fontSize: 13, fontWeight: 500, padding: "8px 14px",
              borderRadius: 10, cursor: "pointer", transition: "border-color 0.15s, color 0.15s",
              opacity: (loading || properties.length === 0) ? 0.4 : 1,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = ACCENT;
              (e.currentTarget as HTMLButtonElement).style.color = ACCENT;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = BORDER;
              (e.currentTarget as HTMLButtonElement).style.color = TEXT_SEC;
            }}
          >
            <Download size={15} /> CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: TEXT_SEC, pointerEvents: "none" }} />
          <input
            aria-label="Rechercher une annonce"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par titre…"
            style={{
              width: "100%", background: SURFACE, border: `1px solid ${BORDER}`,
              color: TEXT_PRI, borderRadius: 10, padding: "10px 12px 10px 36px",
              fontSize: 14, outline: "none", boxSizing: "border-box",
            }}
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = ACCENT; }}
            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = BORDER; }}
          />
        </div>
        <select
          aria-label="Filtrer par statut"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            background: SURFACE, border: `1px solid ${BORDER}`,
            color: TEXT_PRI, borderRadius: 10, padding: "10px 14px",
            fontSize: 14, outline: "none", cursor: "pointer",
          }}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 14, display: "flex", gap: 12, alignItems: "center", opacity: 1 - i * 0.15 }}>
              <div style={{ width: 60, height: 44, borderRadius: 8, background: "var(--border-subtle)" }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 12, width: 200, background: "var(--border-subtle)", borderRadius: 4, marginBottom: 6 }} />
                <div style={{ height: 10, width: 120, background: "var(--border-subtle)", borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 40, textAlign: "center" }}>
          <p style={{ color: TEXT_SEC, fontSize: 14 }}>Aucune annonce trouvée.</p>
        </div>
      )}

      {/* List */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((p) => {
            const img = firstImage(p);
            const s = STATUS_LABELS[p.status] ?? STATUS_LABELS.pending;
            const hood = NEIGHBORHOOD_LABELS[p.neighborhood] ?? p.neighborhood;
            return (
              <div
                key={p.id}
                style={{
                  background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12,
                  padding: "12px 14px",
                  opacity: p.status === "paused" ? 0.65 : 1,
                }}
              >
                {/* Desktop row / Mobile stacked */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  {/* Thumbnail */}
                  <div style={{ width: 60, height: 44, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "var(--border-subtle)" }}>
                    {img && <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <p style={{ color: TEXT_PRI, fontWeight: 600, fontSize: 14 }}>{p.title}</p>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                        color: s.color, background: s.bg,
                      }}>
                        {s.label}
                      </span>
                    </div>
                    <p style={{ color: TEXT_SEC, fontSize: 12, marginTop: 2 }}>
                      {hood} · {formatPrice(p.price)}{p.price_period === "month" ? "/mois" : ""} · {timeAgo(p.created_at)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <Link
                      href={`/annonces/${p.id}`}
                      target="_blank"
                      title="Voir l'annonce"
                      style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, background: "var(--border-subtle)", color: TEXT_SEC, textDecoration: "none", transition: "background 0.12s" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(212,175,55,0.18)"; (e.currentTarget as HTMLAnchorElement).style.color = ACCENT; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLAnchorElement).style.color = TEXT_SEC; }}
                    >
                      <Eye size={15} />
                    </Link>
                    <button
                      onClick={() => handleApprove(p.id)}
                      disabled={p.status === "active"}
                      title="Approuver"
                      style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, background: "rgba(212,175,55,0.12)", color: "#D4AF37", border: "none", cursor: "pointer", opacity: p.status === "active" ? 0.35 : 1, transition: "background 0.12s" }}
                      onMouseEnter={(e) => { if (p.status !== "active") (e.currentTarget as HTMLButtonElement).style.background = "rgba(212,175,55,0.25)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(212,175,55,0.12)"; }}
                    >
                      <CheckCircle size={15} />
                    </button>
                    <button
                      onClick={() => handleSuspend(p.id)}
                      disabled={p.status === "paused"}
                      title="Suspendre"
                      style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, background: `rgba(212,175,55,0.12)`, color: ACCENT, border: "none", cursor: "pointer", opacity: p.status === "paused" ? 0.35 : 1, transition: "background 0.12s" }}
                      onMouseEnter={(e) => { if (p.status !== "paused") (e.currentTarget as HTMLButtonElement).style.background = "rgba(212,175,55,0.25)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(212,175,55,0.12)"; }}
                    >
                      <XCircle size={15} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(p)}
                      title="Supprimer"
                      style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "none", cursor: "pointer", transition: "background 0.12s" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.25)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.12)"; }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete modal */}
      {confirmDelete && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setConfirmDelete(null)}
        >
          <div
            style={{ background: "var(--bl-surface)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: 16, padding: 24, maxWidth: 360, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Trash2 size={20} color="#ef4444" />
              </div>
              <button onClick={() => setConfirmDelete(null)} style={{ border: "none", background: "transparent", color: TEXT_SEC, cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>
            <h3 style={{ color: TEXT_PRI, fontWeight: 700, marginBottom: 6 }}>Supprimer cette annonce ?</h3>
            <p style={{ color: TEXT_SEC, fontSize: 13, marginBottom: 4, fontWeight: 500 }} className="line-clamp-2">{confirmDelete.title}</p>
            <p style={{ color: "#ef4444", fontSize: 12, marginBottom: 20 }}>Cette action est irréversible.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${BORDER}`, background: "transparent", color: TEXT_PRI, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.id)}
                style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "#ef4444", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
