"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  LayoutDashboard, FileText, Users, Eye, CheckCircle, XCircle,
  Trash2, RotateCcw, Star, AlertTriangle, ChevronLeft, ChevronRight,
  Flag, UserCheck, Plus,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = "dashboard" | "annonces" | "utilisateurs";
type PropFilter = "all" | "available" | "rented" | "boosted" | "not-boosted";

interface Stats {
  total: number;
  available: number;
  rented: number;
  users: number;
  thisWeek: number;
  pendingVerif: number;
  reports: number;
}

interface AdminProp {
  id: string;
  title: string;
  neighborhood: string;
  price: number;
  price_period: string | null;
  available_now: boolean;
  is_boosted: boolean;
  created_at: string;
  contact_phone: string | null;
  primary_image: string | null;
  owner_name: string | null;
  owner_phone: string | null;
}

interface AdminUser {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  created_at: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const NEIGHBORHOOD_LABELS: Record<string, string> = {
  kipe: "Kipé", lambanyi: "Lambanyi", ratoma: "Ratoma", sonfonia: "Sonfonia",
  cosa: "Cosa", hamdallaye: "Hamdallaye", nongo: "Nongo", taouyah: "Taouyah",
  dixinn: "Dixinn", matam: "Matam", madina: "Madina", kaloum: "Kaloum",
  matoto: "Matoto", sangoyah: "Sangoyah",
};

const ROLE_LABELS: Record<string, string> = {
  buyer: "Chercheur", owner: "Propriétaire", agent: "Agent",
  agency: "Agence", admin: "Admin",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatGNF(amount: number, period?: string | null): string {
  const f = new Intl.NumberFormat("fr-GN", { maximumFractionDigits: 0 }).format(amount);
  return period === "month" ? `${f} GNF/m` : `${f} GNF`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

// ─── Delete dialog ────────────────────────────────────────────────────────────

function ConfirmDialog({ message, onConfirm, onCancel }: {
  message: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-[#2a3040]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white text-sm">Confirmation</p>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Cette action est irréversible.</p>
          </div>
        </div>
        <p className="text-slate-600 dark:text-slate-300 text-sm mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-[#2a3040] text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-[#2a3040] transition-colors">
            Annuler
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors">
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: number | null; sub?: string; color: string }) {
  return (
    <div className="bg-white dark:bg-[#1e2430] rounded-2xl border border-slate-100 dark:border-[#2a3040] p-5">
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
      {value === null ? (
        <div className="h-8 w-16 bg-slate-100 dark:bg-[#2a3040] rounded animate-pulse mt-2" />
      ) : (
        <p className={cn("text-3xl font-black mt-1", color)}>{value.toLocaleString("fr-FR")}</p>
      )}
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("dashboard");

  // Dashboard
  const [stats, setStats] = useState<Stats | null>(null);

  // Annonces tab
  const [props, setProps]       = useState<AdminProp[]>([]);
  const [propsTotal, setPropsTotal] = useState(0);
  const [propsPage, setPropsPage]   = useState(0);
  const [propsFilter, setPropsFilter] = useState<PropFilter>("all");
  const [propsLoading, setPropsLoading] = useState(false);
  const [deletePropTarget, setDeletePropTarget] = useState<AdminProp | null>(null);
  const [propBusy, setPropBusy] = useState<string | null>(null);

  // Users tab
  const [users, setUsers]       = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [deleteUserTarget, setDeleteUserTarget] = useState<AdminUser | null>(null);
  const [userBusy, setUserBusy] = useState<string | null>(null);

  // ── Load dashboard stats ──────────────────────────────────────────────────

  useEffect(() => {
    if (!supabase) return;
    async function loadStats() {
      const db = supabase!;
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [a, b, c, d, e, f, g] = await Promise.all([
        db.from("properties").select("*", { count: "exact", head: true }),
        db.from("properties").select("*", { count: "exact", head: true }).eq("available_now", true),
        db.from("properties").select("*", { count: "exact", head: true }).eq("available_now", false),
        db.from("profiles").select("*", { count: "exact", head: true }),
        db.from("properties").select("*", { count: "exact", head: true }).gte("created_at", oneWeekAgo),
        db.from("profiles").select("*", { count: "exact", head: true }).eq("is_verified", false),
        db.from("reports").select("*", { count: "exact", head: true }),
      ]);
      setStats({
        total:       a.count ?? 0,
        available:   b.count ?? 0,
        rented:      c.count ?? 0,
        users:       d.count ?? 0,
        thisWeek:    e.count ?? 0,
        pendingVerif: f.count ?? 0,
        reports:     g.count ?? 0,
      });
    }
    loadStats();
  }, []);

  // ── Load properties ───────────────────────────────────────────────────────

  const loadProps = useCallback(async () => {
    if (!supabase) return;
    setPropsLoading(true);
    let query = supabase
      .from("properties")
      .select(`
        id, title, neighborhood, price, price_period,
        available_now, is_boosted, created_at, contact_phone,
        property_images(url, is_primary, sort_order),
        profiles(full_name, phone)
      `, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(propsPage * PAGE_SIZE, (propsPage + 1) * PAGE_SIZE - 1);

    if (propsFilter === "available")  query = query.eq("available_now", true);
    if (propsFilter === "rented")     query = query.eq("available_now", false);
    if (propsFilter === "boosted")    query = query.eq("is_boosted", true);
    if (propsFilter === "not-boosted") query = query.eq("is_boosted", false);

    const { data, count, error } = await query;
    if (error) { console.error(error); setPropsLoading(false); return; }

    setPropsTotal(count ?? 0);
    setProps(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data ?? []).map((row: any) => {
        const imgs: { url: string; is_primary: boolean; sort_order: number }[] =
          row.property_images ?? [];
        const primary = imgs.find((i) => i.is_primary)
          ?? [...imgs].sort((a, b) => a.sort_order - b.sort_order)[0];
        return {
          id:           row.id,
          title:        row.title,
          neighborhood: row.neighborhood,
          price:        row.price,
          price_period: row.price_period,
          available_now: row.available_now ?? true,
          is_boosted:   row.is_boosted ?? false,
          created_at:   row.created_at,
          contact_phone: row.contact_phone,
          primary_image: primary?.url ?? null,
          owner_name:   row.profiles?.full_name ?? null,
          owner_phone:  row.profiles?.phone ?? row.contact_phone ?? null,
        };
      })
    );
    setPropsLoading(false);
  }, [propsPage, propsFilter]);

  useEffect(() => {
    if (tab === "annonces") loadProps();
  }, [tab, loadProps]);

  // Reset page on filter change
  useEffect(() => { setPropsPage(0); }, [propsFilter]);

  // ── Load users ────────────────────────────────────────────────────────────

  const loadUsers = useCallback(async () => {
    if (!supabase) return;
    setUsersLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone, role, created_at")
      .order("created_at", { ascending: false });
    if (error) { console.error(error); setUsersLoading(false); return; }
    setUsers(data ?? []);
    setUsersLoading(false);
  }, []);

  useEffect(() => {
    if (tab === "utilisateurs") loadUsers();
  }, [tab, loadUsers]);

  // ── Property actions ──────────────────────────────────────────────────────

  async function toggleBoost(p: AdminProp) {
    if (!supabase) return;
    setPropBusy(p.id + "-boost");
    const newVal = !p.is_boosted;
    const { error } = await supabase.from("properties").update({ is_boosted: newVal }).eq("id", p.id);
    if (error) { toast("Erreur", "error"); }
    else {
      setProps((prev) => prev.map((x) => x.id === p.id ? { ...x, is_boosted: newVal } : x));
      toast(newVal ? "✅ Annonce vérifiée / mise en avant" : "✅ Mise en avant retirée", "success");
    }
    setPropBusy(null);
  }

  async function toggleAvail(p: AdminProp) {
    if (!supabase) return;
    setPropBusy(p.id + "-avail");
    const newVal = !p.available_now;
    const { error } = await supabase.from("properties").update({ available_now: newVal }).eq("id", p.id);
    if (error) { toast("Erreur", "error"); }
    else {
      setProps((prev) => prev.map((x) => x.id === p.id ? { ...x, available_now: newVal } : x));
      toast("✅ Annonce mise à jour", "success");
    }
    setPropBusy(null);
  }

  async function deleteProp(p: AdminProp) {
    if (!supabase) return;
    setDeletePropTarget(null);
    setPropBusy(p.id + "-delete");
    const { error } = await supabase.from("properties").delete().eq("id", p.id);
    if (error) { toast("Erreur lors de la suppression", "error"); }
    else {
      setProps((prev) => prev.filter((x) => x.id !== p.id));
      setPropsTotal((n) => Math.max(0, n - 1));
      toast("✅ Annonce supprimée", "success");
    }
    setPropBusy(null);
  }

  // ── User actions ──────────────────────────────────────────────────────────

  async function changeRole(u: AdminUser, newRole: string) {
    if (!supabase) return;
    setUserBusy(u.id + "-role");
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", u.id);
    if (error) { toast("Erreur", "error"); }
    else {
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, role: newRole } : x));
      toast("✅ Rôle mis à jour", "success");
    }
    setUserBusy(null);
  }

  async function deleteUser(u: AdminUser) {
    if (!supabase) return;
    setDeleteUserTarget(null);
    setUserBusy(u.id + "-delete");
    const { error } = await supabase.from("profiles").delete().eq("id", u.id);
    if (error) { toast("Erreur lors de la suppression", "error"); }
    else {
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      toast("✅ Utilisateur supprimé", "success");
    }
    setUserBusy(null);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(propsTotal / PAGE_SIZE));

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">

      {/* ── Tab bar ── */}
      <div className="flex gap-1 bg-slate-100 dark:bg-[#1e2430] rounded-2xl p-1 mb-6 w-fit">
        {([
          { id: "dashboard",    icon: LayoutDashboard, label: "Dashboard" },
          { id: "annonces",     icon: FileText,         label: "Annonces" },
          { id: "utilisateurs", icon: Users,            label: "Utilisateurs" },
        ] as const).map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all",
              tab === id
                ? "bg-white dark:bg-[#111418] text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════
          TAB 1 — Dashboard
      ════════════════════════════════════════ */}
      {tab === "dashboard" && (
        <div className="space-y-6">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Tableau de bord</h1>

          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            <StatCard label="Total annonces"   value={stats?.total ?? null}        color="text-slate-900 dark:text-white" />
            <StatCard label="Disponibles"      value={stats?.available ?? null}    color="text-green-600 dark:text-green-400" />
            <StatCard label="Déjà louées"      value={stats?.rented ?? null}       color="text-red-500" />
            <StatCard label="Utilisateurs"     value={stats?.users ?? null}        color="text-blue-600 dark:text-blue-400" />
            <StatCard label="Cette semaine"    value={stats?.thisWeek ?? null}     color="text-[#F97316]" sub="nouvelles annonces" />
            <StatCard label="À vérifier"       value={stats?.pendingVerif ?? null} color="text-orange-500" sub="profils non vérifiés" />
            <StatCard label="Signalements"     value={stats?.reports ?? null}      color="text-red-600 dark:text-red-400" sub="en attente" />
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <button
              onClick={() => setTab("annonces")}
              className="flex items-center gap-4 bg-white dark:bg-[#1e2430] rounded-2xl border border-slate-100 dark:border-[#2a3040] p-5 hover:border-[#F97316]/50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-[#F97316]" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">Modérer les annonces</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Vérifier, changer statut, supprimer</p>
              </div>
            </button>
            <button
              onClick={() => setTab("utilisateurs")}
              className="flex items-center gap-4 bg-white dark:bg-[#1e2430] rounded-2xl border border-slate-100 dark:border-[#2a3040] p-5 hover:border-[#F97316]/50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">Gérer les utilisateurs</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Rôles, comptes, accès</p>
              </div>
            </button>
            <Link
              href="/admin/annonces/nouvelle"
              className="flex items-center gap-4 bg-white dark:bg-[#1e2430] rounded-2xl border border-slate-100 dark:border-[#2a3040] p-5 hover:border-green-400/50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <Plus className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">Ajouter une annonce</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Publier manuellement</p>
              </div>
            </Link>
            <Link
              href="/admin/agents"
              className="flex items-center gap-4 bg-white dark:bg-[#1e2430] rounded-2xl border border-slate-100 dark:border-[#2a3040] p-5 hover:border-amber-400/50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <UserCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">Gérer les agents</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Agents certifiés GuImmo</p>
              </div>
            </Link>
            <Link
              href="/admin/signalements"
              className="flex items-center gap-4 bg-white dark:bg-[#1e2430] rounded-2xl border border-slate-100 dark:border-[#2a3040] p-5 hover:border-red-400/50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 relative">
                <Flag className="w-5 h-5 text-red-500" />
                {(stats?.reports ?? 0) > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {stats!.reports}
                  </span>
                )}
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">Signalements</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Annonces signalées</p>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          TAB 2 — Annonces
      ════════════════════════════════════════ */}
      {tab === "annonces" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              Annonces
              {!propsLoading && (
                <span className="ml-2 text-base font-semibold text-slate-400">({propsTotal})</span>
              )}
            </h1>
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 flex-wrap">
            {([
              { id: "all",        label: "Toutes" },
              { id: "available",  label: "✅ Disponibles" },
              { id: "rented",     label: "❌ Louées" },
              { id: "boosted",    label: "⭐ Vérifiées" },
              { id: "not-boosted", label: "◯ Non vérifiées" },
            ] as const).map((f) => (
              <button
                key={f.id}
                onClick={() => setPropsFilter(f.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                  propsFilter === f.id
                    ? "bg-[#F97316] text-white border-[#F97316]"
                    : "bg-white dark:bg-[#1e2430] border-slate-200 dark:border-[#2a3040] text-slate-600 dark:text-slate-300 hover:border-[#F97316]/50"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-[#1e2430] rounded-2xl border border-slate-100 dark:border-[#2a3040] overflow-hidden">
            {propsLoading ? (
              <div className="p-8 flex items-center justify-center">
                <div className="w-7 h-7 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : props.length === 0 ? (
              <p className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                Aucune annonce trouvée.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-[#2a3040]">
                      {["Photo", "Titre / Quartier", "Prix", "Propriétaire", "Statut", "Date", "Actions"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-[#2a3040]">
                    {props.map((p) => {
                      const busy = propBusy?.startsWith(p.id);
                      return (
                        <tr key={p.id} className={cn("hover:bg-slate-50 dark:hover:bg-[#151922] transition-colors", busy && "opacity-50")}>
                          {/* Photo */}
                          <td className="px-4 py-3">
                            <div className="relative w-14 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-[#2a3040] flex-shrink-0">
                              {p.primary_image ? (
                                <Image src={p.primary_image} alt={p.title} fill className="object-cover" sizes="56px" />
                              ) : (
                                <span className="absolute inset-0 flex items-center justify-center text-lg">🏠</span>
                              )}
                            </div>
                          </td>

                          {/* Title */}
                          <td className="px-4 py-3 max-w-[180px]">
                            <a href={`/annonces/${p.id}`} target="_blank" rel="noreferrer"
                              className="font-semibold text-slate-900 dark:text-white text-sm hover:text-[#F97316] line-clamp-2 leading-snug">
                              {p.title}
                            </a>
                            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                              {NEIGHBORHOOD_LABELS[p.neighborhood] ?? p.neighborhood}
                            </p>
                          </td>

                          {/* Price */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-[#F97316] font-bold text-sm">{formatGNF(p.price, p.price_period)}</span>
                          </td>

                          {/* Owner */}
                          <td className="px-4 py-3 max-w-[140px]">
                            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium truncate">
                              {p.owner_name ?? "—"}
                            </p>
                            <p className="text-xs text-slate-400 truncate">{p.owner_phone ?? p.contact_phone ?? "—"}</p>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              {p.available_now ? (
                                <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-[11px] font-bold">
                                  <CheckCircle className="w-3 h-3" /> Disponible
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-red-500 text-[11px] font-bold">
                                  <XCircle className="w-3 h-3" /> Loué
                                </span>
                              )}
                              {p.is_boosted && (
                                <span className="inline-flex items-center gap-1 text-amber-500 text-[11px] font-bold">
                                  <Star className="w-3 h-3 fill-amber-500" /> Vérifié
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Date */}
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                            {formatDate(p.created_at)}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {/* Verify / Un-verify */}
                              <button
                                onClick={() => toggleBoost(p)}
                                disabled={!!busy}
                                title={p.is_boosted ? "Retirer la vérification" : "Vérifier"}
                                className={cn(
                                  "w-7 h-7 rounded-lg flex items-center justify-center transition-colors text-xs border",
                                  p.is_boosted
                                    ? "border-amber-300 dark:border-amber-700 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                    : "border-slate-200 dark:border-[#2a3040] text-slate-400 hover:border-amber-300 hover:text-amber-500"
                                )}
                              >
                                <Star className={cn("w-3.5 h-3.5", p.is_boosted && "fill-amber-500")} />
                              </button>

                              {/* Toggle availability */}
                              <button
                                onClick={() => toggleAvail(p)}
                                disabled={!!busy}
                                title={p.available_now ? "Marquer loué" : "Remettre disponible"}
                                className="w-7 h-7 rounded-lg border border-slate-200 dark:border-[#2a3040] text-slate-400 hover:border-green-400 hover:text-green-500 flex items-center justify-center transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => setDeletePropTarget(p)}
                                disabled={!!busy}
                                title="Supprimer"
                                className="w-7 h-7 rounded-lg border border-slate-200 dark:border-[#2a3040] text-slate-400 hover:border-red-300 hover:text-red-500 flex items-center justify-center transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                Page {propsPage + 1} / {totalPages} · {propsTotal} annonces
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPropsPage((p) => Math.max(0, p - 1))}
                  disabled={propsPage === 0}
                  className="w-9 h-9 rounded-xl border border-slate-200 dark:border-[#2a3040] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:border-[#F97316] hover:text-[#F97316] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPropsPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={propsPage >= totalPages - 1}
                  className="w-9 h-9 rounded-xl border border-slate-200 dark:border-[#2a3040] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:border-[#F97316] hover:text-[#F97316] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════
          TAB 3 — Utilisateurs
      ════════════════════════════════════════ */}
      {tab === "utilisateurs" && (
        <div className="space-y-4">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Utilisateurs
            {!usersLoading && (
              <span className="ml-2 text-base font-semibold text-slate-400">({users.length})</span>
            )}
          </h1>

          <div className="bg-white dark:bg-[#1e2430] rounded-2xl border border-slate-100 dark:border-[#2a3040] overflow-hidden">
            {usersLoading ? (
              <div className="p-8 flex items-center justify-center">
                <div className="w-7 h-7 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <p className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                Aucun utilisateur inscrit pour l&apos;instant.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-[#2a3040]">
                      {["Nom", "Téléphone", "Rôle", "Inscription", "Actions"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-[#2a3040]">
                    {users.map((u) => {
                      const busy = userBusy?.startsWith(u.id);
                      return (
                        <tr key={u.id} className={cn("hover:bg-slate-50 dark:hover:bg-[#151922] transition-colors", busy && "opacity-50")}>
                          {/* Name */}
                          <td className="px-4 py-3 max-w-[160px]">
                            <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                              {u.full_name ?? "—"}
                            </p>
                          </td>

                          {/* Phone */}
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                            {u.phone ?? "—"}
                          </td>

                          {/* Role select */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <select
                              aria-label={`Rôle de ${u.full_name ?? "l'utilisateur"}`}
                              value={u.role}
                              disabled={!!busy}
                              onChange={(e) => changeRole(u, e.target.value)}
                              className="bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#F97316]/50 cursor-pointer"
                            >
                              <option value="buyer">Chercheur</option>
                              <option value="owner">Propriétaire</option>
                              <option value="agent">Agent</option>
                              <option value="agency">Agence</option>
                              <option value="admin">Admin</option>
                            </select>
                            {userBusy === u.id + "-role" && (
                              <span className="ml-2 inline-block w-3 h-3 border border-[#F97316] border-t-transparent rounded-full animate-spin" />
                            )}
                          </td>

                          {/* Date */}
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                            {formatDate(u.created_at)}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setDeleteUserTarget(u)}
                              disabled={!!busy}
                              title="Supprimer le compte"
                              className="w-7 h-7 rounded-lg border border-slate-200 dark:border-[#2a3040] text-slate-400 hover:border-red-300 hover:text-red-500 flex items-center justify-center transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <p className="text-slate-400 text-xs">
            * La suppression retire le profil de la plateforme. Le compte d&apos;authentification reste actif jusqu&apos;à expiration de la session.
          </p>
        </div>
      )}

      {/* ── Dialogs ── */}
      {deletePropTarget && (
        <ConfirmDialog
          message={`Supprimer l'annonce "${deletePropTarget.title}" ?`}
          onConfirm={() => deleteProp(deletePropTarget)}
          onCancel={() => setDeletePropTarget(null)}
        />
      )}
      {deleteUserTarget && (
        <ConfirmDialog
          message={`Supprimer le profil de "${deleteUserTarget.full_name ?? "cet utilisateur"}" ?`}
          onConfirm={() => deleteUser(deleteUserTarget)}
          onCancel={() => setDeleteUserTarget(null)}
        />
      )}
    </div>
  );
}
