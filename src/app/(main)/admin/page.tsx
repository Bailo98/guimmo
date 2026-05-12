"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3, Users, Home, MessageSquare, CheckCircle, XCircle,
  Trash2, Shield, Settings, ChevronDown, Eye, AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

type Tab = "dashboard" | "annonces" | "utilisateurs" | "config";

interface Stats {
  totalProps: number;
  availableProps: number;
  rentedProps: number;
  totalUsers: number;
  weekMessages: number;
}

interface AdminListing {
  id: string;
  title: string;
  neighborhood: string;
  price: number;
  price_period: string | null;
  available_now: boolean;
  views: number;
  owner_name: string;
  created_at: string;
}

interface AdminUser {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  is_verified: boolean;
  created_at: string;
}

type ListingFilter = "all" | "available" | "rented";
type RoleOption = "buyer" | "chercheur" | "proprietaire" | "agence" | "admin";

const ROLES: RoleOption[] = ["buyer", "chercheur", "proprietaire", "agence", "admin"];
const ROLE_LABELS: Record<string, string> = {
  buyer: "Chercheur",
  chercheur: "Chercheur",
  proprietaire: "Propriétaire",
  owner: "Propriétaire",
  agence: "Agence",
  agent: "Agent",
  admin: "Admin",
};

const NEIGHBORHOOD_LABELS: Record<string, string> = {
  kipe: "Kipé", lambanyi: "Lambanyi", ratoma: "Ratoma Centre",
  sonfonia: "Sonfonia", cosa: "Cosa", hamdallaye: "Hamdallaye",
  nongo: "Nongo", taouyah: "Taouyah", koloma: "Koloma",
  dixinn: "Dixinn", matam: "Matam", madina: "Madina",
  kaloum: "Kaloum", matoto: "Matoto Centre", sangoyah: "Sangoyah",
};

