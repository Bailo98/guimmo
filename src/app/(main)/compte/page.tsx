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
  id: string; title: string; neighborhood: string;
  price: number; price_period: string | null;
  available_now: boolean; views: number; primary_image: string | null;
}
interface SavedSearch {
  id: string; label: string; neighborhood: string | null; type: string | null;
  transaction_type: string | null; min_price: number | null; max_price: number | null;
  min_rooms: number | null; notify_whatsapp: boolean; created_at: string;
}
interface DayStat {
  date: string; views: number; whatsapp_clicks: number; message_clicks: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const NL: Record<string, string> = {
  kipe: "Kipé", lambanyi: "Lambanyi", ratoma: "Ratoma Centre",
  sonfonia: "Sonfonia", cosa: "Cosa", hamdallaye: "Hamdallaye",
  nongo: "Nongo", taouyah: "Taouyah", koloma: "Koloma",
  dixinn: "Dixinn", matam: "Matam", madina: "Madina",
  kaloum: "Kaloum", matoto: "Matoto Centre", sangoyah: "Sangoyah",
};
const TL: Record<string, string> = {
  apartment: "Appartement", house: "Maison", studio: "Studio",
  villa: "Villa", room: "Chambre", office: "Bureau", shop: "Boutique",
};
function fmtGNF(n: number, period?: string | null) {
  const f = new Intl.NumberFormat("fr-GN", { maximumFractionDigits: 0 }).format(n);
  return period === "month" ? `${f} GNF/mois` : `${f} GNF`;
}
function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: React.ReactNode }) {
  return (
    <div className="bl-stat-card">
      <span className="bl-stat-label">{label}</span>
      <span className="bl-stat-value">{value}</span>
      {sub && <span style={{ fontSize: 11, color: "var(--bl-cream-faint)", marginTop: 4, display: "block" }}>{sub}</span>}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="bl-section-label" style={{ marginBottom: 10 }}>{children}</p>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="bl-section-title" style={{ marginBottom: 16 }}>{children}</h2>;
}

function DeleteDialog({ title, onConfirm, onCancel }: { title: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="rounded-2xl p-6 max-w-sm w-full shadow-2xl" style={{ background: "#0d1a10", border: "1px solid var(--bl-border-md)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(240,68,68,0.15)" }}>
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: "var(--bl-cream)" }}>Supprimer l&apos;annonce</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--bl-cream-faint)" }}>Cette action est irréversible.</p>
          </div>
        </div>
        <p className="text-sm mb-5 line-clamp-2" style={{ color: "var(--bl-cream-dim)" }}>&ldquo;{title}&rdquo;</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-white/5" style={{ border: "1px solid var(--bl-border-md)", color: "var(--bl-cream-dim)" }}>
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

// ─── TabBar (mobile) + SidebarNav (desktop) ───────────────────────────────────

type Tab = { key: string; label: string; icon: React.ReactNode };

function TabBar({ tabs, active, onChange }: { tabs: Tab[]; active: string; onChange: (k: string) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cn("flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0",
            active === t.key ? "text-white" : "hover:text-white/75")}
          style={active === t.key
            ? { background: "var(--bl-amber)", color: "#fff" }
            : { background: "rgba(240,230,204,0.06)", color: "var(--bl-cream-dim)" }}
        >
          {t.icon}{t.label}
        </button>
      ))}
    </div>
  );
}

function SidebarNav({ tabs, active, onChange }: { tabs: Tab[]; active: string; onChange: (k: string) => void }) {
  return (
    <nav className="flex-1 py-4" style={{ paddingLeft: 0 }}>
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cn("bl-nav-item", active === t.key && "active")}
        >
          {t.icon}{t.label}
        </button>
      ))}
    </nav>
  );
}

// ─── DashboardShell ───────────────────────────────────────────────────────────

