"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Plus, Eye, MapPin, LogOut, Pencil, Trash2, User,
  CheckCircle, XCircle, RotateCcw, AlertTriangle, Search,
  Bell, BellOff, Heart, MessageCircle, BarChart2, Home,
  TrendingUp, Phone, Building2, ChevronRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Listing {
  id: string;
  title: string;
  neighborhood: string;
  price: number;
  price_period: string | null;
  available_now: boolean;
  views: number;
  primary_image: string | null;
}

interface SavedSearch {
  id: string;
  label: string;
  neighborhood: string | null;
  type: string | null;
  transaction_type: string | null;
  min_price: number | null;
  max_price: number | null;
  min_rooms: number | null;
  notify_whatsapp: boolean;
  created_at: string;
}

interface DayStat {
  date: string;
  views: number;
  whatsapp_clicks: number;
  message_clicks: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const NEIGHBORHOOD_LABELS: Record<string, string> = {
  kipe: "Kipé", lambanyi: "Lambanyi", ratoma: "Ratoma Centre",
  sonfonia: "Sonfonia", cosa: "Cosa", hamdallaye: "Hamdallaye",
  nongo: "Nongo", taouyah: "Taouyah", koloma: "Koloma",
  dixinn: "Dixinn", matam: "Matam", madina: "Madina",
  kaloum: "Kaloum", matoto: "Matoto Centre", sangoyah: "Sangoyah",
};

const TYPE_LABELS: Record<string, string> = {
  apartment: "Appartement", house: "Maison", studio: "Studio",
  villa: "Villa", room: "Chambre", office: "Bureau", shop: "Boutique",
};

function formatGNF(amount: number, period?: string | null): string {
  const f = new Intl.NumberFormat("fr-GN", { maximumFractionDigits: 0 }).format(amount);
  return period === "month" ? `${f} GNF/mois` : `${f} GNF`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function DeleteDialog({ title, onConfirm, onCancel }: { title: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="rounded-2xl p-6 max-w-sm w-full shadow-2xl" style={{ background: "rgba(15,15,22,0.95)", border: "1px solid rgba(255,255,255,0.12)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">Supprimer l&apos;annonce</p>
            <p className="text-white/50 text-xs mt-0.5">Cette action est irréversible.</p>
          </div>
        </div>
        <p className="text-white/70 text-sm mb-5 line-clamp-2">&ldquo;{title}&rdquo;</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-white/70 font-semibold text-sm hover:bg-white/5 transition-colors" style={{ border: "1px solid rgba(255,255,255,0.10)" }}>
            Annuler
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors">
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

function TabBar({ tabs, active, onChange }: { tabs: { key: string; label: string; icon: React.ReactNode }[]; active: string; onChange: (k: string) => void }) {
  return (
    <div className="flex gap-1 mb-6 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0",
            active === t.key
              ? "text-white"
              : "text-white/50 hover:text-white/75"
          )}
          style={active === t.key ? { background: "#c8901e" } : { background: "rgba(255,255,255,0.06)" }}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}

function StatCard({ label, value, icon, sub }: { label: string; value: string | number; icon: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-1" style={{ background: "#1a2e1e", border: "1px solid rgba(240,230,204,0.10)" }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-white/50 text-xs font-medium">{label}</span>
        <span className="text-white/30 w-4 h-4">{icon}</span>
      </div>
      <span className="text-2xl font-black text-white leading-none">{value}</span>
      {sub && <span className="text-white/40 text-[11px]">{sub}</span>}
    </div>
  );
}

function ProfileForm({
  user,
  profile,
  refreshProfile,
  signOut,
}: {
  user: { id: string; email?: string };
  profile: ReturnType<typeof useAuth>["profile"];
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [agencyName, setAgencyName] = useState(profile?.agency_name ?? "");
  const [saving, setSaving] = useState(false);

  const isAgence = profile?.account_type === "agence" || profile?.role === "agence";

  async function save() {
    if (!supabase || !fullName.trim()) return;
    setSaving(true);
    const updates: Record<string, string> = { full_name: fullName.trim() };
    if (phone.trim()) updates.phone = phone.trim();
    if (bio.trim()) updates.bio = bio.trim();
    if (isAgence && agencyName.trim()) updates.agency_name = agencyName.trim();
    const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
    if (error) { toast("Erreur lors de la sauvegarde", "error"); }
    else { await refreshProfile(); toast("✅ Profil sauvegardé", "success"); }
    setSaving(false);
  }

  return (
    <div className="rounded-2xl divide-y divide-white/8" style={{ background: "#1a2e1e", border: "1px solid rgba(240,230,204,0.10)" }}>
      <div className="p-4">
        <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Prénom &amp; Nom</label>
        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Votre nom complet" className="w-full rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }} />
      </div>
      <div className="px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Email</p>
          <p className="text-white/70 text-sm font-medium mt-0.5 truncate max-w-[220px]">{user.email}</p>
        </div>
        <span className="text-[11px] text-white/40 font-medium px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>Non modifiable</span>
      </div>
      <div className="p-4">
        <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Téléphone</label>
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+224 620 00 00 00" className="w-full rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }} />
      </div>
      {profile?.account_type && ["agent", "agence"].includes(profile.account_type) && (
        <div className="p-4">
          <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Bio professionnelle</label>
          <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Décrivez votre expertise..." className="w-full rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none resize-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }} />
        </div>
      )}
      {isAgence && (
        <div className="p-4">
          <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Nom de l&apos;agence</label>
          <input type="text" value={agencyName} onChange={(e) => setAgencyName(e.target.value)} placeholder="Nom de votre agence" className="w-full rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }} />
        </div>
      )}
      <div className="p-4">
        <button onClick={save} disabled={saving || !fullName.trim()} className="w-full py-3 rounded-xl bg-[#c8901e] hover:bg-[#b87c18] disabled:opacity-50 text-white font-bold text-sm transition-colors mb-3">
          {saving ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Sauvegarder"}
        </button>
        <button onClick={async () => { await signOut(); router.push("/"); }} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-red-400 font-bold text-sm hover:bg-red-500/10 transition-colors" style={{ border: "1px solid rgba(239,68,68,0.30)" }}>
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

// ─── ListingsManager (shared by propriétaire, agent, agence) ──────────────────

function ListingsManager({ userId, limit }: { userId: string; limit?: number }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Listing | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase
      .from("properties")
      .select("id, title, neighborhood, price, price_period, available_now, views, property_images!inner(url, is_primary, sort_order)")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    const mapped: Listing[] = (data ?? []).map((row) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const imgs: any[] = (row as any).property_images ?? [];
      const primary = imgs.find((i) => i.is_primary) ?? imgs.sort((a, b) => a.sort_order - b.sort_order)[0];
      return { id: row.id, title: row.title, neighborhood: row.neighborhood, price: row.price, price_period: row.price_period, available_now: row.available_now ?? true, views: row.views ?? 0, primary_image: primary?.url ?? null };
    });
    setListings(mapped);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function toggleAvailability(listing: Listing) {
    if (!supabase) return;
    setActionLoading(listing.id + "-avail");
    const newVal = !listing.available_now;
    const { error } = await supabase.from("properties").update({ available_now: newVal }).eq("id", listing.id);
    if (error) { toast("Erreur lors de la mise à jour", "error"); }
    else { setListings((p) => p.map((l) => l.id === listing.id ? { ...l, available_now: newVal } : l)); toast(newVal ? "✅ Remise disponible" : "✅ Marquée comme louée", "success"); }
    setActionLoading(null);
  }

  async function deleteListing(listing: Listing) {
    if (!supabase) return;
    setDeleteTarget(null);
    setActionLoading(listing.id + "-delete");
    const { error } = await supabase.from("properties").delete().eq("id", listing.id);
    if (error) { toast("Erreur lors de la suppression", "error"); }
    else { setListings((p) => p.filter((l) => l.id !== listing.id)); toast("✅ Annonce supprimée", "success"); }
    setActionLoading(null);
  }

  const displayed = limit ? listings.slice(0, limit) : listings;

  if (loading) return (
    <div className="space-y-3">
      {[1, 2].map((i) => <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />)}
    </div>
  );

  if (listings.length === 0) return (
    <div className="text-center py-14 border-2 border-dashed border-white/10 rounded-2xl">
      <div className="text-4xl mb-3">🏠</div>
      <p className="font-bold text-white mb-1">Aucune annonce</p>
      <p className="text-white/50 text-sm mb-4">Publiez votre premier bien en quelques minutes.</p>
      <Link href="/publier" className="inline-flex items-center gap-2 bg-[#c8901e] hover:bg-[#b87c18] text-white font-bold px-5 py-2.5 rounded-xl transition-colors">
        <Plus className="w-4 h-4" /> Publier maintenant →
      </Link>
    </div>
  );

  return (
    <>
      {limit && listings.length > 0 && (
        <div className="flex items-center justify-between mb-3">
          <p className="text-white/50 text-xs">{listings.length} annonce{listings.length > 1 ? "s" : ""} au total</p>
          <Link href="/publier" className="flex items-center gap-1.5 text-[#c8901e] text-xs font-bold hover:underline">
            <Plus className="w-3.5 h-3.5" /> Publier
          </Link>
        </div>
      )}
      <div className="space-y-3">
        {displayed.map((listing) => {
          const isAvailBusy = actionLoading === listing.id + "-avail";
          const isDeleteBusy = actionLoading === listing.id + "-delete";
          const busy = isAvailBusy || isDeleteBusy;
          return (
            <div key={listing.id} className={cn("rounded-2xl overflow-hidden transition-opacity", busy && "opacity-60 pointer-events-none")} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <div className="flex gap-3 p-3">
                <Link href={`/annonces/${listing.id}`} className="relative w-24 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-white/5">
                  {listing.primary_image ? <Image src={listing.primary_image} alt={listing.title} fill className="object-cover" sizes="96px" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🏠</div>}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/annonces/${listing.id}`}><p className="font-bold text-white text-sm leading-snug line-clamp-2">{listing.title}</p></Link>
                  <div className="flex items-center gap-1 text-white/50 text-xs mt-0.5"><MapPin className="w-3 h-3 flex-shrink-0" />{NEIGHBORHOOD_LABELS[listing.neighborhood] ?? listing.neighborhood}</div>
                  <p className="text-white font-bold text-sm mt-1">{formatGNF(listing.price, listing.price_period)}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    {listing.available_now
                      ? <span className="inline-flex items-center gap-1 text-green-400 text-[11px] font-bold"><CheckCircle className="w-3 h-3" /> Disponible</span>
                      : <span className="inline-flex items-center gap-1 text-red-400 text-[11px] font-bold"><XCircle className="w-3 h-3" /> Loué</span>}
                    <span className="flex items-center gap-1 text-white/40 text-[11px]"><Eye className="w-3 h-3" /> {listing.views} vue{listing.views !== 1 ? "s" : ""}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 px-3 pb-3">
                <button onClick={() => toggleAvailability(listing)} disabled={busy} className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-colors border", listing.available_now ? "border-red-800/40 text-red-400 hover:bg-red-900/20" : "border-green-800/40 text-green-400 hover:bg-green-900/20")}>
                  {isAvailBusy ? <div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" /> : listing.available_now ? <><XCircle className="w-3.5 h-3.5" /> Marquer loué</> : <><RotateCcw className="w-3.5 h-3.5" /> Remettre dispo</>}
                </button>
                <Link href={`/publier?edit=${listing.id}`} className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-white/60 hover:text-white transition-colors" style={{ border: "1px solid rgba(255,255,255,0.10)" }}>
                  <Pencil className="w-3.5 h-3.5" /> Modifier
                </Link>
                <button onClick={() => setDeleteTarget(listing)} disabled={busy} className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors" style={{ border: "1px solid rgba(255,255,255,0.10)" }}>
                  {isDeleteBusy ? <div className="w-3.5 h-3.5 border border-red-400 border-t-transparent rounded-full animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}
        {!limit && (
          <Link href="/publier" className="flex items-center justify-center gap-2 py-3 rounded-xl text-[#c8901e] font-bold text-sm hover:bg-[#c8901e]/10 transition-colors" style={{ border: "1px dashed rgba(200,144,30,0.40)" }}>
            <Plus className="w-4 h-4" /> Publier une annonce
          </Link>
        )}
      </div>
      {deleteTarget && <DeleteDialog title={deleteTarget.title} onConfirm={() => deleteListing(deleteTarget)} onCancel={() => setDeleteTarget(null)} />}
    </>
  );
}

// ─── DASHBOARD CHERCHEUR ──────────────────────────────────────────────────────

function ChercheurDashboard({ user, profile, signOut, refreshProfile }: {
  user: { id: string; email?: string };
  profile: ReturnType<typeof useAuth>["profile"];
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}) {
  const [tab, setTab] = useState("recherches");
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [searchesLoading, setSearchesLoading] = useState(true);
  const [showNewSearch, setShowNewSearch] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newNeighborhood, setNewNeighborhood] = useState("");
  const [newType, setNewType] = useState("");
  const [newTx, setNewTx] = useState("");
  const [savingSearch, setSavingSearch] = useState(false);

  const loadSearches = useCallback(async () => {
    if (!supabase) return;
    setSearchesLoading(true);
    const { data } = await supabase.from("saved_searches").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setSearches((data ?? []) as SavedSearch[]);
    setSearchesLoading(false);
  }, [user.id]);

  useEffect(() => { loadSearches(); }, [loadSearches]);

  async function deleteSearch(id: string) {
    if (!supabase) return;
    await supabase.from("saved_searches").delete().eq("id", id);
    setSearches((p) => p.filter((s) => s.id !== id));
    toast("✅ Recherche supprimée", "success");
  }

  async function toggleNotify(search: SavedSearch) {
    if (!supabase) return;
    const newVal = !search.notify_whatsapp;
    await supabase.from("saved_searches").update({ notify_whatsapp: newVal }).eq("id", search.id);
    setSearches((p) => p.map((s) => s.id === search.id ? { ...s, notify_whatsapp: newVal } : s));
  }

  async function saveNewSearch() {
    if (!supabase || !newLabel.trim()) return;
    setSavingSearch(true);
    const { data } = await supabase.from("saved_searches").insert({
      user_id: user.id,
      label: newLabel.trim(),
      neighborhood: newNeighborhood || null,
      type: newType || null,
      transaction_type: newTx || null,
    }).select().single();
    if (data) setSearches((p) => [data as SavedSearch, ...p]);
    setNewLabel(""); setNewNeighborhood(""); setNewType(""); setNewTx("");
    setShowNewSearch(false);
    setSavingSearch(false);
    toast("✅ Recherche sauvegardée", "success");
  }

  function buildSearchUrl(s: SavedSearch) {
    const params = new URLSearchParams();
    if (s.neighborhood) params.set("neighborhood", s.neighborhood);
    if (s.type) params.set("type", s.type);
    if (s.transaction_type) params.set("transaction_type", s.transaction_type);
    if (s.min_price) params.set("min_price", String(s.min_price));
    if (s.max_price) params.set("max_price", String(s.max_price));
    if (s.min_rooms) params.set("min_rooms", String(s.min_rooms));
    return `/annonces?${params.toString()}`;
  }

  const tabs = [
    { key: "recherches", label: "Recherches", icon: <Search className="w-3.5 h-3.5" /> },
    { key: "favoris",    label: "Favoris",    icon: <Heart className="w-3.5 h-3.5" /> },
    { key: "messages",   label: "Messages",   icon: <MessageCircle className="w-3.5 h-3.5" /> },
    { key: "profil",     label: "Profil",     icon: <User className="w-3.5 h-3.5" /> },
  ];

  return (
    <>
      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {/* ── Recherches ── */}
      {tab === "recherches" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white text-base">Recherches sauvegardées</h2>
            <button onClick={() => setShowNewSearch(true)} className="flex items-center gap-1.5 text-xs font-bold text-[#c8901e] hover:underline">
              <Plus className="w-3.5 h-3.5" /> Nouvelle
            </button>
          </div>

          {showNewSearch && (
            <div className="rounded-2xl p-4 mb-4" style={{ background: "#1a2e1e", border: "1px solid rgba(200,144,30,0.30)" }}>
              <p className="font-bold text-white text-sm mb-3">Nouvelle recherche</p>
              <div className="space-y-2">
                <input type="text" placeholder="Nom de la recherche *" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }} />
                <div className="grid grid-cols-2 gap-2">
                  <select value={newNeighborhood} onChange={(e) => setNewNeighborhood(e.target.value)} className="rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none" style={{ background: "#1a2e1e", border: "1px solid rgba(255,255,255,0.10)" }}>
                    <option value="">Tous quartiers</option>
                    {Object.entries(NEIGHBORHOOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <select value={newType} onChange={(e) => setNewType(e.target.value)} className="rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none" style={{ background: "#1a2e1e", border: "1px solid rgba(255,255,255,0.10)" }}>
                    <option value="">Tous types</option>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <select value={newTx} onChange={(e) => setNewTx(e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none" style={{ background: "#1a2e1e", border: "1px solid rgba(255,255,255,0.10)" }}>
                  <option value="">Location + vente</option>
                  <option value="rent">Location</option>
                  <option value="sale">Vente</option>
                </select>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setShowNewSearch(false)} className="flex-1 py-2.5 rounded-xl text-white/60 text-sm font-semibold hover:bg-white/5 transition-colors" style={{ border: "1px solid rgba(255,255,255,0.10)" }}>Annuler</button>
                <button onClick={saveNewSearch} disabled={savingSearch || !newLabel.trim()} className="flex-1 py-2.5 rounded-xl bg-[#c8901e] text-white text-sm font-bold disabled:opacity-50 transition-colors">Sauvegarder</button>
              </div>
            </div>
          )}

          {searchesLoading ? (
            <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />)}</div>
          ) : searches.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-2xl">
              <Search className="w-8 h-8 text-white/20 mx-auto mb-3" />
              <p className="font-bold text-white mb-1">Aucune recherche sauvegardée</p>
              <p className="text-white/50 text-sm mb-4">Sauvegardez vos critères pour recevoir des alertes.</p>
              <button onClick={() => setShowNewSearch(true)} className="inline-flex items-center gap-2 bg-[#c8901e] hover:bg-[#b87c18] text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm">
                <Plus className="w-4 h-4" /> Créer une recherche
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {searches.map((s) => (
                <div key={s.id} className="rounded-2xl p-4" style={{ background: "#1a2e1e", border: "1px solid rgba(240,230,204,0.10)" }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-bold text-white text-sm">{s.label}</p>
                    <button onClick={() => deleteSearch(s.id)} className="text-white/30 hover:text-red-400 transition-colors flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {s.neighborhood && <span className="text-[11px] font-semibold text-white/60 px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>{NEIGHBORHOOD_LABELS[s.neighborhood] ?? s.neighborhood}</span>}
                    {s.type && <span className="text-[11px] font-semibold text-white/60 px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>{TYPE_LABELS[s.type] ?? s.type}</span>}
                    {s.transaction_type && <span className="text-[11px] font-semibold text-white/60 px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>{s.transaction_type === "rent" ? "Location" : "Vente"}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={buildSearchUrl(s)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/15 transition-colors">
                      Voir les annonces <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                    <button onClick={() => toggleNotify(s)} className={cn("flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-colors", s.notify_whatsapp ? "text-green-400 bg-green-900/20" : "text-white/40 hover:text-white/60 bg-white/5")}>
                      {s.notify_whatsapp ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                      Alerte
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Favoris ── */}
      {tab === "favoris" && (
        <Link href="/favoris" className="flex items-center justify-between rounded-2xl p-5 hover:bg-white/5 transition-colors" style={{ background: "#1a2e1e", border: "1px solid rgba(240,230,204,0.10)" }}>
          <div className="flex items-center gap-3">
            <Heart className="w-6 h-6 text-red-400" />
            <div>
              <p className="font-bold text-white">Mes favoris</p>
              <p className="text-white/50 text-sm">Voir mes annonces sauvegardées</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/30" />
        </Link>
      )}

      {/* ── Messages ── */}
      {tab === "messages" && (
        <Link href="/messages" className="flex items-center justify-between rounded-2xl p-5 hover:bg-white/5 transition-colors" style={{ background: "#1a2e1e", border: "1px solid rgba(240,230,204,0.10)" }}>
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-blue-400" />
            <div>
              <p className="font-bold text-white">Mes messages</p>
              <p className="text-white/50 text-sm">Ouvrir la messagerie</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/30" />
        </Link>
      )}

      {/* ── Profil ── */}
      {tab === "profil" && (
        <ProfileForm user={user} profile={profile} refreshProfile={refreshProfile} signOut={signOut} />
      )}
    </>
  );
}

// ─── DASHBOARD PROPRIÉTAIRE ───────────────────────────────────────────────────

function ProprietaireDashboard({ user, profile, signOut, refreshProfile }: {
  user: { id: string; email?: string };
  profile: ReturnType<typeof useAuth>["profile"];
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}) {
  const [tab, setTab] = useState("dashboard");
  const [statsData, setStatsData] = useState<DayStat[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [totalViews7d, setTotalViews7d] = useState(0);
  const [totalWA7d, setTotalWA7d] = useState(0);
  const [activeListings, setActiveListings] = useState(0);

  const loadStats = useCallback(async () => {
    if (!supabase) return;
    setStatsLoading(true);

    const { data: props } = await supabase.from("properties").select("id, available_now").eq("owner_id", user.id);
    const ids = (props ?? []).map((p: { id: string }) => p.id);
    setActiveListings((props ?? []).filter((p: { available_now: boolean }) => p.available_now).length);

    if (ids.length === 0) { setStatsLoading(false); return; }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { data: raw } = await supabase
      .from("listing_stats")
      .select("date, views, whatsapp_clicks, message_clicks")
      .in("property_id", ids)
      .gte("date", sevenDaysAgo.toISOString().split("T")[0])
      .order("date");

    const byDate: Record<string, DayStat> = {};
    for (const r of raw ?? []) {
      if (!byDate[r.date]) byDate[r.date] = { date: r.date, views: 0, whatsapp_clicks: 0, message_clicks: 0 };
      byDate[r.date].views += r.views;
      byDate[r.date].whatsapp_clicks += r.whatsapp_clicks;
      byDate[r.date].message_clicks += r.message_clicks;
    }

    // Fill in missing days
    const days: DayStat[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      days.push(byDate[key] ?? { date: key, views: 0, whatsapp_clicks: 0, message_clicks: 0 });
    }

    setStatsData(days);
    setTotalViews7d(days.reduce((acc, d) => acc + d.views, 0));
    setTotalWA7d(days.reduce((acc, d) => acc + d.whatsapp_clicks, 0));
    setStatsLoading(false);
  }, [user.id]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const tabs = [
    { key: "dashboard",  label: "Tableau de bord", icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { key: "annonces",   label: "Mes annonces",    icon: <Home className="w-3.5 h-3.5" /> },
    { key: "messages",   label: "Messages",        icon: <MessageCircle className="w-3.5 h-3.5" /> },
    { key: "profil",     label: "Profil",          icon: <User className="w-3.5 h-3.5" /> },
  ];

  return (
    <>
      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {/* ── Tableau de bord ── */}
      {tab === "dashboard" && (
        <div>
          {statsLoading ? (
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <StatCard label="Vues (7 jours)" value={totalViews7d} icon={<Eye className="w-4 h-4" />} sub="toutes annonces" />
                <StatCard label="Clics WhatsApp" value={totalWA7d} icon={<Phone className="w-4 h-4" />} sub="7 derniers jours" />
                <StatCard label="Annonces actives" value={activeListings} icon={<Home className="w-4 h-4" />} />
                <StatCard label="Messages" value="—" icon={<MessageCircle className="w-4 h-4" />} sub={<><Link href="/messages" className="text-[#c8901e] hover:underline text-[11px]">Voir →</Link></>} />
              </div>

              <div className="rounded-2xl p-4 mb-6" style={{ background: "#1a2e1e", border: "1px solid rgba(240,230,204,0.10)" }}>
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-4">Vues par jour (7j)</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={statsData.map((d) => ({ ...d, label: fmtDate(d.date) }))} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="label" tick={{ fill: "rgba(240,230,204,0.40)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(240,230,204,0.40)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#111a14", border: "1px solid rgba(240,230,204,0.15)", borderRadius: 8, color: "#f7f2e6", fontSize: 12 }} cursor={{ fill: "rgba(200,144,30,0.08)" }} />
                    <Bar dataKey="views" name="Vues" fill="#c8901e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">Annonces récentes</p>
              <ListingsManager userId={user.id} limit={3} />
            </>
          )}
        </div>
      )}

      {/* ── Mes annonces ── */}
      {tab === "annonces" && (
        <ListingsManager userId={user.id} />
      )}

      {/* ── Messages ── */}
      {tab === "messages" && (
        <Link href="/messages" className="flex items-center justify-between rounded-2xl p-5 hover:bg-white/5 transition-colors" style={{ background: "#1a2e1e", border: "1px solid rgba(240,230,204,0.10)" }}>
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-blue-400" />
            <div><p className="font-bold text-white">Mes messages</p><p className="text-white/50 text-sm">Ouvrir la messagerie</p></div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/30" />
        </Link>
      )}

      {/* ── Profil ── */}
      {tab === "profil" && (
        <ProfileForm user={user} profile={profile} refreshProfile={refreshProfile} signOut={signOut} />
      )}
    </>
  );
}

// ─── DASHBOARD AGENT ──────────────────────────────────────────────────────────

function AgentDashboard({ user, profile, signOut, refreshProfile }: {
  user: { id: string; email?: string };
  profile: ReturnType<typeof useAuth>["profile"];
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}) {
  const [tab, setTab] = useState("dashboard");
  const [statsData, setStatsData] = useState<DayStat[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [totalViews, setTotalViews] = useState(0);
  const [totalWA, setTotalWA] = useState(0);
  const [activeListings, setActiveListings] = useState(0);

  const loadStats = useCallback(async () => {
    if (!supabase) return;
    setStatsLoading(true);
    const { data: props } = await supabase.from("properties").select("id, available_now").eq("owner_id", user.id);
    const ids = (props ?? []).map((p: { id: string }) => p.id);
    setActiveListings((props ?? []).filter((p: { available_now: boolean }) => p.available_now).length);

    if (ids.length === 0) { setStatsLoading(false); return; }

    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data: raw } = await supabase
      .from("listing_stats").select("date, views, whatsapp_clicks, message_clicks")
      .in("property_id", ids).gte("date", thirtyDaysAgo.toISOString().split("T")[0]).order("date");

    const byDate: Record<string, DayStat> = {};
    for (const r of raw ?? []) {
      if (!byDate[r.date]) byDate[r.date] = { date: r.date, views: 0, whatsapp_clicks: 0, message_clicks: 0 };
      byDate[r.date].views += r.views; byDate[r.date].whatsapp_clicks += r.whatsapp_clicks; byDate[r.date].message_clicks += r.message_clicks;
    }
    const days: DayStat[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      days.push(byDate[key] ?? { date: key, views: 0, whatsapp_clicks: 0, message_clicks: 0 });
    }
    setStatsData(days);
    setTotalViews(days.reduce((acc, d) => acc + d.views, 0));
    setTotalWA(days.reduce((acc, d) => acc + d.whatsapp_clicks, 0));
    setStatsLoading(false);
  }, [user.id]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const tabs = [
    { key: "dashboard",   label: "Dashboard",   icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { key: "annonces",    label: "Annonces",    icon: <Home className="w-3.5 h-3.5" /> },
    { key: "leads",       label: "Leads",       icon: <Phone className="w-3.5 h-3.5" /> },
    { key: "statistiques",label: "Stats",       icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { key: "profil",      label: "Profil",      icon: <User className="w-3.5 h-3.5" /> },
  ];

  return (
    <>
      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {tab === "dashboard" && (
        <div>
          {statsLoading ? (
            <div className="grid grid-cols-2 gap-3 mb-6">{[1,2,3,4,5].map((i) => <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />)}</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <StatCard label="Vues ce mois" value={totalViews} icon={<Eye className="w-4 h-4" />} />
                <StatCard label="Contacts WhatsApp" value={totalWA} icon={<Phone className="w-4 h-4" />} />
                <StatCard label="Annonces actives" value={activeListings} icon={<Home className="w-4 h-4" />} />
                <StatCard label="Messages" value="—" icon={<MessageCircle className="w-4 h-4" />} sub={<><Link href="/messages" className="text-[#c8901e] text-[11px] hover:underline">Voir →</Link></>} />
                {profile?.is_verified_pro && <StatCard label="Statut" value="✓ Pro" icon={<CheckCircle className="w-4 h-4" />} sub="Agent vérifié" />}
              </div>

              <div className="rounded-2xl p-4 mb-6" style={{ background: "#1a2e1e", border: "1px solid rgba(240,230,204,0.10)" }}>
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-4">Vues sur 30 jours</p>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={statsData.filter((_, i) => i % 3 === 0).map((d) => ({ ...d, label: fmtDate(d.date) }))} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="label" tick={{ fill: "rgba(240,230,204,0.40)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(240,230,204,0.40)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#111a14", border: "1px solid rgba(240,230,204,0.15)", borderRadius: 8, color: "#f7f2e6", fontSize: 12 }} cursor={{ fill: "rgba(200,144,30,0.08)" }} />
                    <Bar dataKey="views" name="Vues" fill="#c8901e" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">Annonces récentes</p>
              <ListingsManager userId={user.id} limit={3} />
            </>
          )}
        </div>
      )}

      {tab === "annonces" && <ListingsManager userId={user.id} />}

      {tab === "leads" && (
        <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-2xl">
          <Phone className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <p className="font-bold text-white mb-1">Historique des leads</p>
          <p className="text-white/50 text-sm mb-4">Les contacts WhatsApp et messages apparaîtront ici.</p>
          <Link href="/messages" className="inline-flex items-center gap-2 bg-[#c8901e]/20 text-[#c8901e] font-bold px-5 py-2.5 rounded-xl text-sm border border-[#c8901e]/30">
            Voir les messages
          </Link>
        </div>
      )}

      {tab === "statistiques" && (
        <div className="rounded-2xl p-4" style={{ background: "#1a2e1e", border: "1px solid rgba(240,230,204,0.10)" }}>
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-4">Vues + WhatsApp sur 30 jours</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statsData.filter((_, i) => i % 3 === 0).map((d) => ({ ...d, label: fmtDate(d.date) }))} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fill: "rgba(240,230,204,0.40)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(240,230,204,0.40)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#111a14", border: "1px solid rgba(240,230,204,0.15)", borderRadius: 8, color: "#f7f2e6", fontSize: 12 }} cursor={{ fill: "rgba(200,144,30,0.08)" }} />
              <Bar dataKey="views" name="Vues" fill="#c8901e" radius={[3, 3, 0, 0]} />
              <Bar dataKey="whatsapp_clicks" name="WhatsApp" fill="#25D366" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === "profil" && (
        <div>
          {profile?.is_verified_pro && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-xl" style={{ background: "rgba(200,144,30,0.12)", border: "1px solid rgba(200,144,30,0.25)" }}>
              <CheckCircle className="w-4 h-4 text-[#c8901e] flex-shrink-0" />
              <p className="text-sm font-semibold text-[#daa84a]">Agent professionnel vérifié</p>
            </div>
          )}
          <Link href={`/agents/${user.id}`} className="flex items-center justify-between rounded-2xl px-4 py-3 mb-4 hover:bg-white/5 transition-colors" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}>
            <span className="text-sm font-semibold text-white/70">Voir mon profil public</span>
            <ChevronRight className="w-4 h-4 text-white/30" />
          </Link>
          <ProfileForm user={user} profile={profile} refreshProfile={refreshProfile} signOut={signOut} />
        </div>
      )}
    </>
  );
}

// ─── DASHBOARD AGENCE ─────────────────────────────────────────────────────────

function AgenceDashboard({ user, profile, signOut, refreshProfile }: {
  user: { id: string; email?: string };
  profile: ReturnType<typeof useAuth>["profile"];
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}) {
  const [tab, setTab] = useState("dashboard");
  const [statsData, setStatsData] = useState<DayStat[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [totalViews, setTotalViews] = useState(0);
  const [totalWA, setTotalWA] = useState(0);
  const [activeListings, setActiveListings] = useState(0);
  const [totalListings, setTotalListings] = useState(0);

  const loadStats = useCallback(async () => {
    if (!supabase) return;
    setStatsLoading(true);
    const { data: props } = await supabase.from("properties").select("id, available_now").eq("owner_id", user.id);
    const ids = (props ?? []).map((p: { id: string }) => p.id);
    setTotalListings((props ?? []).length);
    setActiveListings((props ?? []).filter((p: { available_now: boolean }) => p.available_now).length);

    if (ids.length > 0) {
      const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data: raw } = await supabase.from("listing_stats").select("date, views, whatsapp_clicks, message_clicks").in("property_id", ids).gte("date", thirtyDaysAgo.toISOString().split("T")[0]).order("date");
      const byDate: Record<string, DayStat> = {};
      for (const r of raw ?? []) {
        if (!byDate[r.date]) byDate[r.date] = { date: r.date, views: 0, whatsapp_clicks: 0, message_clicks: 0 };
        byDate[r.date].views += r.views; byDate[r.date].whatsapp_clicks += r.whatsapp_clicks; byDate[r.date].message_clicks += r.message_clicks;
      }
      const days: DayStat[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        days.push(byDate[key] ?? { date: key, views: 0, whatsapp_clicks: 0, message_clicks: 0 });
      }
      setStatsData(days);
      setTotalViews(days.reduce((acc, d) => acc + d.views, 0));
      setTotalWA(days.reduce((acc, d) => acc + d.whatsapp_clicks, 0));
    }
    setStatsLoading(false);
  }, [user.id]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const tabs = [
    { key: "dashboard", label: "Dashboard",     icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { key: "annonces",  label: "Annonces",      icon: <Home className="w-3.5 h-3.5" /> },
    { key: "equipe",    label: "Équipe",        icon: <Building2 className="w-3.5 h-3.5" /> },
    { key: "leads",     label: "Leads",         icon: <Phone className="w-3.5 h-3.5" /> },
    { key: "stats",     label: "Stats",         icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { key: "profil",    label: "Profil agence", icon: <User className="w-3.5 h-3.5" /> },
  ];

  return (
    <>
      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {tab === "dashboard" && (
        <div>
          {statsLoading ? (
            <div className="grid grid-cols-2 gap-3 mb-6">{[1,2,3,4,5,6].map((i) => <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />)}</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <StatCard label="Vues totales (30j)" value={totalViews} icon={<Eye className="w-4 h-4" />} />
                <StatCard label="Annonces actives" value={activeListings} icon={<Home className="w-4 h-4" />} sub={`${totalListings} au total`} />
                <StatCard label="Contacts WhatsApp" value={totalWA} icon={<Phone className="w-4 h-4" />} sub="30 derniers jours" />
                <StatCard label="Agents" value="—" icon={<Building2 className="w-4 h-4" />} sub="Bientôt disponible" />
                <StatCard label="Leads" value="—" icon={<TrendingUp className="w-4 h-4" />} sub={<><Link href="/messages" className="text-[#c8901e] text-[11px] hover:underline">Voir messages →</Link></>} />
                <StatCard label="Note agence" value="—" icon={<CheckCircle className="w-4 h-4" />} sub="Bientôt" />
              </div>
              <div className="rounded-2xl p-4 mb-6" style={{ background: "#1a2e1e", border: "1px solid rgba(240,230,204,0.10)" }}>
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-4">Performance 30 jours</p>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={statsData.filter((_, i) => i % 5 === 0).map((d) => ({ ...d, label: fmtDate(d.date) }))} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="label" tick={{ fill: "rgba(240,230,204,0.40)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(240,230,204,0.40)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#111a14", border: "1px solid rgba(240,230,204,0.15)", borderRadius: 8, color: "#f7f2e6", fontSize: 12 }} cursor={{ fill: "rgba(200,144,30,0.08)" }} />
                    <Bar dataKey="views" name="Vues" fill="#c8901e" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="whatsapp_clicks" name="WhatsApp" fill="#25D366" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">Top annonces</p>
              <ListingsManager userId={user.id} limit={3} />
            </>
          )}
        </div>
      )}

      {tab === "annonces" && <ListingsManager userId={user.id} />}

      {tab === "equipe" && (
        <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-2xl">
          <Building2 className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <p className="font-bold text-white mb-1">Gestion de l&apos;équipe</p>
          <p className="text-white/50 text-sm">Inviter et gérer vos agents — disponible prochainement.</p>
        </div>
      )}

      {tab === "leads" && (
        <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-2xl">
          <Phone className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <p className="font-bold text-white mb-1">Leads de l&apos;agence</p>
          <p className="text-white/50 text-sm mb-4">Tous vos contacts reçus en un seul endroit.</p>
          <Link href="/messages" className="inline-flex items-center gap-2 bg-[#c8901e]/20 text-[#c8901e] font-bold px-5 py-2.5 rounded-xl text-sm border border-[#c8901e]/30">
            Voir les messages
          </Link>
        </div>
      )}

      {tab === "stats" && (
        <div className="rounded-2xl p-4" style={{ background: "#1a2e1e", border: "1px solid rgba(240,230,204,0.10)" }}>
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-4">Vues + WhatsApp sur 30 jours</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statsData.filter((_, i) => i % 5 === 0).map((d) => ({ ...d, label: fmtDate(d.date) }))} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fill: "rgba(240,230,204,0.40)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(240,230,204,0.40)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#111a14", border: "1px solid rgba(240,230,204,0.15)", borderRadius: 8, color: "#f7f2e6", fontSize: 12 }} cursor={{ fill: "rgba(200,144,30,0.08)" }} />
              <Bar dataKey="views" name="Vues" fill="#c8901e" radius={[3, 3, 0, 0]} />
              <Bar dataKey="whatsapp_clicks" name="WhatsApp" fill="#25D366" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === "profil" && (
        <div>
          <Link href={`/agences/${user.id}`} className="flex items-center justify-between rounded-2xl px-4 py-3 mb-4 hover:bg-white/5 transition-colors" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}>
            <span className="text-sm font-semibold text-white/70">Voir le profil public de l&apos;agence</span>
            <ChevronRight className="w-4 h-4 text-white/30" />
          </Link>
          <ProfileForm user={user} profile={profile} refreshProfile={refreshProfile} signOut={signOut} />
        </div>
      )}
    </>
  );
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────────

export default function ComptePage() {
  const { user, profile, loading: authLoading, signOut, refreshProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.replace("/connexion?redirect=/compte");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!authLoading && profile?.role === "admin") router.replace("/admin");
  }, [authLoading, profile, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/40 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const role = profile?.role ?? "buyer";
  const accountType = profile?.account_type ?? (
    ["proprietaire", "owner"].includes(role) ? "proprietaire" :
    role === "agent" ? "agent" :
    ["agence", "agency"].includes(role) ? "agence" :
    "chercheur"
  );

  const displayName = profile?.full_name ?? user.email?.split("@")[0] ?? "Utilisateur";
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  const roleLabel: Record<string, string> = {
    chercheur:    "🔍 Chercheur",
    proprietaire: "🏠 Propriétaire",
    agent:        "👔 Agent immobilier",
    agence:       "🏢 Agence immobilière",
  };

  const dashProps = { user, profile, signOut, refreshProfile };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24">
      {/* ── Header ── */}
      <div className="flex items-center gap-4 mb-6">
        {profile?.avatar_url ? (
          <Image src={profile.avatar_url} alt={displayName} width={56} height={56} className="rounded-2xl object-cover" />
        ) : (
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black flex-shrink-0" style={{ background: "rgba(200,144,30,0.20)", border: "1px solid rgba(200,144,30,0.30)" }}>
            {initials || <User className="w-6 h-6" />}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-black text-white truncate">{displayName}</h1>
          <p className="text-white/40 text-sm">{roleLabel[accountType] ?? accountType}</p>
        </div>
        {accountType !== "chercheur" && (
          <Link href="/publier" className="ml-auto flex-none flex items-center gap-1.5 bg-[#c8901e] hover:bg-[#b87c18] text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-[0_4px_20px_rgba(200,144,30,0.3)]">
            <Plus className="w-4 h-4" /> Publier
          </Link>
        )}
      </div>

      {accountType === "chercheur"    && <ChercheurDashboard    {...dashProps} />}
      {accountType === "proprietaire" && <ProprietaireDashboard {...dashProps} />}
      {accountType === "agent"        && <AgentDashboard        {...dashProps} />}
      {accountType === "agence"       && <AgenceDashboard       {...dashProps} />}
    </div>
  );
}
