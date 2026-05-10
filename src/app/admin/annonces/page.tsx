"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { CheckCircle, XCircle, Eye, Search, Download } from "lucide-react";
import { MOCK_PROPERTIES } from "@/data/mock-properties";
import { formatPrice, timeAgo } from "@/lib/utils";
import { toast } from "@/lib/toast";

type PropertyStatus = "active" | "suspended" | "pending";

interface ManagedProperty {
  id: string;
  title: string;
  owner: { name: string };
  price: number;
  createdAt: string;
  images: { url: string }[];
  type: string;
  neighborhood: string;
  views: number;
  status: PropertyStatus;
}

const INITIAL_PROPERTIES: ManagedProperty[] = MOCK_PROPERTIES.map((p) => ({
  id: p.id,
  title: p.title,
  owner: { name: p.owner.name },
  price: p.price,
  createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
  images: p.images.map((i) => ({ url: i.url })),
  type: p.type,
  neighborhood: p.neighborhood,
  views: p.views,
  status: (p.status === "active" ? "active" : "pending") as PropertyStatus,
}));

function exportCSV(properties: ManagedProperty[]) {
  const headers = ["Titre", "Propriétaire", "Type", "Prix", "Quartier", "Statut", "Vues"];
  const rows = properties.map((p) => [
    p.title,
    p.owner.name,
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
  a.download = "annonces-guimmo.csv";
  a.click();
  URL.revokeObjectURL(url);
  toast("Export CSV téléchargé !", "success");
}

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Tous" },
  { value: "active", label: "Actif" },
  { value: "suspended", label: "Suspendu" },
  { value: "pending", label: "En attente" },
];

export default function AdminAnnoncesPage() {
  const [properties, setProperties] = useState<ManagedProperty[]>(INITIAL_PROPERTIES);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  function handleApprove(id: string) {
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "active" } : p))
    );
    toast("Annonce approuvée", "success");
  }

  function handleSuspend(id: string) {
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "suspended" } : p))
    );
    toast("Annonce suspendue", "error");
  }

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      const matchesSearch =
        search === "" ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.owner.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [properties, search, statusFilter]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Gestion des annonces</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{filtered.length} annonce(s) affichée(s)</p>
        </div>
        <button
          onClick={() => exportCSV(properties)}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border border-slate-200 dark:border-[#2a3040] text-slate-600 dark:text-slate-300 hover:border-[#F97316] hover:text-[#F97316] transition-colors flex-shrink-0"
        >
          <Download className="w-4 h-4" />
          Exporter CSV
        </button>
      </div>

      {/* Search + Status filter row */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une annonce..."
            className="w-full bg-white dark:bg-[#1e2430] border border-slate-200 dark:border-[#2a3040] rounded-xl pl-9 pr-4 py-2.5 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F97316]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white dark:bg-[#1e2430] border border-slate-200 dark:border-[#2a3040] rounded-xl px-4 py-2.5 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F97316]"
        >
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-8 border border-slate-100 dark:border-[#2a3040] text-center">
            <p className="text-slate-400 text-sm">Aucune annonce trouvée.</p>
          </div>
        )}
        {filtered.map((p) => (
          <div
            key={p.id}
            className={`bg-white dark:bg-[#1e2430] rounded-2xl p-4 border border-slate-100 dark:border-[#2a3040] flex items-center gap-3 transition-opacity ${
              p.status === "suspended" ? "opacity-60" : ""
            }`}
          >
            <div className="relative w-16 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-[#151922]">
              {p.images[0] && <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-1">{p.title}</p>
                {p.status === "suspended" && (
                  <span className="text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full flex-shrink-0">
                    Suspendu
                  </span>
                )}
                {p.status === "active" && (
                  <span className="text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full flex-shrink-0">
                    Actif
                  </span>
                )}
                {p.status === "pending" && (
                  <span className="text-[10px] font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-500 px-2 py-0.5 rounded-full flex-shrink-0">
                    En attente
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {p.owner.name} · {formatPrice(p.price)} · {timeAgo(p.createdAt)}
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
                disabled={p.status === "suspended"}
                title="Suspendre"
                className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
