"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { CheckCircle, Shield, Search, Trash2, X } from "lucide-react";
import { toast } from "@/lib/toast";
import { supabase } from "@/lib/supabase";

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  role: string | null;
  created_at: string | null;
  is_verified: boolean;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

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
    const { error } = await supabase
      .from("profiles")
      .update({ is_verified: true })
      .eq("id", id);
    if (error) {
      toast("Erreur lors de la vérification.", "error");
    } else {
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, is_verified: true } : u));
      toast("Utilisateur vérifié.", "success");
    }
  }

  async function handleDelete(id: string) {
    if (!supabase) return;
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", id);
    if (error) {
      toast("Erreur lors de la suppression.", "error");
    } else {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast("Utilisateur supprimé.", "success");
    }
    setConfirmDelete(null);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        (u.full_name ?? "").toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q) ||
        (u.phone ?? "").includes(q) ||
        (u.role ?? "").toLowerCase().includes(q)
    );
  }, [users, search]);

  const ROLE_LABELS: Record<string, string> = {
    buyer: "Chercheur",
    owner: "Propriétaire",
    agent: "Agent",
    agency: "Agence",
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Utilisateurs</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          {loading ? "Chargement…" : `${filtered.length} utilisateur(s)`}
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          id="search-users"
          aria-label="Rechercher un utilisateur"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, email, téléphone, rôle…"
          className="w-full bg-white dark:bg-[#1e2430] border border-slate-200 dark:border-[#2a3040] rounded-xl pl-9 pr-4 py-2.5 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F97316]"
        />
      </div>

      <div className="space-y-3">
        {/* Loading skeleton */}
        {loading && (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#1e2430] rounded-2xl p-4 border border-slate-100 dark:border-[#2a3040] flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-2xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-3 w-64 bg-slate-100 dark:bg-slate-800 rounded" />
              </div>
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg" />
              </div>
            </div>
          ))
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-8 border border-slate-100 dark:border-[#2a3040] text-center">
            <p className="text-slate-400 text-sm">Aucun utilisateur trouvé.</p>
          </div>
        )}

        {/* User rows */}
        {!loading && filtered.map((u) => (
          <div
            key={u.id}
            className="bg-white dark:bg-[#1e2430] rounded-2xl p-4 border border-slate-100 dark:border-[#2a3040] flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-[#F97316] to-[#EA6C0A] rounded-2xl flex items-center justify-center text-white font-bold flex-shrink-0">
              {(u.full_name ?? u.email ?? "?").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-slate-900 dark:text-white text-sm">
                  {u.full_name || "Sans nom"}
                </p>
                {u.is_verified && (
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                )}
                {u.role && (
                  <span className="text-[10px] font-bold bg-slate-100 dark:bg-[#2a3040] text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
                    {ROLE_LABELS[u.role] ?? u.role}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate">
                {u.email ?? "—"}{u.phone ? ` · ${u.phone}` : ""} · Inscrit le {formatDate(u.created_at)}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {!u.is_verified && (
                <button
                  onClick={() => handleVerify(u.id)}
                  title="Vérifier"
                  className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-500 hover:text-white transition-colors"
                >
                  <Shield className="w-3.5 h-3.5" />
                </button>
              )}
              {u.is_verified && (
                <button
                  disabled
                  title="Déjà vérifié"
                  className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center text-green-600 opacity-50 cursor-not-allowed"
                >
                  <Shield className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setConfirmDelete(u)}
                title="Supprimer"
                className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="bg-white dark:bg-[#1e2430] rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-red-200 dark:border-red-900/40"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <button onClick={() => setConfirmDelete(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <h3 className="font-black text-slate-900 dark:text-white mb-1">Supprimer cet utilisateur ?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">
              <span className="font-semibold text-slate-700 dark:text-slate-200">{confirmDelete.full_name || confirmDelete.email}</span>
            </p>
            <p className="text-xs text-red-500 mb-5">Cette action est irréversible. Le profil sera définitivement supprimé.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-[#2a3040] text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-[#151922]"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.id)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
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