function DashboardShell({ tabs, active, onChange, signOut, children }: {
  tabs: Tab[]; active: string; onChange: (k: string) => void;
  signOut: () => Promise<void>; children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <div className="lg:flex" style={{ minHeight: 500 }}>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col flex-shrink-0" style={{ width: 240, background: "var(--bl-sidebar)", borderRight: "1px solid var(--bl-border)" }}>
        <SidebarNav tabs={tabs} active={active} onChange={onChange} />
        <div className="p-3" style={{ borderTop: "1px solid var(--bl-border)" }}>
          <button
            onClick={async () => { await signOut(); router.push("/"); }}
            className="flex items-center gap-2 w-full text-sm py-2.5 px-3 rounded-xl transition-colors"
            style={{ color: "#ef4444" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(240,68,68,0.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* Mobile tab bar */}
      <div className="lg:hidden px-4 pt-4 pb-2">
        <TabBar tabs={tabs} active={active} onChange={onChange} />
      </div>

      {/* Content */}
      <div className="flex-1 p-4 lg:p-7 min-w-0">
        {children}
      </div>
    </div>
  );
}

// ─── ProfileForm ──────────────────────────────────────────────────────────────

function ProfileForm({ user, profile, refreshProfile }: {
  user: { id: string; email?: string };
  profile: ReturnType<typeof useAuth>["profile"];
  refreshProfile: () => Promise<void>;
}) {
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone]       = useState(profile?.phone ?? "");
  const [bio, setBio]           = useState(profile?.bio ?? "");
  const [agencyName, setAgencyName] = useState(profile?.agency_name ?? "");
  const [saving, setSaving]     = useState(false);

  const isAgence = profile?.account_type === "agence" || profile?.role === "agence";
  const isPro    = ["agent","agence"].includes(profile?.account_type ?? "");

  async function save() {
    if (!supabase || !fullName.trim()) return;
    setSaving(true);
    const updates: Record<string,string> = { full_name: fullName.trim() };
    if (phone.trim()) updates.phone = phone.trim();
    if (bio.trim())   updates.bio   = bio.trim();
    if (isAgence && agencyName.trim()) updates.agency_name = agencyName.trim();
    const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
    if (error) toast("Erreur lors de la sauvegarde", "error");
    else { await refreshProfile(); toast("✅ Profil sauvegardé", "success"); }
    setSaving(false);
  }

  const inputStyle: React.CSSProperties = {
    background: "rgba(240,230,204,0.04)", border: "1px solid var(--bl-border-md)",
    borderRadius: 12, padding: "10px 14px", color: "var(--bl-cream)", fontSize: 14,
    width: "100%", outline: "none",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 9, letterSpacing: "1.5px", color: "var(--bl-cream-faint)",
    textTransform: "uppercase", fontWeight: 500, marginBottom: 6, display: "block",
  };

  return (
    <div className="space-y-4">
      <div>
        <label style={labelStyle}>Prénom &amp; Nom</label>
        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Votre nom complet" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Email</label>
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl" style={{ background: "rgba(240,230,204,0.03)", border: "1px solid var(--bl-border)" }}>
          <span style={{ color: "var(--bl-cream-dim)", fontSize: 14 }} className="truncate">{user.email}</span>
          <span className="text-[11px] px-2.5 py-1 rounded-full ml-2 flex-shrink-0" style={{ background: "rgba(240,230,204,0.06)", color: "var(--bl-cream-faint)" }}>Non modifiable</span>
        </div>
      </div>
      <div>
        <label style={labelStyle}>Téléphone</label>
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+224 620 00 00 00" style={inputStyle} />
      </div>
      {isPro && (
        <div>
          <label style={labelStyle}>Bio professionnelle</label>
          <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Décrivez votre expertise..." style={{ ...inputStyle, resize: "none" }} />
        </div>
      )}
      {isAgence && (
        <div>
          <label style={labelStyle}>Nom de l&apos;agence</label>
          <input type="text" value={agencyName} onChange={(e) => setAgencyName(e.target.value)} placeholder="Nom de votre agence" style={inputStyle} />
        </div>
      )}
      <button
        onClick={save}
        disabled={saving || !fullName.trim()}
        className="w-full py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
        style={{ background: "var(--bl-amber)", color: "#fff" }}
      >
        {saving ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Sauvegarder le profil"}
      </button>
      {/* Mobile sign out */}
      <button
        onClick={async () => { if (supabase) await supabase.auth.signOut(); window.location.href = "/"; }}
        className="lg:hidden w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-colors"
        style={{ border: "1px solid rgba(240,68,68,0.30)", color: "#ef4444" }}
      >
        <LogOut className="w-4 h-4" /> Se déconnecter
      </button>
    </div>
  );
}

// ─── Chart card wrapper ───────────────────────────────────────────────────────

function ChartCard({ title, height = 160, children }: { title: string; height?: number; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-4 mb-6" style={{ background: "var(--bl-surface)", border: "1px solid var(--bl-border)" }}>
      <SectionLabel>{title}</SectionLabel>
      <ResponsiveContainer width="100%" height={height}>
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
}

const CHART_STYLE = {
  contentStyle: { background: "#0d1a10", border: "1px solid rgba(240,230,204,0.15)", borderRadius: 8, color: "#f7f2e6", fontSize: 12 },
  cursor: { fill: "rgba(200,144,30,0.08)" },
  tick: { fill: "rgba(240,230,204,0.35)", fontSize: 10 },
};

// ─── ListingsManager ──────────────────────────────────────────────────────────

function ListingsManager({ userId, limit }: { userId: string; limit?: number }) {
  const [listings, setListings]       = useState<Listing[]>([]);
  const [loading, setLoading]         = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Listing | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase
      .from("properties")
      .select("id,title,neighborhood,price,price_period,available_now,views,property_images!inner(url,is_primary,sort_order)")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });
    const mapped: Listing[] = (data ?? []).map((row) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const imgs: any[] = (row as any).property_images ?? [];
      const primary = imgs.find((i) => i.is_primary) ?? imgs.sort((a,b) => a.sort_order - b.sort_order)[0];
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
    if (error) toast("Erreur lors de la mise à jour", "error");
    else { setListings((p) => p.map((l) => l.id === listing.id ? { ...l, available_now: newVal } : l)); toast(newVal ? "✅ Remise disponible" : "✅ Marquée comme louée", "success"); }
    setActionLoading(null);
  }

  async function deleteListing(listing: Listing) {
    if (!supabase) return;
    setDeleteTarget(null);
    setActionLoading(listing.id + "-delete");
    const { error } = await supabase.from("properties").delete().eq("id", listing.id);
    if (error) toast("Erreur lors de la suppression", "error");
    else { setListings((p) => p.filter((l) => l.id !== listing.id)); toast("✅ Annonce supprimée", "success"); }
    setActionLoading(null);
  }

  const displayed = limit ? listings.slice(0, limit) : listings;

  if (loading) return (
    <div className="space-y-3">
      {[1,2].map((i) => <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: "rgba(240,230,204,0.04)" }} />)}
    </div>
  );

  if (listings.length === 0) return (
    <div className="text-center py-14 rounded-2xl" style={{ border: "2px dashed var(--bl-border-md)" }}>
      <div className="text-4xl mb-3">🏠</div>
      <p className="font-bold mb-1" style={{ color: "var(--bl-cream)" }}>Aucune annonce</p>
      <p className="text-sm mb-4" style={{ color: "var(--bl-cream-faint)" }}>Publiez votre premier bien en quelques minutes.</p>
      <Link href="/publier" className="inline-flex items-center gap-2 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors" style={{ background: "var(--bl-amber)", color: "#fff" }}>
        <Plus className="w-4 h-4" /> Publier maintenant →
      </Link>
    </div>
  );

  return (
    <>
      {limit && (
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs" style={{ color: "var(--bl-cream-faint)" }}>{listings.length} annonce{listings.length > 1 ? "s" : ""} au total</p>
          <Link href="/publier" className="flex items-center gap-1.5 text-xs font-bold hover:underline" style={{ color: "var(--bl-amber)" }}>
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
            <div key={listing.id} className={cn("rounded-2xl overflow-hidden transition-opacity", busy && "opacity-60 pointer-events-none")} style={{ background: "var(--bl-surface)", border: "1px solid var(--bl-border)" }}>
              <div className="flex gap-3 p-3">
                <Link href={`/annonces/${listing.id}`} className="relative w-24 h-20 flex-shrink-0 rounded-xl overflow-hidden" style={{ background: "rgba(240,230,204,0.05)" }}>
                  {listing.primary_image
                    ? <Image src={listing.primary_image} alt={listing.title} fill className="object-cover" sizes="96px" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl">🏠</div>}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/annonces/${listing.id}`}><p className="font-bold text-sm leading-snug line-clamp-2" style={{ color: "var(--bl-cream)" }}>{listing.title}</p></Link>
                  <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: "var(--bl-cream-faint)" }}>
                    <MapPin className="w-3 h-3 flex-shrink-0" />{NL[listing.neighborhood] ?? listing.neighborhood}
                  </div>
                  <p className="font-bold text-sm mt-1" style={{ color: "var(--bl-amber-light)" }}>{fmtGNF(listing.price, listing.price_period)}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {listing.available_now
                      ? <span className="bl-badge-active inline-flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5" /> Disponible</span>
                      : <span className="bl-badge-rented inline-flex items-center gap-1"><XCircle className="w-2.5 h-2.5" /> Loué</span>}
                    <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--bl-cream-faint)" }}>
                      <Eye className="w-3 h-3" /> {listing.views} vue{listing.views !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 px-3 pb-3">
                <button onClick={() => toggleAvailability(listing)} disabled={busy}
                  className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-colors",
                    listing.available_now ? "text-red-400 hover:bg-red-900/20" : "text-[#6ec97a] hover:bg-green-900/20")}
                  style={{ border: listing.available_now ? "1px solid rgba(240,68,68,0.25)" : "1px solid rgba(110,201,122,0.25)" }}>
                  {isAvailBusy ? <div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
                    : listing.available_now ? <><XCircle className="w-3.5 h-3.5" /> Marquer loué</>
                    : <><RotateCcw className="w-3.5 h-3.5" /> Remettre dispo</>}
                </button>
                <Link href={`/publier?edit=${listing.id}`} className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-colors" style={{ border: "1px solid var(--bl-border-md)", color: "var(--bl-cream-dim)" }}>
                  <Pencil className="w-3.5 h-3.5" /> Modifier
                </Link>
                <button onClick={() => setDeleteTarget(listing)} disabled={busy} className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-red-400 transition-colors hover:bg-red-900/10" style={{ border: "1px solid var(--bl-border)" }}>
                  {isDeleteBusy ? <div className="w-3.5 h-3.5 border border-red-400 border-t-transparent rounded-full animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}
        {!limit && (
          <Link href="/publier" className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-colors" style={{ border: "1px dashed rgba(200,144,30,0.40)", color: "var(--bl-amber)" }}>
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
  const [tab, setTab]               = useState("recherches");
  const [searches, setSearches]     = useState<SavedSearch[]>([]);
  const [searchesLoading, setSearchesLoading] = useState(true);
  const [showNew, setShowNew]       = useState(false);
  const [newLabel, setNewLabel]     = useState("");
  const [newNeighborhood, setNewNeighborhood] = useState("");
  const [newType, setNewType]       = useState("");
  const [newTx, setNewTx]           = useState("");
  const [saving, setSaving]         = useState(false);

  const load = useCallback(async () => {
    if (!supabase) return;
    setSearchesLoading(true);
    const { data } = await supabase.from("saved_searches").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setSearches((data ?? []) as SavedSearch[]);
    setSearchesLoading(false);
  }, [user.id]);
  useEffect(() => { load(); }, [load]);

  async function deleteSearch(id: string) {
    if (!supabase) return;
    await supabase.from("saved_searches").delete().eq("id", id);
    setSearches((p) => p.filter((s) => s.id !== id));
    toast("✅ Recherche supprimée", "success");
  }
  async function toggleNotify(s: SavedSearch) {
    if (!supabase) return;
    const v = !s.notify_whatsapp;
    await supabase.from("saved_searches").update({ notify_whatsapp: v }).eq("id", s.id);
    setSearches((p) => p.map((x) => x.id === s.id ? { ...x, notify_whatsapp: v } : x));
  }
  async function saveNewSearch() {
    if (!supabase || !newLabel.trim()) return;
    setSaving(true);
    const { data } = await supabase.from("saved_searches").insert({ user_id: user.id, label: newLabel.trim(), neighborhood: newNeighborhood || null, type: newType || null, transaction_type: newTx || null }).select().single();
    if (data) setSearches((p) => [data as SavedSearch, ...p]);
    setNewLabel(""); setNewNeighborhood(""); setNewType(""); setNewTx(""); setShowNew(false); setSaving(false);
    toast("✅ Recherche sauvegardée", "success");
  }
  function buildUrl(s: SavedSearch) {
    const p = new URLSearchParams();
    if (s.neighborhood) p.set("neighborhood", s.neighborhood);
    if (s.type) p.set("type", s.type);
    if (s.transaction_type) p.set("transaction_type", s.transaction_type);
    return `/annonces?${p.toString()}`;
  }

  const inputStyle: React.CSSProperties = {
    background: "rgba(240,230,204,0.04)", border: "1px solid var(--bl-border-md)",
    borderRadius: 12, padding: "10px 14px", color: "var(--bl-cream)", fontSize: 14, width: "100%", outline: "none",
  };

  const tabs: Tab[] = [
    { key: "recherches", label: "Recherches",  icon: <Search className="w-3.5 h-3.5" /> },
    { key: "favoris",    label: "Favoris",     icon: <Heart className="w-3.5 h-3.5" /> },
    { key: "messages",   label: "Messages",    icon: <MessageCircle className="w-3.5 h-3.5" /> },
    { key: "profil",     label: "Profil",      icon: <User className="w-3.5 h-3.5" /> },
  ];

  return (
    <DashboardShell tabs={tabs} active={tab} onChange={setTab} signOut={signOut}>
      {tab === "recherches" && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <SectionTitle>Recherches sauvegardées</SectionTitle>
            <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 text-xs font-bold hover:underline" style={{ color: "var(--bl-amber)" }}>
              <Plus className="w-3.5 h-3.5" /> Nouvelle
            </button>
          </div>
          {showNew && (
            <div className="rounded-2xl p-4 mb-4" style={{ background: "var(--bl-surface)", border: "1px solid rgba(200,144,30,0.30)" }}>
              <p className="font-bold text-sm mb-3" style={{ color: "var(--bl-cream)" }}>Nouvelle recherche</p>
              <div className="space-y-2">
                <input type="text" placeholder="Nom de la recherche *" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} style={inputStyle} />
                <div className="grid grid-cols-2 gap-2">
                  <select value={newNeighborhood} onChange={(e) => setNewNeighborhood(e.target.value)} style={{ ...inputStyle, background: "var(--bl-surface-2)" }}>
                    <option value="">Tous quartiers</option>
                    {Object.entries(NL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <select value={newType} onChange={(e) => setNewType(e.target.value)} style={{ ...inputStyle, background: "var(--bl-surface-2)" }}>
                    <option value="">Tous types</option>
                    {Object.entries(TL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <select value={newTx} onChange={(e) => setNewTx(e.target.value)} style={{ ...inputStyle, background: "var(--bl-surface-2)" }}>
                  <option value="">Location + vente</option>
                  <option value="rent">Location</option>
                  <option value="sale">Vente</option>
                </select>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setShowNew(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ border: "1px solid var(--bl-border-md)", color: "var(--bl-cream-dim)" }}>Annuler</button>
                <button onClick={saveNewSearch} disabled={saving || !newLabel.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50" style={{ background: "var(--bl-amber)", color: "#fff" }}>Sauvegarder</button>
              </div>
            </div>
          )}
          {searchesLoading ? (
            <div className="space-y-3">{[1,2].map((i) => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "rgba(240,230,204,0.04)" }} />)}</div>
          ) : searches.length === 0 ? (
            <div className="text-center py-12 rounded-2xl" style={{ border: "2px dashed var(--bl-border-md)" }}>
              <Search className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--bl-cream-faint)" }} />
              <p className="font-bold mb-1" style={{ color: "var(--bl-cream)" }}>Aucune recherche sauvegardée</p>
              <p className="text-sm mb-4" style={{ color: "var(--bl-cream-faint)" }}>Sauvegardez vos critères pour recevoir des alertes.</p>
              <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-2 font-bold px-5 py-2.5 rounded-xl text-sm" style={{ background: "var(--bl-amber)", color: "#fff" }}>
                <Plus className="w-4 h-4" /> Créer une recherche
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {searches.map((s) => (
                <div key={s.id} className="rounded-2xl p-4" style={{ background: "var(--bl-surface)", border: "1px solid var(--bl-border)" }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-bold text-sm" style={{ color: "var(--bl-cream)" }}>{s.label}</p>
                    <button onClick={() => deleteSearch(s.id)} style={{ color: "var(--bl-cream-faint)" }} className="hover:text-red-400 transition-colors flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {s.neighborhood && <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(240,230,204,0.07)", color: "var(--bl-cream-dim)" }}>{NL[s.neighborhood] ?? s.neighborhood}</span>}
                    {s.type && <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(240,230,204,0.07)", color: "var(--bl-cream-dim)" }}>{TL[s.type] ?? s.type}</span>}
                    {s.transaction_type && <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(240,230,204,0.07)", color: "var(--bl-cream-dim)" }}>{s.transaction_type === "rent" ? "Location" : "Vente"}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={buildUrl(s)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-colors" style={{ background: "rgba(200,144,30,0.12)", color: "var(--bl-amber)", border: "1px solid rgba(200,144,30,0.25)" }}>
                      Voir les annonces <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                    <button onClick={() => toggleNotify(s)} className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-colors"
                      style={s.notify_whatsapp ? { background: "rgba(110,201,122,0.12)", color: "#6ec97a", border: "1px solid rgba(110,201,122,0.25)" } : { background: "rgba(240,230,204,0.05)", color: "var(--bl-cream-faint)", border: "1px solid var(--bl-border)" }}>
                      {s.notify_whatsapp ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />} Alerte
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "favoris" && (
        <Link href="/favoris" className="flex items-center justify-between rounded-2xl p-5 transition-colors" style={{ background: "var(--bl-surface)", border: "1px solid var(--bl-border)" }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--bl-amber)"} onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--bl-border)"}>
          <div className="flex items-center gap-3">
            <Heart className="w-6 h-6 text-red-400" />
            <div><p className="font-bold" style={{ color: "var(--bl-cream)" }}>Mes favoris</p><p className="text-sm" style={{ color: "var(--bl-cream-faint)" }}>Voir mes annonces sauvegardées</p></div>
          </div>
          <ChevronRight className="w-5 h-5" style={{ color: "var(--bl-cream-faint)" }} />
        </Link>
      )}

      {tab === "messages" && (
        <Link href="/messages" className="flex items-center justify-between rounded-2xl p-5 transition-colors" style={{ background: "var(--bl-surface)", border: "1px solid var(--bl-border)" }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--bl-amber)"} onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--bl-border)"}>
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-blue-400" />
            <div><p className="font-bold" style={{ color: "var(--bl-cream)" }}>Mes messages</p><p className="text-sm" style={{ color: "var(--bl-cream-faint)" }}>Ouvrir la messagerie</p></div>
          </div>
          <ChevronRight className="w-5 h-5" style={{ color: "var(--bl-cream-faint)" }} />
        </Link>
      )}

      {tab === "profil" && <ProfileForm user={user} profile={profile} refreshProfile={refreshProfile} />}
    </DashboardShell>
  );
}

// ─── Stats loader helper ──────────────────────────────────────────────────────

async function loadDayStats(userId: string, days: number): Promise<{ data: DayStat[]; active: number; total: number; totalViews: number; totalWA: number }> {
  if (!supabase) return { data: [], active: 0, total: 0, totalViews: 0, totalWA: 0 };
  const { data: props } = await supabase.from("properties").select("id,available_now").eq("owner_id", userId);
  const ids = (props ?? []).map((p: { id: string }) => p.id);
  const active = (props ?? []).filter((p: { available_now: boolean }) => p.available_now).length;
  const total = (props ?? []).length;
  if (ids.length === 0) return { data: Array.from({ length: days }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (days - 1 - i)); return { date: d.toISOString().split("T")[0], views: 0, whatsapp_clicks: 0, message_clicks: 0 }; }), active, total, totalViews: 0, totalWA: 0 };
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - (days - 1));
  const { data: raw } = await supabase.from("listing_stats").select("date,views,whatsapp_clicks,message_clicks").in("property_id", ids).gte("date", cutoff.toISOString().split("T")[0]).order("date");
  const byDate: Record<string, DayStat> = {};
  for (const r of raw ?? []) {
    if (!byDate[r.date]) byDate[r.date] = { date: r.date, views: 0, whatsapp_clicks: 0, message_clicks: 0 };
    byDate[r.date].views += r.views; byDate[r.date].whatsapp_clicks += r.whatsapp_clicks; byDate[r.date].message_clicks += r.message_clicks;
  }
  const filled: DayStat[] = Array.from({ length: days }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (days - 1 - i)); const key = d.toISOString().split("T")[0]; return byDate[key] ?? { date: key, views: 0, whatsapp_clicks: 0, message_clicks: 0 }; });
  const totalViews = filled.reduce((a, d) => a + d.views, 0);
  const totalWA    = filled.reduce((a, d) => a + d.whatsapp_clicks, 0);
  return { data: filled, active, total, totalViews, totalWA };
}

