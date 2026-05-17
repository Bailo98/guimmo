"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { CheckCircle, Shield, Search, Trash2, X } from "lucide-react";
import { toast } from "@/lib/toast";
import { supabase } from "@/lib/supabase";

// ─── Tokens ──────────────────────────────────────────────────────────────────
const SURFACE  = "#0f2210";
const BORDER   = "rgba(134,239,172,0.08)";
const TEXT_PRI = "#f0fdf4";
const TEXT_SEC = "rgba(187,247,208,0.55)";
const ACCENT   = "#f97316";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  role: string | null;
  created_at: string | null;
  is_verified: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  buyer: "Chercheur", owner: "Propriétaire", agent: "Agent",
  agency: "Agence", admin: "Admin",
};

const ROLE_COLORS: Record<string, string> = {
  buyer: TEXT_SEC, owner: "#22c55e", agent: "#60a5fa",
  agency: "#a78bfa", admin: ACCENT,
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminUtilisateursPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Profile | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast("Erreur lors du chargement des utilisateurs.", "error");
    } else {
      setUsers(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleVerify(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from("profiles").update({ is_verified: true }).eq("id", id);
    if (error) { toast("Erreur lors de la vérification.", "error"); return; }
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, is_verified: true } : u));
    toast("Utilisateur vérifié.", "success");
  }

  async function handleDelete(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) { toast("Erreur lors de la suppression.", "error"); }
    else {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast("Utilisateur supprimé.", "success");
    }
    setConfirmDelete(null);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter((u) =>
      (u.full_name ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q) ||
      (u.phone ?? "").includes(q) ||
      (u.role ?? "").toLowerCase().includes(q)
    );
  }, [users, search]);

  return (
    <div className="px-4 md:px-6" style={{ paddingTop: 28, paddingBottom: 40, maxWidth: 1200 }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: TEXT_PRI, fontWeight: 900, fontSize: "clamp(20px,4vw,26px)" }}>Utilisateurs</h1>
        <p style={{ color: TEXT_SEC, fontSize: 13, marginTop: 2 }}>
          {loading ? "Chargement…" : `${filtered.length} utilisateur(s)`}
        </p>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: TEXT_SEC, pointerEvents: "none" }} />
        <input
          aria-label="Rechercher un utilisateur"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, email, téléphone, rôle…"
          style={{
            width: "100%", background: SURFACE, border: `1px solid ${BORDER}`,
            color: TEXT_PRI, borderRadius: 10, padding: "10px 12px 10px 36px",
            fontSize: 14, outline: "none", boxSizing: "border-box",
          }}
          onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = ACCENT; }}
          onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = BORDER; }}
        />
      </div>

      {/* Skeletons */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 14, display: "flex", gap: 12, alignItems: "center", opacity: 1 - i * 0.15 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(240,230,204,0.06)" }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 12, width: 160, background: "rgba(240,230,204,0.06)", borderRadius: 4, marginBottom: 6 }} />
                <div style={{ height: 10, width: 240, background: "rgba(240,230,204,0.04)", borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 40, textAlign: "center" }}>
          <p style={{ color: TEXT_SEC, fontSize: 14 }}>Aucun utilisateur trouvé.</p>
        </div>
      )}

      {/* List */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((u) => {
            const roleColor = ROLE_COLORS[u.role ?? ""] ?? TEXT_SEC;
            const initials = (u.full_name ?? u.email ?? "?").charAt(0).toUpperCase();
            return (
              <div key={u.id} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  {/* Avatar */}
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                    background: "rgba(200,144,30,0.20)", color: ACCENT,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 16,
                  }}>
                    {initials}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <p style={{ color: TEXT_PRI, fontWeight: 600, fontSize: 14 }}>
                        {u.full_name || "Sans nom"}
                      </p>
                      {u.is_verified && (
                        <CheckCircle size={14} color="#22c55e" />
                      )}
                      {u.role && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, color: roleColor, background: `${roleColor}18` }}>
                          {ROLE_LABELS[u.role] ?? u.role}
                        </span>
                      )}
                    </div>
                    <p style={{ color: TEXT_SEC, fontSize: 12, marginTop: 2 }}>
                      {u.email ?? "—"}{u.phone ? ` · ${u.phone}` : ""} · {formatDate(u.created_at)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => !u.is_verified && handleVerify(u.id)}
                      disabled={u.is_verified}
                      title={u.is_verified ? "Déjà vérifié" : "Vérifier"}
                      style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, background: "rgba(96,165,250,0.12)", color: "#60a5fa", border: "none", cursor: u.is_verified ? "default" : "pointer", opacity: u.is_verified ? 0.35 : 1 }}
                    >
                      <Shield size={15} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(u)}
                      title="Supprimer"
                      style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "none", cursor: "pointer" }}
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

      <p style={{ color: TEXT_SEC, fontSize: 11, marginTop: 16 }}>
        * La suppression retire le profil de la plateforme.
      </p>

      {/* Delete modal */}
      {confirmDelete && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setConfirmDelete(null)}
        >
          <div
            style={{ background: "#0f2210", border: "1px solid rgba(239,68,68,0.35)", borderRadius: 16, padding: 24, maxWidth: 360, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
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
            <h3 style={{ color: TEXT_PRI, fontWeight: 700, marginBottom: 6 }}>Supprimer cet utilisateur ?</h3>
            <p style={{ color: TEXT_SEC, fontSize: 13, marginBottom: 4 }}>{confirmDelete.full_name || confirmDelete.email}</p>
            <p style={{ color: "#ef4444", fontSize: 12, marginBottom: 20 }}>Cette action est irréversible.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${BORDER}`, background: "transparent", color: TEXT_PRI, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                Annuler
              </button>
              <button onClick={() => handleDelete(confirmDelete.id)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "#ef4444", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
