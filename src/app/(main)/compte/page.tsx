"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Plus, Eye, MapPin, LogOut, Pencil, Trash2, User,
  CheckCircle, XCircle, RotateCcw, AlertTriangle, Search,
  Bell, BellOff, Heart, MessageCircle, BarChart2, Home,
  TrendingUp, Phone, Building2, ChevronRight, Download,
} from "lucide-react";
import dynamic from "next/dynamic";

const DashboardChart = dynamic(
  () => import("@/components/dashboard/DashboardChart"),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: 140, background: "#1a2e1e", borderRadius: "0 12px 12px 0", borderLeft: "3px solid rgba(200,144,30,0.20)", marginBottom: 24 }} />
    ),
  }
);
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { DashboardLayout, type DashTab } from "@/components/dashboard/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { AvatarUpload } from "@/components/ui/AvatarUpload";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Listing {
  id: string; title: string; neighborhood: string;
  price: number; price_period: string | null;
  available_now: boolean; views: number;
  whatsapp_clicks: number;
  primary_image: string | null;
  expires_at: string | null;
  status: string | null;
}
interface SavedSearch {
  id: string; label: string; neighborhood: string | null; type: string | null;
  transaction_type: string | null; min_price: number | null; max_price: number | null;
  min_rooms: number | null; notify_whatsapp: boolean; created_at: string;
}
interface DayStat {
  date: string; views: number; whatsapp_clicks: number; message_clicks: number;
}
interface Lead {
  id: string; sender_id: string; property_id: string | null;
  message: string; created_at: string;
  sender_name: string | null; sender_phone: string | null;
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
function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
function todayLabel() {
  return new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

// ─── Dialogs ──────────────────────────────────────────────────────────────────

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

function DeleteAccountDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  const [confirm, setConfirm] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="rounded-2xl p-6 max-w-sm w-full shadow-2xl" style={{ background: "#0d1a10", border: "1px solid rgba(240,68,68,0.30)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(240,68,68,0.15)" }}>
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="font-bold text-sm text-red-400">Supprimer le compte</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--bl-cream-faint)" }}>Action permanente et irréversible.</p>
          </div>
        </div>
        <p className="text-sm mb-4" style={{ color: "var(--bl-cream-dim)" }}>
          Toutes vos annonces, messages et données seront supprimés. Tapez <strong style={{ color: "var(--bl-cream)" }}>SUPPRIMER</strong> pour confirmer.
        </p>
        <input
          type="text" value={confirm} onChange={(e) => setConfirm(e.target.value)}
          placeholder="SUPPRIMER"
          style={{ background: "rgba(240,230,204,0.04)", border: "1px solid rgba(240,68,68,0.30)", borderRadius: 10, padding: "10px 14px", color: "var(--bl-cream)", fontSize: 14, width: "100%", outline: "none", marginBottom: 16 }}
        />
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ border: "1px solid var(--bl-border-md)", color: "var(--bl-cream-dim)" }}>Annuler</button>
          <button onClick={onConfirm} disabled={confirm !== "SUPPRIMER"} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white font-bold text-sm transition-colors">
            Supprimer
          </button>
        </div>
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
  const [fullName, setFullName]   = useState(profile?.full_name ?? "");
  const [phone, setPhone]         = useState(profile?.phone ?? "");
  const [bio, setBio]             = useState(profile?.bio ?? "");
  const [agencyName, setAgencyName] = useState(profile?.agency_name ?? "");
  const [saving, setSaving]       = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

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

  async function deleteAccount() {
    setShowDeleteAccount(false);
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const inputCss: React.CSSProperties = {
    background: "rgba(240,230,204,0.05)", border: "1px solid var(--bl-border-md)",
    borderRadius: 10, padding: "0 14px", color: "var(--bl-cream)",
    fontSize: 16, width: "100%", outline: "none", height: 50,
    transition: "border-color 0.15s",
  };
  const labelCss: React.CSSProperties = {
    fontSize: 9, letterSpacing: "1.5px", color: "var(--bl-cream-faint)",
    textTransform: "uppercase", fontWeight: 500, marginBottom: 6, display: "block",
  };

  function FocusInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
      <input
        {...props}
        style={inputCss}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--bl-amber)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(240,230,204,0.15)")}
      />
    );
  }

  return (
    <div>
      {/* Avatar */}
      <div className="flex flex-col items-center mb-6">
        <AvatarUpload
          userId={user.id}
          currentUrl={profile?.avatar_url}
          name={profile?.full_name}
          onSuccess={() => { void refreshProfile(); }}
        />
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label style={labelCss}>Prénom &amp; Nom</label>
          <FocusInput type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Votre nom complet" />
        </div>
        <div>
          <label style={labelCss}>Email</label>
          <div className="flex items-center justify-between px-3.5 rounded-xl" style={{ height: 50, background: "rgba(240,230,204,0.03)", border: "1px solid var(--bl-border)" }}>
            <span style={{ color: "var(--bl-cream-dim)", fontSize: 14 }} className="truncate">{user.email}</span>
            <span className="text-[11px] px-2.5 py-1 rounded-full ml-2 flex-shrink-0" style={{ background: "rgba(240,230,204,0.06)", color: "var(--bl-cream-faint)" }}>Non modifiable</span>
          </div>
        </div>
        <div>
          <label style={labelCss}>Téléphone</label>
          <FocusInput type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+224 620 00 00 00" />
        </div>
        {isPro && (
          <div>
            <label style={labelCss}>Bio professionnelle</label>
            <textarea
              rows={3} value={bio} onChange={(e) => setBio(e.target.value)}
              placeholder="Décrivez votre expertise..."
              style={{ ...inputCss, height: "auto", padding: "12px 14px", resize: "none" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--bl-amber)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(240,230,204,0.15)")}
            />
          </div>
        )}
        {isAgence && (
          <div>
            <label style={labelCss}>Nom de l&apos;agence</label>
            <FocusInput type="text" value={agencyName} onChange={(e) => setAgencyName(e.target.value)} placeholder="Nom de votre agence" />
          </div>
        )}
      </div>

      <button
        onClick={save} disabled={saving || !fullName.trim()}
        className="w-full py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 mb-6"
        style={{ background: "var(--bl-amber)", color: "#fff" }}
      >
        {saving ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Sauvegarder le profil"}
      </button>

      {/* Mon plan */}
      <div className="rounded-r-2xl p-4 mb-6" style={{ background: "var(--bl-surface)", borderLeft: "3px solid var(--bl-amber-light)" }}>
        <p className="bl-section-label mb-2">Mon plan</p>
        <p className="font-bold" style={{ color: "var(--bl-cream)", fontFamily: "var(--font-playfair)" }}>
          {profile?.is_verified_pro ? "Plan Pro" : "Plan Gratuit"}
        </p>
        <p className="text-xs mt-1 mb-3" style={{ color: "var(--bl-cream-faint)" }}>
          {profile?.is_verified_pro ? "Annonces illimitées · Badge vérifié · Priorité dans les résultats" : "Jusqu'à 5 annonces · Visibilité standard"}
        </p>
        <Link href="/tarifs" className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
          style={{ background: "rgba(200,144,30,0.12)", color: "var(--bl-amber)", border: "1px solid rgba(200,144,30,0.25)" }}>
          {profile?.is_verified_pro ? "Gérer l'abonnement" : "Passer Pro"} →
        </Link>
      </div>

      {/* Sécurité */}
      <div className="space-y-2">
        <p className="bl-section-label">Sécurité</p>
        <button
          className="lg:hidden w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-colors"
          style={{ border: "1px solid rgba(240,68,68,0.30)", color: "#ef4444" }}
          onClick={async () => { if (supabase) await supabase.auth.signOut(); window.location.href = "/"; }}
        >
          <LogOut className="w-4 h-4" /> Se déconnecter
        </button>
        <button
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors"
          style={{ border: "1px solid var(--bl-border-md)", color: "var(--bl-cream-faint)" }}
          onClick={() => setShowDeleteAccount(true)}
        >
          <Trash2 className="w-4 h-4" /> Supprimer mon compte
        </button>
      </div>

      {showDeleteAccount && (
        <DeleteAccountDialog onConfirm={deleteAccount} onCancel={() => setShowDeleteAccount(false)} />
      )}
    </div>
  );
}

// ─── ListingsManager ──────────────────────────────────────────────────────────

function ListingsManager({ userId, limit }: { userId: string; limit?: number }) {
  const [listings, setListings]       = useState<Listing[]>([]);
  const [loading, setLoading]         = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Listing | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const [propRes, statsRes] = await Promise.all([
      supabase.from("properties")
        .select("id,title,neighborhood,price,price_period,available_now,views,expires_at,status,property_images(url,is_primary,sort_order)")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false }),
      supabase.from("listing_stats")
        .select("property_id,whatsapp_clicks"),
    ]);

    // Build WA clicks map per property
    const waMap: Record<string, number> = {};
    for (const s of statsRes.data ?? []) {
      waMap[s.property_id] = (waMap[s.property_id] ?? 0) + (s.whatsapp_clicks ?? 0);
    }

    const mapped: Listing[] = (propRes.data ?? []).map((row) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const imgs: any[] = (row as any).property_images ?? [];
      const primary = imgs.find((i) => i.is_primary) ?? imgs.sort((a,b) => a.sort_order - b.sort_order)[0];
      return {
        id: row.id, title: row.title, neighborhood: row.neighborhood,
        price: row.price, price_period: row.price_period,
        available_now: row.available_now ?? true,
        views: row.views ?? 0,
        whatsapp_clicks: waMap[row.id] ?? 0,
        primary_image: primary?.url ?? null,
        expires_at: (row as { expires_at?: string | null }).expires_at ?? null,
        status: (row as { status?: string | null }).status ?? null,
      };
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
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {listing.status === "pending" ? (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: "rgba(200,144,30,0.15)", color: "#daa84a" }}>
                        ⏳ En attente de validation
                      </span>
                    ) : (
                      <StatusBadge status={listing.available_now ? "active" : "sold"} />
                    )}
                    <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--bl-cream-faint)" }}>
                      <Eye className="w-3 h-3" /> {listing.views} · <Phone className="w-3 h-3" /> {listing.whatsapp_clicks}
                    </span>
                    {listing.expires_at && listing.status === "active" && (() => {
                      const daysLeft = Math.ceil((new Date(listing.expires_at).getTime() - Date.now()) / 86400000);
                      if (daysLeft > 7) return null;
                      return (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: daysLeft <= 0 ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)", color: "#f87171" }}>
                          {daysLeft <= 0 ? "Expirée" : `Expire dans ${daysLeft}j`}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 px-3 pb-3">
                {listing.expires_at && listing.status === "active" && (() => {
                  const daysLeft = Math.ceil((new Date(listing.expires_at).getTime() - Date.now()) / 86400000);
                  if (daysLeft > 7) return null;
                  const isRenewBusy = actionLoading === listing.id + "-renew";
                  return (
                    <button
                      onClick={async () => {
                        if (!supabase) return;
                        setActionLoading(listing.id + "-renew");
                        const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                        const { error } = await supabase.from("properties").update({ expires_at: newExpiry }).eq("id", listing.id);
                        if (error) toast("Erreur renouvellement", "error");
                        else { setListings((p) => p.map((l) => l.id === listing.id ? { ...l, expires_at: newExpiry } : l)); toast("✅ Annonce renouvelée 30 jours", "success"); }
                        setActionLoading(null);
                      }}
                      disabled={busy || isRenewBusy}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-[#daa84a] transition-colors hover:bg-amber-900/10"
                      style={{ border: "1px solid rgba(200,144,30,0.30)" }}
                    >
                      {isRenewBusy ? <div className="w-3.5 h-3.5 border border-[#daa84a] border-t-transparent rounded-full animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                      Renouveler
                    </button>
                  );
                })()}
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

// ─── Stats loader ─────────────────────────────────────────────────────────────

async function loadDayStats(userId: string, days: number): Promise<{
  data: DayStat[]; active: number; total: number; totalViews: number; totalWA: number;
}> {
  if (!supabase) return { data: [], active: 0, total: 0, totalViews: 0, totalWA: 0 };
  const { data: props } = await supabase.from("properties").select("id,available_now").eq("owner_id", userId);
  const ids    = (props ?? []).map((p: { id: string }) => p.id);
  const active = (props ?? []).filter((p: { available_now: boolean }) => p.available_now).length;
  const total  = (props ?? []).length;

  const emptyDays = Array.from({ length: days }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
    return { date: d.toISOString().split("T")[0], views: 0, whatsapp_clicks: 0, message_clicks: 0 };
  });
  if (ids.length === 0) return { data: emptyDays, active, total, totalViews: 0, totalWA: 0 };

  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - (days - 1));
  const { data: raw } = await supabase.from("listing_stats")
    .select("date,views,whatsapp_clicks,message_clicks")
    .in("property_id", ids)
    .gte("date", cutoff.toISOString().split("T")[0])
    .order("date");

  const byDate: Record<string, DayStat> = {};
  for (const r of raw ?? []) {
    if (!byDate[r.date]) byDate[r.date] = { date: r.date, views: 0, whatsapp_clicks: 0, message_clicks: 0 };
    byDate[r.date].views += r.views; byDate[r.date].whatsapp_clicks += r.whatsapp_clicks; byDate[r.date].message_clicks += r.message_clicks;
  }
  const filled = emptyDays.map((d) => byDate[d.date] ?? d);
  const totalViews = filled.reduce((a, d) => a + d.views, 0);
  const totalWA    = filled.reduce((a, d) => a + d.whatsapp_clicks, 0);
  return { data: filled, active, total, totalViews, totalWA };
}

async function loadMessagesCount(userId: string): Promise<number> {
  if (!supabase) return 0;
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
  const { count } = await supabase.from("messages")
    .select("id", { count: "exact", head: true })
    .eq("receiver_id", userId)
    .gte("created_at", cutoff.toISOString());
  return count ?? 0;
}

async function loadRecentLeads(userId: string): Promise<Lead[]> {
  if (!supabase) return [];
  try {
    const { data } = await supabase.from("messages")
      .select("id, sender_id, property_id, message, created_at")
      .eq("receiver_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);
    if (!data || data.length === 0) return [];
    const senderIds = [...new Set(data.map((m) => m.sender_id))];
    const { data: profiles } = await supabase.from("profiles").select("id, full_name, phone").in("id", senderIds);
    const pMap: Record<string, { full_name: string | null; phone: string | null }> = {};
    for (const p of profiles ?? []) pMap[p.id] = p;
    return data.map((m) => ({
      id: m.id, sender_id: m.sender_id, property_id: m.property_id,
      message: m.message, created_at: m.created_at,
      sender_name: pMap[m.sender_id]?.full_name ?? null,
      sender_phone: pMap[m.sender_id]?.phone ?? null,
    }));
  } catch { return []; }
}

// ─── RAPPORT MENSUEL ─────────────────────────────────────────────────────────

interface MonthlyReport {
  id: string; month: string; views_total: number;
  whatsapp_clicks_total: number; active_listings: number; sent_at: string;
}

function MonthlyReportSection({ userId }: { userId: string }) {
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.from("monthly_reports")
      .select("id,month,views_total,whatsapp_clicks_total,active_listings,sent_at")
      .eq("user_id", userId)
      .order("sent_at", { ascending: false })
      .limit(6)
      .then(({ data }) => { setReports((data ?? []) as MonthlyReport[]); setLoading(false); });
  }, [userId]);

  if (!loading && reports.length === 0) return null;

  return (
    <div className="mt-6">
      <SectionHeader title="Rapports mensuels" subtitle="Activité envoyée par WhatsApp" />
      {loading ? (
        <div className="h-20 rounded-2xl animate-pulse" style={{ background: "rgba(240,230,204,0.04)" }} />
      ) : (
        <div className="space-y-2">
          {reports.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "var(--bl-surface)", border: "1px solid var(--bl-border)" }}>
              <div>
                <p className="text-sm font-bold capitalize" style={{ color: "var(--bl-cream)" }}>{r.month}</p>
                <p className="text-xs" style={{ color: "var(--bl-cream-faint)" }}>
                  {r.views_total} vues · {r.whatsapp_clicks_total} clics WA · {r.active_listings} annonces actives
                </p>
              </div>
              <p className="text-[11px]" style={{ color: "var(--bl-cream-faint)" }}>
                {new Date(r.sent_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── DASHBOARD PROPRIÉTAIRE ───────────────────────────────────────────────────

function ProprietaireDashboard({ user, profile, signOut, refreshProfile }: {
  user: { id: string; email?: string };
  profile: ReturnType<typeof useAuth>["profile"];
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}) {
  const [tab, setTab]             = useState("dashboard");
  const [statsData, setStatsData] = useState<DayStat[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [totalViews, setTotalViews] = useState(0);
  const [totalWA, setTotalWA]     = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [msgCount, setMsgCount]   = useState(0);

  const displayName = profile?.full_name?.split(" ")[0] ?? "vous";

  useEffect(() => {
    Promise.all([
      loadDayStats(user.id, 7),
      loadMessagesCount(user.id),
    ]).then(([{ data, active, totalViews: tv, totalWA: tw }, mc]) => {
      setStatsData(data); setActiveCount(active); setTotalViews(tv); setTotalWA(tw);
      setMsgCount(mc); setStatsLoading(false);
    });
  }, [user.id]);

  const tabs: DashTab[] = [
    { key: "dashboard", label: "Tableau de bord", icon: <BarChart2 className="w-4 h-4" /> },
    { key: "annonces",  label: "Mes annonces",    icon: <Home className="w-4 h-4" /> },
    { key: "messages",  label: "Messages",        icon: <MessageCircle className="w-4 h-4" /> },
    { key: "profil",    label: "Profil",          icon: <User className="w-4 h-4" /> },
  ];

  const initials = (profile?.full_name ?? user.email ?? "?").split(" ").map((w:string) => w[0]).join("").slice(0,2).toUpperCase();

  return (
    <DashboardLayout tabs={tabs} active={tab} onChange={setTab} signOut={signOut}
      userName={profile?.full_name ?? user.email ?? "Utilisateur"} userInitials={initials}>
      {tab === "dashboard" && (
        <>
          {/* Page header */}
          <div className="mb-6">
            <h1 style={{ fontFamily: "var(--font-playfair)", color: "var(--bl-amber-light)", fontSize: 28, fontWeight: 700, lineHeight: 1.2 }}>
              Bonjour, {displayName}
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--bl-cream-dim)", fontWeight: 300 }}>Votre activité cette semaine</p>
            <p className="text-xs mt-0.5 capitalize" style={{ color: "var(--bl-cream-faint)" }}>{todayLabel()}</p>
          </div>

          {statsLoading ? (
            <div className="grid grid-cols-2 gap-3 mb-6">{[1,2,3,4].map((i) => <div key={i} className="h-24 animate-pulse" style={{ borderLeft: "3px solid rgba(200,144,30,0.20)", borderRadius: "0 12px 12px 0", background: "rgba(240,230,204,0.04)" }} />)}</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <StatCard label="Vues 7 jours" value={totalViews} sub="toutes annonces" borderColor="#c8901e" />
                <StatCard label="Clics WhatsApp" value={totalWA} sub="7 derniers jours" borderColor="#6ec97a" />
                <StatCard label="Messages reçus" value={msgCount} sub="cette semaine" borderColor="#daa84a" />
                <StatCard label="Annonces actives" value={activeCount} sub="sur 5 max" borderColor="#6ec97a" />
              </div>

              <DashboardChart
                type="bar"
                title="Vues par jour — 7 jours"
                data={statsData.map((d) => ({ ...d, label: fmtDate(d.date) }))}
                series={[{ dataKey: "views", name: "Vues", color: "#c8901e" }]}
              />

              <SectionHeader title="Mes annonces" action={
                <Link href="/publier" className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: "var(--bl-amber)", color: "#fff" }}>
                  <Plus className="w-3.5 h-3.5" /> Publier
                </Link>
              } />
              <ListingsManager userId={user.id} limit={3} />

              <MonthlyReportSection userId={user.id} />
            </>
          )}
        </>
      )}
      {tab === "annonces" && (
        <>
          <SectionHeader title="Mes annonces" action={
            <Link href="/publier" className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: "var(--bl-amber)", color: "#fff" }}>
              <Plus className="w-3.5 h-3.5" /> Publier
            </Link>
          } />
          <ListingsManager userId={user.id} />
        </>
      )}
      {tab === "messages" && (
        <Link href="/messages" className="flex items-center justify-between rounded-2xl p-5" style={{ background: "var(--bl-surface)", border: "1px solid var(--bl-border)" }}>
          <div className="flex items-center gap-3"><MessageCircle className="w-6 h-6 text-blue-400" /><div><p className="font-bold" style={{ color: "var(--bl-cream)" }}>Mes messages</p><p className="text-sm" style={{ color: "var(--bl-cream-faint)" }}>Ouvrir la messagerie</p></div></div>
          <ChevronRight className="w-5 h-5" style={{ color: "var(--bl-cream-faint)" }} />
        </Link>
      )}
      {tab === "profil" && <><SectionHeader title="Mon profil" /><ProfileForm user={user} profile={profile} refreshProfile={refreshProfile} /></>}
    </DashboardLayout>
  );
}

// ─── DASHBOARD CHERCHEUR ──────────────────────────────────────────────────────

function ChercheurDashboard({ user, profile, signOut, refreshProfile }: {
  user: { id: string; email?: string };
  profile: ReturnType<typeof useAuth>["profile"];
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}) {
  const [tab, setTab]             = useState("recherches");
  const [searches, setSearches]   = useState<SavedSearch[]>([]);
  const [searchesLoading, setSearchesLoading] = useState(true);
  const [showNew, setShowNew]     = useState(false);
  const [newLabel, setNewLabel]   = useState("");
  const [newNeighborhood, setNewNeighborhood] = useState("");
  const [newType, setNewType]     = useState("");
  const [newTx, setNewTx]         = useState("");
  const [saving, setSaving]       = useState(false);

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

  const tabs: DashTab[] = [
    { key: "recherches", label: "Recherches",  icon: <Search className="w-4 h-4" /> },
    { key: "favoris",    label: "Favoris",     icon: <Heart className="w-4 h-4" /> },
    { key: "messages",   label: "Messages",    icon: <MessageCircle className="w-4 h-4" /> },
    { key: "profil",     label: "Profil",      icon: <User className="w-4 h-4" /> },
  ];

  const initials = (profile?.full_name ?? user.email ?? "?").split(" ").map((w:string) => w[0]).join("").slice(0,2).toUpperCase();

  return (
    <DashboardLayout tabs={tabs} active={tab} onChange={setTab} signOut={signOut}
      userName={profile?.full_name ?? user.email ?? "Utilisateur"} userInitials={initials}>
      {tab === "recherches" && (
        <div>
          <SectionHeader title="Votre espace recherche" subtitle="Gérez vos critères et alertes" action={
            <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: "var(--bl-amber)", color: "#fff" }}>
              <Plus className="w-3.5 h-3.5" /> Nouvelle
            </button>
          } />
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
                <div key={s.id} className="rounded-2xl p-4" style={{ background: "var(--bl-surface)", borderLeft: "3px solid var(--bl-amber)", borderRadius: "0 16px 16px 0" }}>
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
                    <Link href={buildUrl(s)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold" style={{ background: "rgba(200,144,30,0.12)", color: "var(--bl-amber)", border: "1px solid rgba(200,144,30,0.25)" }}>
                      Voir les annonces <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                    <button onClick={() => toggleNotify(s)} className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold"
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
        <div>
          <SectionHeader title="Mes favoris" />
          <Link href="/favoris" className="flex items-center justify-between rounded-2xl p-5" style={{ background: "var(--bl-surface)", border: "1px solid var(--bl-border)" }}>
            <div className="flex items-center gap-3">
              <Heart className="w-6 h-6 text-red-400" />
              <div><p className="font-bold" style={{ color: "var(--bl-cream)" }}>Mes annonces sauvegardées</p><p className="text-sm" style={{ color: "var(--bl-cream-faint)" }}>Voir tous mes favoris</p></div>
            </div>
            <ChevronRight className="w-5 h-5" style={{ color: "var(--bl-cream-faint)" }} />
          </Link>
        </div>
      )}

      {tab === "messages" && (
        <div>
          <SectionHeader title="Messages" />
          <Link href="/messages" className="flex items-center justify-between rounded-2xl p-5" style={{ background: "var(--bl-surface)", border: "1px solid var(--bl-border)" }}>
            <div className="flex items-center gap-3"><MessageCircle className="w-6 h-6 text-blue-400" /><div><p className="font-bold" style={{ color: "var(--bl-cream)" }}>Mes messages</p><p className="text-sm" style={{ color: "var(--bl-cream-faint)" }}>Ouvrir la messagerie</p></div></div>
            <ChevronRight className="w-5 h-5" style={{ color: "var(--bl-cream-faint)" }} />
          </Link>
        </div>
      )}

      {tab === "profil" && <><SectionHeader title="Mon profil" /><ProfileForm user={user} profile={profile} refreshProfile={refreshProfile} /></>}
    </DashboardLayout>
  );
}

// ─── DASHBOARD AGENT ──────────────────────────────────────────────────────────

function AgentDashboard({ user, profile, signOut, refreshProfile }: {
  user: { id: string; email?: string };
  profile: ReturnType<typeof useAuth>["profile"];
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}) {
  const [tab, setTab]             = useState("dashboard");
  const [statsData, setStatsData] = useState<DayStat[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [totalViews, setTotalViews] = useState(0);
  const [totalWA, setTotalWA]     = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [msgCount, setMsgCount]   = useState(0);
  const [leads, setLeads]         = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      loadDayStats(user.id, 30),
      loadMessagesCount(user.id),
    ]).then(([{ data, active, totalViews: tv, totalWA: tw }, mc]) => {
      setStatsData(data); setActiveCount(active); setTotalViews(tv); setTotalWA(tw);
      setMsgCount(mc); setStatsLoading(false);
    });
    loadRecentLeads(user.id).then((l) => { setLeads(l); setLeadsLoading(false); });
  }, [user.id]);

  const tabs: DashTab[] = [
    { key: "dashboard",    label: "Dashboard",    icon: <BarChart2 className="w-4 h-4" /> },
    { key: "annonces",     label: "Annonces",     icon: <Home className="w-4 h-4" /> },
    { key: "leads",        label: "Leads",        icon: <Phone className="w-4 h-4" /> },
    { key: "statistiques", label: "Statistiques", icon: <TrendingUp className="w-4 h-4" /> },
    { key: "profil",       label: "Profil",       icon: <User className="w-4 h-4" /> },
  ];

  const initials = (profile?.full_name ?? user.email ?? "?").split(" ").map((w:string) => w[0]).join("").slice(0,2).toUpperCase();
  const chartLine = statsData.map((d) => ({ ...d, label: fmtDate(d.date) }));
  const chartSampled = chartLine.filter((_, i) => i % 3 === 0);

  return (
    <DashboardLayout tabs={tabs} active={tab} onChange={setTab} signOut={signOut}
      userName={profile?.full_name ?? user.email ?? "Utilisateur"} userInitials={initials}
      userBadge={profile?.is_verified_pro ? "Agent Pro" : undefined}>
      {tab === "dashboard" && (
        <>
          <div className="mb-6">
            <h1 style={{ fontFamily: "var(--font-playfair)", color: "var(--bl-amber-light)", fontSize: 26, fontWeight: 700 }}>
              Tableau de bord Agent
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--bl-cream-dim)", fontWeight: 300 }}>Performance sur 30 jours</p>
          </div>

          {statsLoading ? (
            <div className="grid grid-cols-2 gap-3 mb-6">{[1,2,3,4,5].map((i) => <div key={i} className="h-24 animate-pulse" style={{ borderLeft: "3px solid rgba(200,144,30,0.20)", borderRadius: "0 12px 12px 0", background: "rgba(240,230,204,0.04)" }} />)}</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <StatCard label="Vues ce mois"  value={totalViews}  borderColor="#c8901e" />
                <StatCard label="Clics WhatsApp" value={totalWA}    borderColor="#6ec97a" />
                <StatCard label="Messages reçus" value={msgCount}   borderColor="#daa84a" />
                <StatCard label="Annonces actives" value={activeCount} borderColor="#6ec97a" />
                <StatCard label="Statut" value={profile?.is_verified_pro ? "✓ Pro" : "Agent"} sub={profile?.is_verified_pro ? "Vérifié" : "Standard"} borderColor="#daa84a" />
              </div>

              <DashboardChart
                type="line"
                title="Vues sur 30 jours"
                data={chartLine}
                height={160}
                series={[{ dataKey: "views", name: "Vues", color: "#c8901e" }]}
                ticks={chartSampled.map((d) => d.label)}
                showDots
              />

              <SectionHeader title="Derniers leads" subtitle="5 contacts les plus récents" action={
                <Link href="/messages" className="text-xs font-bold" style={{ color: "var(--bl-amber)" }}>Tout voir →</Link>
              } />
              {leadsLoading ? (
                <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "rgba(240,230,204,0.04)" }} />)}</div>
              ) : leads.length === 0 ? (
                <div className="text-center py-10 rounded-2xl" style={{ border: "2px dashed var(--bl-border-md)" }}>
                  <Phone className="w-7 h-7 mx-auto mb-2" style={{ color: "var(--bl-cream-faint)" }} />
                  <p className="text-sm" style={{ color: "var(--bl-cream-faint)" }}>Aucun lead pour l&apos;instant.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {leads.map((lead) => {
                    const name = lead.sender_name ?? "Inconnu";
                    const ini  = name.split(" ").map((w:string) => w[0]).join("").slice(0,2).toUpperCase();
                    const wa   = lead.sender_phone?.replace(/\D/g, "");
                    return (
                      <div key={lead.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "var(--bl-surface)", border: "1px solid var(--bl-border)" }}>
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: "rgba(200,144,30,0.20)", color: "var(--bl-amber-light)" }}>{ini}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: "var(--bl-cream)" }}>{name}</p>
                          <p className="text-xs truncate" style={{ color: "var(--bl-cream-faint)" }}>{lead.message}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <p className="text-[10px]" style={{ color: "var(--bl-cream-faint)" }}>{fmtTime(lead.created_at)}</p>
                          {wa && (
                            <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"
                              className="text-[11px] font-bold px-2 py-1 rounded-lg"
                              style={{ background: "rgba(37,211,102,0.12)", color: "#25D366", border: "1px solid rgba(37,211,102,0.20)" }}>
                              WA
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}
      {tab === "annonces" && <><SectionHeader title="Mes annonces" /><ListingsManager userId={user.id} /></>}
      {tab === "leads" && (
        <>
          <SectionHeader title="Leads" subtitle="Tous vos contacts reçus" />
          {leadsLoading ? (
            <div className="space-y-2">{[1,2,3,4,5].map((i) => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "rgba(240,230,204,0.04)" }} />)}</div>
          ) : leads.length === 0 ? (
            <div className="text-center py-14 rounded-2xl" style={{ border: "2px dashed var(--bl-border-md)" }}>
              <Phone className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--bl-cream-faint)" }} />
              <p className="font-bold mb-1" style={{ color: "var(--bl-cream)" }}>Historique des leads</p>
              <p className="text-sm" style={{ color: "var(--bl-cream-faint)" }}>Les contacts apparaîtront ici.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leads.map((lead) => {
                const name = lead.sender_name ?? "Inconnu";
                const ini  = name.split(" ").map((w:string) => w[0]).join("").slice(0,2).toUpperCase();
                const wa   = lead.sender_phone?.replace(/\D/g, "");
                return (
                  <div key={lead.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "var(--bl-surface)", border: "1px solid var(--bl-border)" }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: "rgba(200,144,30,0.20)", color: "var(--bl-amber-light)" }}>{ini}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--bl-cream)" }}>{name}</p>
                      <p className="text-xs truncate" style={{ color: "var(--bl-cream-faint)" }}>{lead.message}</p>
                    </div>
                    {wa && (
                      <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0"
                        style={{ background: "#25D366", color: "#fff" }}>
                        Contacter
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      {tab === "statistiques" && (
        <>
          <SectionHeader title="Statistiques" subtitle="30 derniers jours" />
          <DashboardChart
            type="line"
            title="Vues + Contacts WhatsApp"
            data={chartLine}
            height={200}
            series={[
              { dataKey: "views", name: "Vues", color: "#c8901e" },
              { dataKey: "whatsapp_clicks", name: "WhatsApp", color: "#25D366" },
            ]}
            ticks={chartSampled.map((d) => d.label)}
          />
        </>
      )}
      {tab === "profil" && (
        <>
          <SectionHeader title="Mon profil" />
          {profile?.is_verified_pro && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-xl" style={{ background: "rgba(200,144,30,0.10)", border: "1px solid rgba(200,144,30,0.25)" }}>
              <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "var(--bl-amber)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--bl-amber-light)" }}>Agent professionnel vérifié</p>
            </div>
          )}
          <Link href={`/agents/${user.id}`} className="flex items-center justify-between rounded-2xl px-4 py-3 mb-4" style={{ background: "rgba(200,144,30,0.07)", border: "1px solid rgba(200,144,30,0.20)" }}>
            <span className="text-sm font-semibold" style={{ color: "var(--bl-amber-light)" }}>Voir mon profil public</span>
            <ChevronRight className="w-4 h-4" style={{ color: "var(--bl-amber)" }} />
          </Link>
          <ProfileForm user={user} profile={profile} refreshProfile={refreshProfile} />
        </>
      )}
    </DashboardLayout>
  );
}