function formatGNF(n: number) {
  return new Intl.NumberFormat("fr-GN", { maximumFractionDigits: 0 }).format(n) + " GNF";
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number | string; color: string }) {
  return (
    <div className="bg-white dark:bg-[#1e2430] rounded-2xl border border-slate-100 dark:border-[#2a3040] p-5">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", color)}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

export default function AdminPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("dashboard");

  // Auth guard
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/connexion"); return; }
    if (profile && profile.role !== "admin") router.replace("/compte");
  }, [authLoading, user, profile, router]);

  // ── Dashboard ─────────────────────────────────────────────────────────────
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const loadStats = useCallback(async () => {
    if (!supabase) return;
    setStatsLoading(true);
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const [propsRes, availRes, usersRes, msgsRes] = await Promise.all([
      supabase.from("properties").select("*", { count: "exact", head: true }),
      supabase.from("properties").select("*", { count: "exact", head: true }).eq("available_now", true),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("messages").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
    ]);
    const total = propsRes.count ?? 0;
    const avail = availRes.count ?? 0;
    setStats({
      totalProps: total,
      availableProps: avail,
      rentedProps: total - avail,
      totalUsers: usersRes.count ?? 0,
      weekMessages: msgsRes.count ?? 0,
    });
    setStatsLoading(false);
  }, []);

  // ── Annonces ──────────────────────────────────────────────────────────────
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingFilter, setListingFilter] = useState<ListingFilter>("all");
  const [deleteTarget, setDeleteTarget] = useState<AdminListing | null>(null);

  const loadListings = useCallback(async () => {
    if (!supabase) return;
    setListingsLoading(true);
    const { data, error } = await supabase
      .from("properties")
      .select("id, title, neighborhood, price, price_period, available_now, views, created_at, owner_id, profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (!error && data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setListings(data.map((r: any) => ({
        id: r.id, title: r.title, neighborhood: r.neighborhood,
        price: r.price, price_period: r.price_period,
        available_now: r.available_now ?? true, views: r.views ?? 0,
        owner_name: r.profiles?.full_name ?? "—",
        created_at: r.created_at,
      })));
    }
    setListingsLoading(false);
  }, []);

  async function toggleListingStatus(l: AdminListing) {
    if (!supabase) return;
    const { error } = await supabase.from("properties").update({ available_now: !l.available_now }).eq("id", l.id);
    if (error) { toast("Erreur", "error"); return; }
    setListings((prev) => prev.map((x) => x.id === l.id ? { ...x, available_now: !l.available_now } : x));
    toast(l.available_now ? "Marqué loué" : "Marqué disponible", "success");
  }

  async function deleteListing(l: AdminListing) {
    if (!supabase) return;
    setDeleteTarget(null);
    const { error } = await supabase.from("properties").delete().eq("id", l.id);
    if (error) { toast("Erreur lors de la suppression", "error"); return; }
    setListings((prev) => prev.filter((x) => x.id !== l.id));
    toast("Annonce supprimée", "success");
  }

  // ── Utilisateurs ──────────────────────────────────────────────────────────
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    if (!supabase) return;
    setUsersLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone, role, is_verified, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (!error && data) setUsers(data as AdminUser[]);
    setUsersLoading(false);
  }, []);

  async function updateUserRole(userId: string, newRole: RoleOption) {
    if (!supabase) return;
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
    if (error) { toast("Erreur lors de la mise à jour", "error"); return; }
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
    toast("Rôle mis à jour", "success");
  }

  async function deleteUser(userId: string) {
    if (!supabase) return;
    const { error } = await supabase.from("profiles").delete().eq("id", userId);
    if (error) { toast("Erreur lors de la suppression", "error"); return; }
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    toast("Utilisateur supprimé", "success");
  }

  // ── Config ────────────────────────────────────────────────────────────────
  const [whatsapp, setWhatsapp] = useState("");
  const [configLoading, setConfigLoading] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  const loadConfig = useCallback(async () => {
    if (!supabase) return;
    setConfigLoading(true);
    const { data } = await supabase.from("site_config").select("key, value");
    if (data) {
      const wa = data.find((r) => r.key === "whatsapp_support");
      if (wa) setWhatsapp(wa.value);
    }
    setConfigLoading(false);
  }, []);

  async function saveConfig() {
    if (!supabase) return;
    setSavingConfig(true);
    const { error } = await supabase.from("site_config")
      .upsert({ key: "whatsapp_support", value: whatsapp, updated_at: new Date().toISOString() });
    if (error) toast("Erreur lors de la sauvegarde", "error");
    else toast("Configuration sauvegardée", "success");
    setSavingConfig(false);
  }

  // Load data when tab changes
  useEffect(() => {
    if (tab === "dashboard") loadStats();
    if (tab === "annonces") loadListings();
    if (tab === "utilisateurs") loadUsers();
    if (tab === "config") loadConfig();
  }, [tab, loadStats, loadListings, loadUsers, loadConfig]);

  if (authLoading || !profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (profile.role !== "admin") return null;

  const filteredListings = listings.filter((l) => {
    if (listingFilter === "available") return l.available_now;
    if (listingFilter === "rented") return !l.available_now;
    return true;
  });

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "dashboard", label: "Dashboard", icon: BarChart3 },
    { key: "annonces", label: "Annonces", icon: Home },
    { key: "utilisateurs", label: "Utilisateurs", icon: Users },
    { key: "config", label: "Config", icon: Settings },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#F97316] flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">Administration</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Tableau de bord GuImmo</p>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 bg-slate-100 dark:bg-[#1e2430] p-1 rounded-2xl mb-6 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-1 justify-center",
              tab === key
                ? "bg-white dark:bg-[#111418] text-[#F97316] shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Dashboard ── */}
      {tab === "dashboard" && (
        <div>
          {statsLoading || !stats ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-28 bg-slate-100 dark:bg-[#1e2430] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <StatCard icon={Home} label="Annonces totales" value={stats.totalProps} color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" />
              <StatCard icon={CheckCircle} label="Disponibles" value={stats.availableProps} color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" />
              <StatCard icon={XCircle} label="Louées" value={stats.rentedProps} color="bg-red-100 dark:bg-red-900/30 text-red-500" />
              <StatCard icon={Users} label="Utilisateurs" value={stats.totalUsers} color="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" />
              <StatCard icon={MessageSquare} label="Messages (7j)" value={stats.weekMessages} color="bg-orange-100 dark:bg-orange-900/30 text-[#F97316]" />
            </div>
          )}
        </div>
      )}

      {/* ── Annonces ── */}
      {tab === "annonces" && (
        <div>
          <div className="flex gap-2 mb-4 flex-wrap">
            {(["all", "available", "rented"] as ListingFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setListingFilter(f)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-semibold transition-colors",
                  listingFilter === f
                    ? "bg-[#F97316] text-white"
                    : "bg-slate-100 dark:bg-[#1e2430] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#2a3040]"
                )}
              >
                {f === "all" ? "Toutes" : f === "available" ? "Disponibles" : "Louées"}
                {f === "all" && ` (${listings.length})`}
              </button>
            ))}
          </div>

          {listingsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-slate-100 dark:bg-[#1e2430] rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1e2430] rounded-2xl border border-slate-100 dark:border-[#2a3040] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-[#2a3040] text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="text-left px-4 py-3 font-semibold">Titre</th>
                      <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Quartier</th>
                      <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Propriétaire</th>
                      <th className="text-right px-4 py-3 font-semibold">Prix</th>
                      <th className="text-center px-4 py-3 font-semibold">Statut</th>
                      <th className="text-center px-4 py-3 font-semibold hidden md:table-cell">Vues</th>
                      <th className="text-center px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-[#2a3040]">
                    {filteredListings.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-[#252d3d] transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white max-w-[200px] truncate">{l.title}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 hidden md:table-cell">{NEIGHBORHOOD_LABELS[l.neighborhood] ?? l.neighborhood}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 hidden lg:table-cell truncate max-w-[120px]">{l.owner_name}</td>
                        <td className="px-4 py-3 text-right text-[#F97316] font-bold whitespace-nowrap">{formatGNF(l.price)}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleListingStatus(l)}
                            className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors",
                              l.available_now
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200"
                                : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200"
                            )}
                          >
                            {l.available_now ? <><CheckCircle className="w-3 h-3" /> Dispo</> : <><XCircle className="w-3 h-3" /> Loué</>}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-400 hidden md:table-cell">
                          <span className="flex items-center justify-center gap-1"><Eye className="w-3 h-3" />{l.views}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setDeleteTarget(l)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors mx-auto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredListings.length === 0 && (
                  <p className="text-center py-10 text-slate-400 text-sm">Aucune annonce</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Utilisateurs ── */}
      {tab === "utilisateurs" && (
        <div>
          {usersLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 bg-slate-100 dark:bg-[#1e2430] rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1e2430] rounded-2xl border border-slate-100 dark:border-[#2a3040] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-[#2a3040] text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="text-left px-4 py-3 font-semibold">Nom</th>
                      <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Téléphone</th>
                      <th className="text-left px-4 py-3 font-semibold">Rôle</th>
                      <th className="text-center px-4 py-3 font-semibold hidden lg:table-cell">Vérifié</th>
                      <th className="text-center px-4 py-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-[#2a3040]">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-[#252d3d] transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                          {u.full_name ?? <span className="text-slate-400 italic">Sans nom</span>}
                          {u.id === user?.id && (
                            <span className="ml-2 text-[10px] bg-[#F97316]/10 text-[#F97316] px-1.5 py-0.5 rounded font-bold">Vous</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 hidden md:table-cell">{u.phone ?? "—"}</td>
                        <td className="px-4 py-3">
                          <div className="relative">
                            <select
                              value={u.role}
                              onChange={(e) => updateUserRole(u.id, e.target.value as RoleOption)}
                              disabled={u.id === user?.id}
                              className="appearance-none bg-slate-100 dark:bg-[#252d3d] text-slate-700 dark:text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg pr-7 focus:outline-none focus:ring-2 focus:ring-[#F97316]/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {ROLES.map((r) => (
                                <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>
                              ))}
                            </select>
                            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center hidden lg:table-cell">
                          {u.is_verified
                            ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                            : <XCircle className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {u.id !== user?.id && (
                            <button
                              onClick={() => {
                                if (confirm(`Supprimer ${u.full_name ?? "cet utilisateur"} ?`)) deleteUser(u.id);
                              }}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors mx-auto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && <p className="text-center py-10 text-slate-400 text-sm">Aucun utilisateur</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Config ── */}
      {tab === "config" && (
        <div className="max-w-lg">
          <div className="bg-white dark:bg-[#1e2430] rounded-2xl border border-slate-100 dark:border-[#2a3040] p-6 space-y-5">
            <h2 className="font-bold text-slate-900 dark:text-white">Configuration du site</h2>

            {configLoading ? (
              <div className="h-16 bg-slate-100 dark:bg-[#252d3d] rounded-xl animate-pulse" />
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  WhatsApp support
                </label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+224 620 00 00 00"
                  className="w-full bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/50"
                />
              </div>
            )}

            <button
              onClick={saveConfig}
              disabled={savingConfig || configLoading}
              className="w-full py-3 bg-[#F97316] hover:bg-[#EA6C0A] disabled:opacity-50 text-white font-bold rounded-xl transition-colors"
            >
              {savingConfig ? "Sauvegarde…" : "Sauvegarder"}
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-[#2a3040]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">Supprimer l&apos;annonce</p>
                <p className="text-slate-500 text-xs mt-0.5">Cette action est irréversible.</p>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-5 line-clamp-2">&ldquo;{deleteTarget.title}&rdquo;</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-[#2a3040] text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-[#2a3040] transition-colors">Annuler</button>
              <button onClick={() => deleteListing(deleteTarget)} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