// ─── DASHBOARD PROPRIÉTAIRE ───────────────────────────────────────────────────

function ProprietaireDashboard({ user, profile, signOut, refreshProfile }: {
  user: { id: string; email?: string };
  profile: ReturnType<typeof useAuth>["profile"];
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}) {
  const [tab, setTab]               = useState("dashboard");
  const [statsData, setStatsData]   = useState<DayStat[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [totalViews, setTotalViews] = useState(0);
  const [totalWA, setTotalWA]       = useState(0);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    loadDayStats(user.id, 7).then(({ data, active, totalViews: tv, totalWA: tw }) => {
      setStatsData(data); setActiveCount(active); setTotalViews(tv); setTotalWA(tw); setStatsLoading(false);
    });
  }, [user.id]);

  const tabs: Tab[] = [
    { key: "dashboard", label: "Tableau de bord", icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { key: "annonces",  label: "Mes annonces",    icon: <Home className="w-3.5 h-3.5" /> },
    { key: "messages",  label: "Messages",        icon: <MessageCircle className="w-3.5 h-3.5" /> },
    { key: "profil",    label: "Profil",          icon: <User className="w-3.5 h-3.5" /> },
  ];

  return (
    <DashboardShell tabs={tabs} active={tab} onChange={setTab} signOut={signOut}>
      {tab === "dashboard" && (
        <>
          <SectionTitle>Tableau de bord</SectionTitle>
          {statsLoading ? (
            <div className="grid grid-cols-2 gap-3 mb-6">{[1,2,3,4].map((i) => <div key={i} className="h-24 rounded-r-2xl animate-pulse" style={{ background: "rgba(240,230,204,0.04)", borderLeft: "3px solid rgba(200,144,30,0.20)" }} />)}</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <StatCard label="Vues (7 jours)" value={totalViews} sub="toutes annonces" />
                <StatCard label="Clics WhatsApp" value={totalWA} sub="7 derniers jours" />
                <StatCard label="Annonces actives" value={activeCount} />
                <StatCard label="Messages" value="—" sub={<Link href="/messages" style={{ color: "var(--bl-amber)" }}>Voir →</Link>} />
              </div>
              <ChartCard title="Vues par jour (7 jours)">
                <BarChart data={statsData.map((d) => ({ ...d, label: fmtDate(d.date) }))} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,230,204,0.05)" />
                  <XAxis dataKey="label" tick={CHART_STYLE.tick} axisLine={false} tickLine={false} />
                  <YAxis tick={CHART_STYLE.tick} axisLine={false} tickLine={false} />
                  <Tooltip {...CHART_STYLE} />
                  <Bar dataKey="views" name="Vues" fill="var(--bl-amber)" radius={[4,4,0,0]} />
                </BarChart>
              </ChartCard>
              <SectionLabel>Annonces récentes</SectionLabel>
              <ListingsManager userId={user.id} limit={3} />
            </>
          )}
        </>
      )}
      {tab === "annonces" && (
        <>
          <SectionTitle>Mes annonces</SectionTitle>
          <ListingsManager userId={user.id} />
        </>
      )}
      {tab === "messages" && (
        <Link href="/messages" className="flex items-center justify-between rounded-2xl p-5 transition-colors" style={{ background: "var(--bl-surface)", border: "1px solid var(--bl-border)" }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--bl-amber)"} onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--bl-border)"}>
          <div className="flex items-center gap-3"><MessageCircle className="w-6 h-6 text-blue-400" /><div><p className="font-bold" style={{ color: "var(--bl-cream)" }}>Mes messages</p><p className="text-sm" style={{ color: "var(--bl-cream-faint)" }}>Ouvrir la messagerie</p></div></div>
          <ChevronRight className="w-5 h-5" style={{ color: "var(--bl-cream-faint)" }} />
        </Link>
      )}
      {tab === "profil" && <><SectionTitle>Mon profil</SectionTitle><ProfileForm user={user} profile={profile} refreshProfile={refreshProfile} /></>}
    </DashboardShell>
  );
}