// ─── DASHBOARD AGENCE ─────────────────────────────────────────────────────────

function AgenceDashboard({ user, profile, signOut, refreshProfile }: {
  user: { id: string; email?: string };
  profile: ReturnType<typeof useAuth>["profile"];
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}) {
  const [tab, setTab]             = useState("dashboard");
  const [statsData, setStatsData] = useState<DayStat[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [totalViews, setTotalViews] = useState(0);
  const [totalWA, setTotalWA]     = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [msgCount, setMsgCount]   = useState(0);
  const [leads, setLeads]         = useState<Lead[]>([]);

  useEffect(() => {
    Promise.all([
      loadDayStats(user.id, 30),
      loadMessagesCount(user.id),
      loadRecentLeads(user.id),
    ]).then(([{ data, active, total, totalViews: tv, totalWA: tw }, mc, ls]) => {
      setStatsData(data); setActiveCount(active); setTotalCount(total);
      setTotalViews(tv); setTotalWA(tw); setMsgCount(mc); setLeads(ls); setStatsLoading(false);
    });
  }, [user.id]);

  const tabs: DashTab[] = [
    { key: "dashboard", label: "Dashboard",     icon: <BarChart2 className="w-4 h-4" /> },
    { key: "annonces",  label: "Annonces",      icon: <Home className="w-4 h-4" /> },
    { key: "equipe",    label: "Équipe",        icon: <Building2 className="w-4 h-4" /> },
    { key: "leads",     label: "Leads",         icon: <Phone className="w-4 h-4" /> },
    { key: "stats",     label: "Statistiques",  icon: <TrendingUp className="w-4 h-4" /> },
    { key: "profil",    label: "Profil agence", icon: <User className="w-4 h-4" /> },
  ];

  const agencyName = profile?.agency_name ?? profile?.full_name ?? "Agence";
  const initials = agencyName.slice(0,2).toUpperCase();
  const chartData = statsData.map((d) => ({ ...d, label: fmtDate(d.date) }));
  const chartSampled = chartData.filter((_, i) => i % 5 === 0);

  function exportCSV() {
    const rows = leads.map((l) => [
      l.sender_name ?? "Inconnu",
      l.sender_phone ?? "",
      l.message.replace(/,/g, " "),
      new Date(l.created_at).toLocaleDateString("fr-FR"),
    ]);
    const csv = ["Nom,Téléphone,Message,Date", ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "leads-bienloger.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <DashboardLayout tabs={tabs} active={tab} onChange={setTab} signOut={signOut}
      userName={agencyName} userInitials={initials}
      userBadge={profile?.is_verified_pro ? "Agence Premium" : undefined}>
      {tab === "dashboard" && (
        <>
          <div className="mb-6">
            <h1 style={{ fontFamily: "var(--font-playfair)", color: "var(--bl-amber-light)", fontSize: 26, fontWeight: 700 }}>
              Dashboard agence
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--bl-cream-dim)", fontWeight: 300 }}>Performance sur 30 jours</p>
          </div>

          {statsLoading ? (
            <div className="grid grid-cols-2 gap-3 mb-6">{[1,2,3,4,5,6].map((i) => <div key={i} className="h-24 animate-pulse" style={{ borderLeft: "3px solid rgba(200,144,30,0.20)", borderRadius: "0 12px 12px 0", background: "rgba(240,230,204,0.04)" }} />)}</div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                <StatCard label="Vues totales (30j)"   value={totalViews}  borderColor="#c8901e" />
                <StatCard label="Annonces actives"     value={activeCount} sub={`${totalCount} au total`} borderColor="#6ec97a" />
                <StatCard label="Contacts WhatsApp"    value={totalWA}     sub="30 derniers jours" borderColor="#6ec97a" />
                <StatCard label="Messages reçus"       value={msgCount}    sub="ce mois" borderColor="#daa84a" />
                <StatCard label="Leads"                value={leads.length} sub={<Link href="/messages" style={{ color: "var(--bl-amber)" }}>Voir messages →</Link>} borderColor="#c8901e" />
                <StatCard label="Statut"               value={profile?.is_verified_pro ? "Premium ✓" : "Agence"} sub="Plan actuel" borderColor="#daa84a" />
              </div>

              <DashboardChart
                type="bar"
                title="Performance 30 jours"
                data={chartData}
                height={160}
                series={[
                  { dataKey: "views", name: "Vues", color: "#c8901e" },
                  { dataKey: "whatsapp_clicks", name: "WhatsApp", color: "#25D366" },
                ]}
                ticks={chartSampled.map((d) => d.label)}
              />

              <div className="flex items-center justify-between mb-4">
                <h2 className="bl-section-title">Top annonces</h2>
                <button onClick={exportCSV} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                  style={{ background: "rgba(200,144,30,0.10)", color: "var(--bl-amber)", border: "1px solid rgba(200,144,30,0.25)" }}>
                  <Download className="w-3.5 h-3.5" /> Exporter CSV
                </button>
              </div>
              <ListingsManager userId={user.id} limit={3} />
            </>
          )}
        </>
      )}
      {tab === "annonces" && <><SectionHeader title="Toutes les annonces" /><ListingsManager userId={user.id} /></>}
      {tab === "equipe" && (
        <>
          <SectionHeader title="Performance équipe" subtitle="Bientôt disponible" />
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--bl-border)" }}>
            <div className="grid grid-cols-4 text-[11px] font-bold px-4 py-2.5" style={{ background: "var(--bl-surface-2)", color: "var(--bl-cream-faint)", letterSpacing: "1px", textTransform: "uppercase" }}>
              <span>Agent</span><span className="text-right">Annonces</span><span className="text-right">Vues</span><span className="text-right">Leads</span>
            </div>
            <div className="py-10 text-center" style={{ background: "var(--bl-surface)" }}>
              <Building2 className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--bl-cream-faint)" }} />
              <p className="text-sm" style={{ color: "var(--bl-cream-faint)" }}>Gestion multi-agents disponible prochainement.</p>
            </div>
          </div>
        </>
      )}
      {tab === "leads" && (
        <>
          <SectionHeader title="Leads de l'agence" subtitle="Contacts reçus récemment" action={
            leads.length > 0 ? (
              <button onClick={exportCSV} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(200,144,30,0.10)", color: "var(--bl-amber)", border: "1px solid rgba(200,144,30,0.25)" }}>
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
            ) : undefined
          } />
          {leads.length === 0 ? (
            <div className="text-center py-14 rounded-2xl" style={{ border: "2px dashed var(--bl-border-md)" }}>
              <Phone className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--bl-cream-faint)" }} />
              <p className="font-bold mb-1" style={{ color: "var(--bl-cream)" }}>Aucun lead</p>
              <p className="text-sm mb-4" style={{ color: "var(--bl-cream-faint)" }}>Tous vos contacts reçus apparaîtront ici.</p>
              <Link href="/messages" className="inline-flex items-center gap-2 font-bold px-5 py-2.5 rounded-xl text-sm" style={{ background: "rgba(200,144,30,0.15)", color: "var(--bl-amber)", border: "1px solid rgba(200,144,30,0.30)" }}>Voir les messages</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {leads.map((lead) => {
                const name = lead.sender_name ?? "Inconnu";
                const ini  = name.split(" ").map((w:string) => w[0]).join("").slice(0,2).toUpperCase();
                const wa   = lead.sender_phone?.replace(/\D/g, "");
                return (
                  <div key={lead.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "var(--bl-surface)", border: "1px solid var(--bl-border)" }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: "rgba(200,144,30,0.20)", color: "var(--bl-amber-light)" }}>{ini}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--bl-cream)" }}>{name}</p>
                      <p className="text-xs truncate" style={{ color: "var(--bl-cream-faint)" }}>{lead.message}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <p className="text-[10px]" style={{ color: "var(--bl-cream-faint)" }}>{fmtTime(lead.created_at)}</p>
                      {wa && (
                        <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"
                          className="text-xs font-bold px-2.5 py-1 rounded-lg"
                          style={{ background: "#25D366", color: "#fff" }}>
                          WA
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      {tab === "stats" && (
        <>
          <SectionHeader title="Statistiques agence" subtitle="30 derniers jours" />
          <DashboardChart
            type="bar"
            title="Vues + WhatsApp sur 30 jours"
            data={chartData}
            height={200}
            series={[
              { dataKey: "views", name: "Vues", color: "#c8901e" },
              { dataKey: "whatsapp_clicks", name: "WhatsApp", color: "#25D366" },
            ]}
            ticks={chartSampled.map((d) => d.label)}
          />
        </>
      )}
      {tab === "profil" && (
        <>
          <SectionHeader title="Profil de l'agence" />
          <Link href={`/agences/${user.id}`} className="flex items-center justify-between rounded-2xl px-4 py-3 mb-4" style={{ background: "rgba(200,144,30,0.07)", border: "1px solid rgba(200,144,30,0.20)" }}>
            <span className="text-sm font-semibold" style={{ color: "var(--bl-amber-light)" }}>Voir le profil public de l&apos;agence</span>
            <ChevronRight className="w-4 h-4" style={{ color: "var(--bl-amber)" }} />
          </Link>
          <ProfileForm user={user} profile={profile} refreshProfile={refreshProfile} />
        </>
      )}
    </DashboardLayout>
  );
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────────

export default function ComptePage() {
  const { user, profile, loading: authLoading, signOut, refreshProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.replace("/connexion");
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

  const dashProps = { user, profile, signOut, refreshProfile };

  return (
    <div className="max-w-3xl lg:max-w-5xl mx-auto lg:px-0">
      <div className="lg:rounded-2xl lg:overflow-hidden" style={{ border: "1px solid var(--bl-border)" }}>
        {accountType === "chercheur"    && <ChercheurDashboard    {...dashProps} />}
        {accountType === "proprietaire" && <ProprietaireDashboard {...dashProps} />}
        {accountType === "agent"        && <AgentDashboard        {...dashProps} />}
        {accountType === "agence"       && <AgenceDashboard       {...dashProps} />}
      </div>
    </div>
  );
}
