"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { CheckCircle, XCircle, Eye, Search, Download, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatPrice, timeAgo } from "@/lib/utils";
import { toast } from "@/lib/toast";

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
  created_at: string;
  profiles: { full_name: string | null }[] | null;
  property_images: { url: string; position: number }[];
}

const STATUS_LABELS: Record<DbStatus, { label: string; classes: string }> = {
  active:  { label: "Actif",       classes: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" },
  pending: { label: "En attente",  classes: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-500" },
  paused:  { label: "Suspendu",    classes: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" },
  sold:    { label: "Vendu",       classes: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400" },
};

const STATUS_FILTER_OPTIONS = [
  { value: "all",     label: "Tous" },
  { value: "active",  label: "Actif" },
  { value: "pending", label: "En attente" },
  { value: "paused",  label: "Suspendu" },
  { value: "sold",    label: "Vendu" },
];

function exportCSV(properties: Property[]) {
  const headers = ["Titre", "Propriétaire", "Type", "Prix", "Quartier", "Statut", "Vues"];
  const rows = properties.map((p) => [
    `"${p.title.replace(/"/g, '""')}"`,
    `"${(p.profiles?.[0]?.full_name ?? "—").replace(/"/g, '""')}"`,
    p.type,
    p.price,
    p.neighborhood,
    p.status,
    p.views,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "annonces-logerbien.csv";
  a.click();
  URL.revokeObjectURL(url);
  toast("Export CSV téléchargé !", "success");
}

export default function AdminAnnoncesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [confirmDelete, setConfirmDelete] = useState<Property | null>(null);

  const fetchProperties = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("properties")
      .select("id, title, status, price, price_period, type, neighborhood, views, created_at, profiles(full_name), property_images(url, position)")
      .order("created_at", { ascending: false });
    if (error) {
      toast("Erreur lors du chargement des annonces.", "error");
    } else {
      setProperties((data ?? []) as unknown as Property[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  async function handleApprove(id: string) {
    if (!supabase) return;
    const { error } = await supabase
      .from("properties")
      .update({ status: "active" })
      .eq("id", id);
    if (error) {
      toast("Erreur lors de l'approbation.", "error");
    } else {
      setProperties((prev) => prev.map((p) => p.id === id ? { ...p, status: "active" } : p));
      toast("Annonce approuvée.", "success");
    }
  }

  async function handleSuspend(id: string) {
    if (!supabase) return;
    const { error } = await supabase
      .from("properties")
      .update({ status: "paused" })
      .eq("id", id);
    if (error) {
      toast("Erreur lors de la suspension.", "error");
    } else {
      setProperties((prev) => prev.map((p) => p.id === id ? { ...p, status: "paused" } : p));
      toast("Annonce suspendue.", "success");
    }
  }

  async function handleDelete(id: string) {
    if (!supabase) return;
    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", id);
    if (error) {
      toast("Erreur lors de la suppression.", "error");
    } else {
      setProperties((prev) => prev.filter((p) => p.id !== id));
      toast("Annonce supprimée.", "success");
    }
    setConfirmDelete(null);
  }

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      const ownerName = p.profiles?.[0]?.full_name ?? "";
      const matchesSearch =
        search === "" ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        ownerName.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [properties, search, statusFilter]);

  const firstImage = (p: Property) => {
    const sorted = [...p.property_images].sort((a, b) => a.position - b.position);
    return sorted[0]?.url ?? null;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Gestion des annonces</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {loading ? "Chargement…" : `${filtered.length} annonce(s) affichée(s)`}
          </p>
        </div>
        <button
          onClick={() => exportCSV(properties)}
          disabled={loading || properties.length === 0}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border border-slate-200 dark:border-[#2a3040] text-slate-600 dark:text-slate-300 hover:border-[#F97316] hover:text-[#F97316] transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Exporter CSV
        </button>
      </div>

      {/* Search + Status filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            id="search-annonces"
            aria-label="Rechercher une annonce"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par titre ou propriétaire…"
            className="w-full bg-white dark:bg-[#1e2430] border border-slate-200 dark:border-[#2a3040] rounded-xl pl-9 pr-4 py-2.5 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F97316]"
          />
        </div>
        <select
          aria-label="Filtrer par statut"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white dark:bg-[#1e2430] border border-slate-200 dark:border-[#2a3040] rounded-xl px-4 py-2.5 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F97316]"
        >
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {/* Loading skeleton */}
        {loading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-[#1e2430] rounded-2xl p-4 border border-slate-100 dark:border-[#2a3040] flex items-center gap-3 animate-pulse">
            <div className="w-16 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800 rounded" />
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg" />
              ))}
            </div>
          </div>
        ))}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-8 border border-slate-100 dark:border-[#2a3040] text-center">
            <p className="text-slate-400 text-sm">Aucune annonce trouvée.</p>
          </div>
        )}

        {/* Property rows */}
        {!loading && filtered.map((p) => {
          const img = firstImage(p);
          const statusInfo = STATUS_LABELS[p.status] ?? STATUS_LABELS.pending;
          return (
            <div
              key={p.id}
              className={`bg-white dark:bg-[#1e2430] rounded-2xl p-4 border border-slate-100 dark:border-[#2a3040] flex items-center gap-3 ${p.status === "paused" ? "opacity-60" : ""}`}
            >
              <div className="relative w-16 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-[#151922]">
                {img && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-1">{p.title}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${statusInfo.classes}`}>
                    {statusInfo.label}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate">
                  {p.profiles?.[0]?.full_name ?? "—"} · {formatPrice(p.price)} · {timeAgo(p.created_at)}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Link
                  href={`/annonces/${p.id}`}
                  className="w-8 h-8 bg-slate-100 dark:bg-[#2a3040] rounded-lg flex items-center justify-center text-slate-500 hover:text-[#F97316] transition-colors"
                  title="Voir l'annonce"
                >
                  <Eye className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => handleApprove(p.id)}
                  disabled={p.status === "active"}
                  title="Approuver"
                  className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center text-green-600 hover:bg-green-500 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleSuspend(p.id)}
                  disabled={p.status === "paused"}
                  title="Suspendre"
                  className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center text-orange-500 hover:bg-orange-500 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setConfirmDelete(p)}
                  title="Supprimer"
                  className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
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
            <h3 className="font-black text-slate-900 dark:text-white mb-1">Supprimer cette annonce ?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-1 line-clamp-2 font-semibold">
              {confirmDelete.title}
            </p>
            <p className="text-xs text-red-500 mb-5">Cette action est irréversible.</p>
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