// ─── DASHBOARD AGENT ──────────────────────────────────────────────────────────

function AgentDashboard({ user, profile, signOut, refreshProfile }: {
  user: { id: string; email?: string };
  profile: ReturnType<typeof useAuth>["profile"];
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}) {
  const [tab, setTab]               = useState("dashboard");
  const [statsData, setStatsData]   = useState<DayStat[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [totalViews, setTotalViews] = useState(0);
  const [totalWA, setTotalWA]       = useState(0);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    loadDayStats(user.id, 30).then(({ data, active, totalViews: tv, totalWA: tw }) => {
      setStatsData(data); setActiveCount(active); setTotalViews(tv); setTotalWA(tw); setStatsLoading(false);
    });
  }, [user.id]);

  const tabs: Tab[] = [
    { key: "dashboard",    label: "Dashboard",    icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { key: "annonces",     label: "Annonces",     icon: <Home className="w-3.5 h-3.5" /> },
    { key: "leads",        label: "Leads",        icon: <Phone className="w-3.5 h-3.5" /> },
    { key: "statistiques", label: "Statistiques", icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { key: "profil",       label: "Profil",       icon: <User className="w-3.5 h-3.5" /> },
  ];

  const chartData = statsData.filter((_, i) => i % 3 === 0).map((d) => ({ ...d, label: fmtDate(d.date) }));

  return (
    <DashboardShell tabs={tabs} active={tab} onChange={setTab} signOut={signOut}>
      {tab === "dashboard" && (
        <>
          <SectionTitle>Dashboard agent</SectionTitle>
          {statsLoading ? (
            <div className="grid grid-cols-2 gap-3 mb-6">{[1,2,3,4].map((i) => <div key={i} className="h-24 rounded-r-2xl animate-pulse" style={{ background: "rgba(240,230,204,0.04)", borderLeft: "3px solid rgba(200,144,30,0.20)" }} />)}</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <StatCard label="Vues ce mois" value={totalViews} />
                <StatCard label="Contacts WhatsApp" value={totalWA} />
                <StatCard label="Annonces actives" value={activeCount} />
                {profile?.is_verified_pro
                  ? <StatCard label="Statut" value="✓ Pro" sub="Agent vérifié" />
                  : <StatCard label="Messages" value="—" sub={<Link href="/messages" style={{ color: "var(--bl-amber)" }}>Voir →</Link>} />}
              </div>
              <ChartCard title="Vues sur 30 jours">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,230,204,0.05)" />
                  <XAxis dataKey="label" tick={CHART_STYLE.tick} axisLine={false} tickLine={false} />
                  <YAxis tick={CHART_STYLE.tick} axisLine={false} tickLine={false} />
                  <Tooltip {...CHART_STYLE} />
                  <Bar dataKey="views" name="Vues" fill="var(--bl-amber)" radius={[3,3,0,0]} />
                </BarChart>
              </ChartCard>
              <SectionLabel>Annonces récentes</SectionLabel>
              <ListingsManager userId={user.id} limit={3} />
            </>
          )}
        </>
      )}
      {tab === "annonces" && <><SectionTitle>Mes annonces</SectionTitle><ListingsManager userId={user.id} /></>}
      {tab === "leads" && (
        <div className="text-center py-14 rounded-2xl" style={{ border: "2px dashed var(--bl-border-md)" }}>
          <Phone className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--bl-cream-faint)" }} />
          <p className="font-bold mb-1" style={{ color: "var(--bl-cream)" }}>Historique des leads</p>
          <p className="text-sm mb-4" style={{ color: "var(--bl-cream-faint)" }}>Les contacts WhatsApp et messages apparaîtront ici.</p>
          <Link href="/messages" className="inline-flex items-center gap-2 font-bold px-5 py-2.5 rounded-xl text-sm" style={{ background: "rgba(200,144,30,0.15)", color: "var(--bl-amber)", border: "1px solid rgba(200,144,30,0.30)" }}>Voir les messages</Link>
        </div>
      )}
      {tab === "statistiques" && (
        <>
          <SectionTitle>Statistiques</SectionTitle>
          <ChartCard title="Vues + WhatsApp sur 30 jours" height={200}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,230,204,0.05)" />
              <XAxis dataKey="label" tick={CHART_STYLE.tick} axisLine={false} tickLine={false} />
              <YAxis tick={CHART_STYLE.tick} axisLine={false} tickLine={false} />
              <Tooltip {...CHART_STYLE} />
              <Bar dataKey="views" name="Vues" fill="var(--bl-amber)" radius={[3,3,0,0]} />
              <Bar dataKey="whatsapp_clicks" name="WhatsApp" fill="#25D366" radius={[3,3,0,0]} />
            </BarChart>
          </ChartCard>
        </>
      )}
      {tab === "profil" && (
        <>
          <SectionTitle>Mon profil</SectionTitle>
          {profile?.is_verified_pro && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-xl" style={{ background: "rgba(200,144,30,0.10)", border: "1px solid rgba(200,144,30,0.25)" }}>
              <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "var(--bl-amber)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--bl-amber-light)" }}>Agent professionnel vérifié</p>
            </div>
          )}
          <Link href={`/agents/${user.id}`} className="flex items-center justify-between rounded-2xl px-4 py-3 mb-4 transition-colors" style={{ background: "rgba(200,144,30,0.07)", border: "1px solid rgba(200,144,30,0.20)" }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--bl-amber)"} onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(200,144,30,0.20)"}>
            <span className="text-sm font-semibold" style={{ color: "var(--bl-amber-light)" }}>Voir mon profil public</span>
            <ChevronRight className="w-4 h-4" style={{ color: "var(--bl-amber)" }} />
          </Link>
          <ProfileForm user={user} profile={profile} refreshProfile={refreshProfile} />
        </>
      )}
    </DashboardShell>
  );
}

// ─── DASHBOARD AGENCE ─────────────────────────────────────────────────────────

function AgenceDashboard({ user, profile, signOut, refreshProfile }: {
  user: { id: string; email?: string };
  profile: ReturnType<typeof useAuth>["profile"];
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}) {
  const [tab, setTab]               = useState("dashboard");
  const [statsData, setStatsData]   = useState<DayStat[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [totalViews, setTotalViews] = useState(0);
  const [totalWA, setTotalWA]       = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadDayStats(user.id, 30).then(({ data, active, total, totalViews: tv, totalWA: tw }) => {
      setStatsData(data); setActiveCount(active); setTotalCount(total); setTotalViews(tv); setTotalWA(tw); setStatsLoading(false);
    });
  }, [user.id]);

  const tabs: Tab[] = [
    { key: "dashboard", label: "Dashboard",     icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { key: "annonces",  label: "Annonces",      icon: <Home className="w-3.5 h-3.5" /> },
    { key: "equipe",    label: "Équipe",        icon: <Building2 className="w-3.5 h-3.5" /> },
    { key: "leads",     label: "Leads",         icon: <Phone className="w-3.5 h-3.5" /> },
    { key: "stats",     label: "Statistiques",  icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { key: "profil",    label: "Profil agence", icon: <User className="w-3.5 h-3.5" /> },
  ];

  const chartData = statsData.filter((_, i) => i % 5 === 0).map((d) => ({ ...d, label: fmtDate(d.date) }));

  return (
    <DashboardShell tabs={tabs} active={tab} onChange={setTab} signOut={signOut}>
      {tab === "dashboard" && (
        <>
          <SectionTitle>Dashboard agence</SectionTitle>
          {statsLoading ? (
            <div className="grid grid-cols-2 gap-3 mb-6">{[1,2,3,4,5,6].map((i) => <div key={i} className="h-24 rounded-r-2xl animate-pulse" style={{ background: "rgba(240,230,204,0.04)", borderLeft: "3px solid rgba(200,144,30,0.20)" }} />)}</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <StatCard label="Vues totales (30j)" value={totalViews} />
                <StatCard label="Annonces actives" value={activeCount} sub={`${totalCount} au total`} />
                <StatCard label="Contacts WhatsApp" value={totalWA} sub="30 derniers jours" />
                <StatCard label="Agents" value="—" sub="Bientôt disponible" />
                <StatCard label="Leads" value="—" sub={<Link href="/messages" style={{ color: "var(--bl-amber)" }}>Voir messages →</Link>} />
                <StatCard label="Note agence" value="—" sub="Bientôt" />
              </div>
              <ChartCard title="Performance 30 jours">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,230,204,0.05)" />
                  <XAxis dataKey="label" tick={CHART_STYLE.tick} axisLine={false} tickLine={false} />
                  <YAxis tick={CHART_STYLE.tick} axisLine={false} tickLine={false} />
                  <Tooltip {...CHART_STYLE} />
                  <Bar dataKey="views" name="Vues" fill="var(--bl-amber)" radius={[3,3,0,0]} />
                  <Bar dataKey="whatsapp_clicks" name="WhatsApp" fill="#25D366" radius={[3,3,0,0]} />
                </BarChart>
              </ChartCard>
              <SectionLabel>Top annonces</SectionLabel>
              <ListingsManager userId={user.id} limit={3} />
            </>
          )}
        </>
      )}
      {tab === "annonces" && <><SectionTitle>Toutes les annonces</SectionTitle><ListingsManager userId={user.id} /></>}
      {tab === "equipe" && (
        <div className="text-center py-14 rounded-2xl" style={{ border: "2px dashed var(--bl-border-md)" }}>
          <Building2 className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--bl-cream-faint)" }} />
          <p className="font-bold mb-1" style={{ color: "var(--bl-cream)" }}>Gestion de l&apos;équipe</p>
          <p className="text-sm" style={{ color: "var(--bl-cream-faint)" }}>Inviter et gérer vos agents — disponible prochainement.</p>
        </div>
      )}
      {tab === "leads" && (
        <div className="text-center py-14 rounded-2xl" style={{ border: "2px dashed var(--bl-border-md)" }}>
          <Phone className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--bl-cream-faint)" }} />
          <p className="font-bold mb-1" style={{ color: "var(--bl-cream)" }}>Leads de l&apos;agence</p>
          <p className="text-sm mb-4" style={{ color: "var(--bl-cream-faint)" }}>Tous vos contacts reçus en un seul endroit.</p>
          <Link href="/messages" className="inline-flex items-center gap-2 font-bold px-5 py-2.5 rounded-xl text-sm" style={{ background: "rgba(200,144,30,0.15)", color: "var(--bl-amber)", border: "1px solid rgba(200,144,30,0.30)" }}>Voir les messages</Link>
        </div>
      )}
      {tab === "stats" && (
        <>
          <SectionTitle>Statistiques agence</SectionTitle>
          <ChartCard title="Vues + WhatsApp sur 30 jours" height={200}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,230,204,0.05)" />
              <XAxis dataKey="label" tick={CHART_STYLE.tick} axisLine={false} tickLine={false} />
              <YAxis tick={CHART_STYLE.tick} axisLine={false} tickLine={false} />
              <Tooltip {...CHART_STYLE} />
              <Bar dataKey="views" name="Vues" fill="var(--bl-amber)" radius={[3,3,0,0]} />
              <Bar dataKey="whatsapp_clicks" name="WhatsApp" fill="#25D366" radius={[3,3,0,0]} />
            </BarChart>
          </ChartCard>
        </>
      )}
      {tab === "profil" && (
        <>
          <SectionTitle>Profil de l&apos;agence</SectionTitle>
          <Link href={`/agences/${user.id}`} className="flex items-center justify-between rounded-2xl px-4 py-3 mb-4 transition-colors" style={{ background: "rgba(200,144,30,0.07)", border: "1px solid rgba(200,144,30,0.20)" }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--bl-amber)"} onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(200,144,30,0.20)"}>
            <span className="text-sm font-semibold" style={{ color: "var(--bl-amber-light)" }}>Voir le profil public de l&apos;agence</span>
            <ChevronRight className="w-4 h-4" style={{ color: "var(--bl-amber)" }} />
          </Link>
          <ProfileForm user={user} profile={profile} refreshProfile={refreshProfile} />
        </>
      )}
    </DashboardShell>
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
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--bl-amber)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const role = profile?.role ?? "buyer";
  const accountType = profile?.account_type ?? (
    ["proprietaire","owner"].includes(role) ? "proprietaire" :
    role === "agent" ? "agent" :
    ["agence","agency"].includes(role) ? "agence" : "chercheur"
  );

  const displayName = profile?.full_name ?? user.email?.split("@")[0] ?? "Utilisateur";
  const initials    = displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  const roleLabel: Record<string, string> = {
    chercheur: "🔍 Chercheur", proprietaire: "🏠 Propriétaire",
    agent: "👔 Agent immobilier", agence: "🏢 Agence immobilière",
  };

  const dashProps = { user, profile, signOut, refreshProfile };

  return (
    <div className="max-w-3xl lg:max-w-5xl mx-auto px-4 lg:px-0 py-6 pb-24">

      {/* ── Header ── */}
      <div className="flex items-center gap-4 mb-6 lg:mb-4">
        {profile?.avatar_url ? (
          <Image src={profile.avatar_url} alt={displayName} width={52} height={52} className="rounded-2xl object-cover flex-shrink-0" />
        ) : (
          <div className="w-13 h-13 rounded-2xl flex items-center justify-center text-lg font-black flex-shrink-0" style={{ background: "rgba(200,144,30,0.15)", border: "1px solid rgba(200,144,30,0.35)", width: 52, height: 52, color: "var(--bl-amber-light)" }}>
            {initials || <User className="w-5 h-5" />}
          </div>
        )}
        <div className="min-w-0">
          <h1 style={{ fontFamily: "var(--font-playfair)", color: "var(--bl-cream)", fontSize: 20, fontWeight: 700, lineHeight: 1.2 }} className="truncate">{displayName}</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--bl-cream-faint)" }}>{roleLabel[accountType] ?? accountType}</p>
        </div>
        {accountType !== "chercheur" && (
          <Link href="/publier" className="ml-auto flex-none flex items-center gap-1.5 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors" style={{ background: "var(--bl-amber)", color: "#fff", boxShadow: "0 4px 20px rgba(200,144,30,0.30)" }}>
            <Plus className="w-4 h-4" /> Publier
          </Link>
        )}
      </div>

      {/* ── Dashboard panel ── */}
      <div className="lg:rounded-2xl lg:overflow-hidden" style={{ border: "1px solid var(--bl-border)" }}>
        {accountType === "chercheur"    && <ChercheurDashboard    {...dashProps} />}
        {accountType === "proprietaire" && <ProprietaireDashboard {...dashProps} />}
        {accountType === "agent"        && <AgentDashboard        {...dashProps} />}
        {accountType === "agence"       && <AgenceDashboard       {...dashProps} />}
      </div>
    </div>
  );
}
