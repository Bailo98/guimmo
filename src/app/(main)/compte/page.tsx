"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Plus, Eye, MapPin, LogOut, Pencil, Trash2, User,
  CheckCircle, XCircle, RotateCcw, AlertTriangle, Search,
  Bell, BellOff, Heart, MessageCircle, BarChart2, Home,
  TrendingUp, Phone, ChevronRight, Calendar,
  Star, CreditCard, Award, Menu, X, Mail,
} from "lucide-react";
import dynamic from "next/dynamic";

const DashboardChart = dynamic(
  () => import("@/components/dashboard/DashboardChart"),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: 140, background: "var(--bl-surface)", borderRadius: "0 12px 12px 0", borderLeft: "3px solid rgba(212,175,55,0.20)", marginBottom: 24 }} />
    ),
  }
);
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import { cn, formatPrice } from "@/lib/utils";
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
interface VisitRequest {
  id: string; property_id: string; visitor_id: string;
  visitor_name: string; visitor_phone: string; visitor_email: string | null;
  scheduled_date: string; scheduled_time: string;
  visitor_message: string | null; owner_note: string | null;
  status: string; created_at: string;
  properties?: { title: string; neighborhood: string } | null;
}
interface FavoriteProperty {
  id: string; title: string; neighborhood: string;
  price: number; price_period: string | null; primary_image: string | null;
}
interface Review {
  id: string; reviewer_id: string; reviewed_id: string;
  rating: number; comment: string | null; created_at: string;
}
interface ReviewWithProfile {
  id: string; rating: number; comment: string | null;
  created_at: string; reviewer_name: string | null; reviewer_avatar: string | null;
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
      <div className="rounded-2xl p-6 max-w-sm w-full shadow-2xl" style={{ background: "var(--bl-surface)", border: "1px solid var(--bl-border-md)" }}>
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
      <div className="rounded-2xl p-6 max-w-sm w-full shadow-2xl" style={{ background: "var(--bl-surface)", border: "1px solid rgba(240,68,68,0.30)" }}>
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
          style={{ background: "var(--bl-surface-2)", border: "1px solid rgba(240,68,68,0.30)", borderRadius: 10, padding: "10px 14px", color: "var(--bl-cream)", fontSize: 14, width: "100%", outline: "none", marginBottom: 16 }}
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
    background: "var(--bl-surface-2)", border: "1px solid var(--bl-border-md)",
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
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
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
          <div className="flex items-center justify-between px-3.5 rounded-xl" style={{ height: 50, background: "var(--bl-surface)", border: "1px solid var(--bl-border)" }}>
            <span style={{ color: "var(--bl-cream-dim)", fontSize: 14 }} className="truncate">{user.email}</span>
            <span className="text-[11px] px-2.5 py-1 rounded-full ml-2 flex-shrink-0" style={{ background: "var(--border-subtle)", color: "var(--bl-cream-faint)" }}>Non modifiable</span>
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
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
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
        style={{ background: "var(--bl-amber)", color: "var(--bl-cream)" }}
      >
        {saving ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Sauvegarder le profil"}
      </button>

      {/* Mon plan */}
      <div className="rounded-r-2xl p-4 mb-6" style={{ background: "var(--bl-surface)", borderLeft: "3px solid var(--bl-amber-light)" }}>
        <p className="bl-section-label mb-2">Mon plan</p>
        <p className="font-bold" style={{ color: "var(--bl-cream)", fontFamily: "var(--font-display), sans-serif" }}>
          {profile?.is_verified_pro ? "Plan Pro" : "Plan Gratuit"}
        </p>
        <p className="text-xs mt-1 mb-3" style={{ color: "var(--bl-cream-faint)" }}>
          {profile?.is_verified_pro ? "Annonces illimitées · Badge vérifié · Priorité dans les résultats" : "Jusqu'à 5 annonces · Visibilité standard"}
        </p>
        <Link href="/tarifs" className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
          style={{ background: "rgba(212,175,55,0.12)", color: "var(--bl-amber)", border: "1px solid rgba(212,175,55,0.25)" }}>
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
      {[1,2].map((i) => <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: "var(--bl-surface-2)" }} />)}
    </div>
  );

  if (listings.length === 0) return (
    <div className="text-center py-14 rounded-2xl" style={{ border: "2px dashed var(--bl-border-md)" }}>
      <div className="text-4xl mb-3">🏠</div>
      <p className="font-bold mb-1" style={{ color: "var(--bl-cream)" }}>Aucune annonce</p>
      <p className="text-sm mb-4" style={{ color: "var(--bl-cream-faint)" }}>Publiez votre premier bien en quelques minutes.</p>
      <Link href="/publier" className="inline-flex items-center gap-2 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors" style={{ background: "var(--bl-amber)", color: "var(--bl-cream)" }}>
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
                <Link href={`/annonces/${listing.id}`} className="relative w-24 h-20 flex-shrink-0 rounded-xl overflow-hidden" style={{ background: "var(--bl-surface-2)" }}>
                  {listing.primary_image
                    ? <Image src={listing.primary_image} alt={listing.title} fill className="object-cover" sizes="96px" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl">🏠</div>}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/annonces/${listing.id}`}><p className="font-bold text-sm leading-snug line-clamp-2" style={{ color: "var(--bl-cream)" }}>{listing.title}</p></Link>
                  <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: "var(--bl-cream-faint)" }}>
                    <MapPin className="w-3 h-3 flex-shrink-0" />{NL[listing.neighborhood] ?? listing.neighborhood}
                  </div>
                  <p className="font-bold text-sm mt-1" style={{ color: "var(--bl-amber-light)" }}>{formatPrice(listing.price, "GNF", listing.price_period)}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {listing.status === "pending" ? (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: "rgba(212,175,55,0.15)", color: "#D4AF37" }}>
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
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-[#D4AF37] transition-colors hover:bg-amber-900/10"
                      style={{ border: "1px solid rgba(212,175,55,0.30)" }}
                    >
                      {isRenewBusy ? <div className="w-3.5 h-3.5 border border-[#D4AF37] border-t-transparent rounded-full animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                      Renouveler
                    </button>
                  );
                })()}
                <button onClick={() => toggleAvailability(listing)} disabled={busy}
                  className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-colors",
                    listing.available_now ? "text-red-400 hover:bg-red-900/20" : "text-[#D4AF37] hover:bg-green-900/20")}
                  style={{ border: listing.available_now ? "1px solid rgba(240,68,68,0.25)" : "1px solid rgba(212,175,55,0.25)" }}>
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
          <Link href="/publier" className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-colors" style={{ border: "1px dashed rgba(212,175,55,0.40)", color: "var(--bl-amber)" }}>
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

async function loadAnnonceurStats(userId: string): Promise<{
  listings: number; views: number; demands: number; visits: number; avgRating: number; reviewCount: number;
}> {
  if (!supabase) return { listings: 0, views: 0, demands: 0, visits: 0, avgRating: 0, reviewCount: 0 };
  try {
    const [propsRes, visitsRes, demandsRes, reviewsRes] = await Promise.all([
      supabase.from("properties").select("id, views").eq("owner_id", userId),
      supabase.from("visits").select("id", { count: "exact", head: true }).eq("owner_id", userId),
      supabase.from("messages").select("id", { count: "exact", head: true }).eq("receiver_id", userId),
      supabase.from("reviews").select("rating").eq("reviewed_id", userId),
    ]);
    const listings = (propsRes.data ?? []).length;
    const views = (propsRes.data ?? []).reduce((a: number, p: { views: number | null }) => a + (p.views ?? 0), 0);
    const demands = demandsRes.count ?? 0;
    const visits = visitsRes.count ?? 0;
    const ratings = reviewsRes.error ? [] : (reviewsRes.data ?? []).map((r: { rating: number }) => r.rating);
    const avgRating = ratings.length > 0 ? ratings.reduce((a: number, r: number) => a + r, 0) / ratings.length : 0;
    return { listings, views, demands, visits, avgRating, reviewCount: ratings.length };
  } catch { return { listings: 0, views: 0, demands: 0, visits: 0, avgRating: 0, reviewCount: 0 }; }
}

async function loadRecentReviewsWithProfiles(userId: string): Promise<ReviewWithProfile[]> {
  if (!supabase) return [];
  try {
    const { data: reviews, error } = await supabase
      .from("reviews")
      .select("id, rating, comment, created_at, reviewer_id")
      .eq("reviewed_id", userId)
      .order("created_at", { ascending: false })
      .limit(3);
    if (error || !reviews) return [];
    const reviewerIds = reviews.map((r: { reviewer_id: string }) => r.reviewer_id);
    const { data: profiles } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", reviewerIds);
    const pMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
    for (const p of profiles ?? []) pMap[p.id] = p;
    return reviews.map((r: { id: string; rating: number; comment: string | null; created_at: string; reviewer_id: string }) => ({
      id: r.id, rating: r.rating, comment: r.comment, created_at: r.created_at,
      reviewer_name: pMap[r.reviewer_id]?.full_name ?? null,
      reviewer_avatar: pMap[r.reviewer_id]?.avatar_url ?? null,
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
        <div className="h-20 rounded-2xl animate-pulse" style={{ background: "var(--bl-surface-2)" }} />
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

// ─── VISIT REQUESTS MANAGER ───────────────────────────────────────────────────

const TIME_LABEL: Record<string, string> = {
  morning: "Matin (8h–12h)",
  afternoon: "Après-midi (12h–17h)",
  evening: "Soir (17h–20h)",
};

function VisitRequestsManager({ userId, onPendingCount }: {
  userId: string;
  onPendingCount?: (n: number) => void;
}) {
  const [visits, setVisits]     = useState<VisitRequest[]>([]);
  const [loading, setLoading]   = useState(true);
  const [noteId, setNoteId]     = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const channelRef = useRef<ReturnType<NonNullable<typeof supabase>["channel"]> | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase
      .from("visits")
      .select("*, properties(title, neighborhood)")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });
    const rows = (data ?? []) as VisitRequest[];
    setVisits(rows);
    onPendingCount?.(rows.filter((v) => v.status === "pending").length);
    setLoading(false);
  }, [userId, onPendingCount]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!supabase) return;
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    channelRef.current = supabase
      .channel(`visits_owner_${userId}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "visits",
        filter: `owner_id=eq.${userId}`,
      }, () => load())
      .subscribe();
    return () => {
      if (channelRef.current && supabase) supabase.removeChannel(channelRef.current);
    };
  }, [userId, load]);

  async function updateStatus(id: string, status: "confirmed" | "cancelled" | "completed") {
    if (!supabase) return;
    await supabase.from("visits").update({ status }).eq("id", id);
    setVisits((prev) => {
      const next = prev.map((v) => v.id === id ? { ...v, status } : v);
      onPendingCount?.(next.filter((v) => v.status === "pending").length);
      return next;
    });
    const msgs = { confirmed: "✅ Visite confirmée", cancelled: "Demande annulée", completed: "✅ Visite marquée terminée" };
    const types = { confirmed: "success" as const, cancelled: "error" as const, completed: "success" as const };
    toast(msgs[status], types[status]);
  }

  async function saveNote(id: string) {
    if (!supabase) return;
    await supabase.from("visits").update({ owner_note: noteText.trim() || null }).eq("id", id);
    setVisits((prev) => prev.map((v) => v.id === id ? { ...v, owner_note: noteText.trim() || null } : v));
    setNoteId(null);
    toast("✅ Note sauvegardée", "success");
  }

  const statusBadge = (s: string) => {
    if (s === "confirmed") return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>✅ Confirmée</span>;
    if (s === "cancelled") return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>❌ Annulée</span>;
    if (s === "completed") return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(160,160,160,0.15)", color: "#aaa" }}>✓ Terminée</span>;
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(212,175,55,0.15)", color: "#D4AF37" }}>⏳ En attente</span>;
  };

  if (loading) return <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: "var(--bl-surface-2)" }} />)}</div>;

  if (visits.length === 0) return (
    <div className="text-center py-14 rounded-2xl" style={{ border: "2px dashed var(--bl-border-md)" }}>
      <Calendar className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--bl-cream-faint)" }} />
      <p className="font-bold mb-1" style={{ color: "var(--bl-cream)" }}>Aucune demande de visite</p>
      <p className="text-sm" style={{ color: "var(--bl-cream-faint)" }}>Les demandes apparaîtront ici en temps réel.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {visits.map((v) => {
        const ini = v.visitor_name.split(" ").map((w:string) => w[0]).join("").slice(0,2).toUpperCase();
        const wa  = v.visitor_phone.replace(/\D/g, "");
        const dateLabel = new Date(v.scheduled_date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
        return (
          <div key={v.id} className="rounded-2xl p-4 space-y-3" style={{ background: "var(--bl-surface)", border: "1px solid var(--bl-border)" }}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: "rgba(212,175,55,0.15)", color: "#D4AF37" }}>{ini}</div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--bl-cream)" }}>{v.visitor_name}</p>
                  <p className="text-xs" style={{ color: "var(--bl-cream-faint)" }}>{v.properties?.title ?? v.property_id}</p>
                </div>
              </div>
              {statusBadge(v.status)}
            </div>
            <div className="flex items-center gap-4 text-xs" style={{ color: "var(--bl-cream-dim)" }}>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{dateLabel} · {TIME_LABEL[v.scheduled_time] ?? v.scheduled_time}</span>
            </div>
            {v.visitor_message && <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "var(--border-subtle)", color: "var(--bl-cream-dim)" }}>{v.visitor_message}</p>}
            {v.owner_note && noteId !== v.id && (
              <p className="text-xs px-3 py-2 rounded-lg flex items-start gap-1.5"
                style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)", color: "var(--bl-cream-dim)" }}>
                <Pencil className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: "var(--bl-amber)" }} />
                {v.owner_note}
              </p>
            )}
            {noteId === v.id && (
              <div className="flex gap-2">
                <input
                  type="text" value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Note privée…"
                  style={{ background: "var(--border-subtle)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "6px 10px", color: "var(--bl-cream)", fontSize: 13, flex: 1, outline: "none" }}
                />
                <button onClick={() => saveNote(v.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: "var(--bl-amber)", color: "var(--bg-primary)" }}>OK</button>
                <button onClick={() => setNoteId(null)} className="px-3 py-1.5 rounded-lg text-xs" style={{ background: "var(--border-subtle)", color: "var(--bl-cream-faint)" }}>✕</button>
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <a href={`tel:${v.visitor_phone}`}
                className="flex items-center justify-center gap-1.5 text-xs font-bold py-2 px-3 rounded-lg"
                style={{ background: "var(--border-subtle)", border: "1px solid var(--bl-border-md)", color: "var(--bl-cream-dim)" }}>
                <Phone className="w-3.5 h-3.5" /> {v.visitor_phone}
              </a>
              <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center px-3 py-2 rounded-lg text-xs font-bold"
                style={{ background: "#25D366", color: "var(--bl-cream)" }}>WA</a>
              {noteId !== v.id && (
                <button onClick={() => { setNoteId(v.id); setNoteText(v.owner_note ?? ""); }}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold"
                  style={{ background: "var(--border-subtle)", border: "1px solid var(--bl-border-md)", color: "var(--bl-cream-faint)" }}>
                  <Pencil className="w-3 h-3" /> Note
                </button>
              )}
              {v.status === "pending" && (
                <>
                  <button onClick={() => updateStatus(v.id, "confirmed")}
                    className="flex items-center justify-center px-3 py-2 rounded-lg text-xs font-bold"
                    style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.30)" }}>
                    <CheckCircle className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => updateStatus(v.id, "cancelled")}
                    className="flex items-center justify-center px-3 py-2 rounded-lg text-xs font-bold"
                    style={{ background: "rgba(239,68,68,0.10)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}>
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              {v.status === "confirmed" && (
                <button onClick={() => updateStatus(v.id, "completed")}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold"
                  style={{ background: "rgba(160,160,160,0.10)", color: "#aaa", border: "1px solid rgba(160,160,160,0.20)" }}>
                  ✓ Terminé
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── VISITOR VISITS (for ChercheurDashboard) ─────────────────────────────────

function VisitorVisitsSection({ userId }: { userId: string }) {
  const [visits, setVisits]   = useState<VisitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<NonNullable<typeof supabase>["channel"]> | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase
      .from("visits")
      .select("*, properties(title, neighborhood)")
      .eq("visitor_id", userId)
      .order("created_at", { ascending: false });
    setVisits((data ?? []) as VisitRequest[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!supabase) return;
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    channelRef.current = supabase
      .channel(`visits_visitor_${userId}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "visits",
        filter: `visitor_id=eq.${userId}`,
      }, () => load())
      .subscribe();
    return () => {
      if (channelRef.current && supabase) supabase.removeChannel(channelRef.current);
    };
  }, [userId, load]);

  const statusBadge = (s: string) => {
    if (s === "confirmed") return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>✅ Confirmée</span>;
    if (s === "cancelled") return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>❌ Annulée</span>;
    if (s === "completed") return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(160,160,160,0.15)", color: "#aaa" }}>✓ Terminée</span>;
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(212,175,55,0.15)", color: "#D4AF37" }}>⏳ En attente</span>;
  };

  if (loading) return <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "var(--bl-surface-2)" }} />)}</div>;

  if (visits.length === 0) return (
    <div className="text-center py-14 rounded-2xl" style={{ border: "2px dashed var(--bl-border-md)" }}>
      <Calendar className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--bl-cream-faint)" }} />
      <p className="font-bold mb-1" style={{ color: "var(--bl-cream)" }}>Aucune visite planifiée</p>
      <p className="text-sm mb-4" style={{ color: "var(--bl-cream-faint)" }}>Vos demandes de visite apparaîtront ici.</p>
      <Link href="/annonces" className="inline-flex items-center gap-2 font-bold px-5 py-2.5 rounded-xl text-sm"
        style={{ background: "rgba(212,175,55,0.15)", color: "var(--bl-amber)", border: "1px solid rgba(212,175,55,0.30)" }}>
        Explorer les annonces
      </Link>
    </div>
  );

  return (
    <div className="space-y-3">
      {visits.map((v) => {
        const dateLabel = new Date(v.scheduled_date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" });
        return (
          <div key={v.id} className="rounded-2xl p-4 space-y-2" style={{ background: "var(--bl-surface)", border: "1px solid var(--bl-border)" }}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--bl-cream)" }}>{v.properties?.title ?? "Annonce"}</p>
                {v.properties?.neighborhood && (
                  <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--bl-cream-faint)" }}>
                    <MapPin className="w-3 h-3" />{v.properties.neighborhood}
                  </p>
                )}
              </div>
              {statusBadge(v.status)}
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--bl-cream-dim)" }}>
              <Calendar className="w-3 h-3" />
              <span>{dateLabel} · {TIME_LABEL[v.scheduled_time] ?? v.scheduled_time}</span>
            </div>
            {v.owner_note && (
              <p className="text-xs px-3 py-2 rounded-lg flex items-start gap-1.5"
                style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)", color: "var(--bl-cream-dim)" }}>
                <Pencil className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: "var(--bl-amber)" }} />
                {v.owner_note}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── BUYER PROFILE ────────────────────────────────────────────────────────────

function BuyerProfile({ user, profile, refreshProfile }: {
  user: { id: string; email?: string };
  profile: ReturnType<typeof useAuth>["profile"];
  refreshProfile: () => Promise<void>;
}) {
  const [editing, setEditing]       = useState(false);
  const [favorites, setFavorites]   = useState<FavoriteProperty[]>([]);
  const [searches, setSearches]     = useState<SavedSearch[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [becomingPro, setBecomingPro] = useState(false);

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoadingData(false); return; }
      const [favRes, searchRes] = await Promise.all([
        supabase
          .from("favorites")
          .select("property_id, properties(id, title, neighborhood, price, price_period, property_images(url, is_primary, sort_order))")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("saved_searches")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const favs: FavoriteProperty[] = [];
      for (const f of favRes.data ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prop = (f as any).properties;
        if (!prop) continue;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const imgs: any[] = prop.property_images ?? [];
        const primary = imgs.find((i: { is_primary: boolean }) => i.is_primary)
          ?? imgs.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)[0];
        favs.push({
          id: prop.id, title: prop.title, neighborhood: prop.neighborhood,
          price: prop.price, price_period: prop.price_period ?? null,
          primary_image: primary?.url ?? null,
        });
      }
      setFavorites(favs);
      setSearches((searchRes.data ?? []) as SavedSearch[]);
      setLoadingData(false);
    }
    load();
  }, [user.id]);

  async function becomePro() {
    if (!supabase) return;
    setBecomingPro(true);
    const { error } = await supabase
      .from("profiles")
      .update({ role: "proprietaire", account_type: "proprietaire" })
      .eq("id", user.id);
    if (error) { toast("Erreur lors de la mise à jour", "error"); setBecomingPro(false); return; }
    toast("✅ Compte annonceur activé !", "success");
    window.location.reload();
  }

  const displayName = profile?.full_name ?? user.email?.split("@")[0] ?? "Utilisateur";

  return (
    <div>
      {/* Header profil */}
      <div className="px-4 pt-8 pb-6 text-center border-b" style={{ background: "var(--bg-secondary)", borderColor: "var(--bl-border)" }}>
        <AvatarUpload
          userId={user.id}
          currentUrl={profile?.avatar_url}
          name={profile?.full_name}
          onSuccess={() => { void refreshProfile(); }}
        />
        <h1 className="mt-3 font-bold text-xl" style={{ color: "var(--bl-cream)", fontFamily: "var(--font-display), sans-serif" }}>
          {displayName}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--bl-cream-dim)" }}>{user.email}</p>
        {profile?.phone && (
          <p className="text-sm mt-0.5" style={{ color: "var(--bl-cream-faint)" }}>{profile.phone}</p>
        )}
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setEditing((v) => !v)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "var(--bl-surface)", border: "1px solid var(--bl-border-md)", color: "var(--bl-cream-dim)" }}
          >
            <Pencil className="w-3.5 h-3.5" />
            {editing ? "Annuler" : "Modifier le profil"}
          </button>
          <button
            onClick={async () => { if (supabase) await supabase.auth.signOut(); window.location.href = "/"; }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ border: "1px solid rgba(240,68,68,0.30)", color: "#ef4444" }}
            title="Se déconnecter"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Formulaire d'édition */}
      {editing && (
        <div className="px-4 py-6 border-b" style={{ borderColor: "var(--bl-border)" }}>
          <ProfileForm
            user={user}
            profile={profile}
            refreshProfile={async () => { await refreshProfile(); setEditing(false); }}
          />
        </div>
      )}

      {/* CTA Devenir annonceur */}
      <div className="mx-4 mt-6 p-5 rounded-2xl" style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.25)" }}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(212,175,55,0.15)" }}>
            <Award className="w-5 h-5" style={{ color: "var(--bl-amber)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm" style={{ color: "var(--bl-cream)" }}>Vous avez un bien à louer ou vendre ?</p>
            <p className="text-xs mt-1 mb-3" style={{ color: "var(--bl-cream-faint)" }}>
              Publiez vos annonces gratuitement et touchez des milliers d&apos;acheteurs à Conakry.
            </p>
            <button
              onClick={becomePro}
              disabled={becomingPro}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
              style={{ background: "var(--bl-amber)", color: "#0B0F19" }}
            >
              {becomingPro
                ? <span className="w-4 h-4 border-2 border-[#0B0F19] border-t-transparent rounded-full animate-spin inline-block" />
                : <Plus className="w-4 h-4" />}
              Devenir annonceur
            </button>
          </div>
        </div>
      </div>

      {/* Favoris */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-base" style={{ color: "var(--bl-cream)" }}>Mes favoris</h2>
          <Link href="/favoris" className="text-xs font-bold" style={{ color: "var(--bl-amber)" }}>Voir tout →</Link>
        </div>
        {loadingData ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2].map((i) => <div key={i} className="h-36 rounded-2xl animate-pulse" style={{ background: "var(--bl-surface-2)" }} />)}
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-10 rounded-2xl" style={{ border: "2px dashed var(--bl-border-md)" }}>
            <Heart className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--bl-cream-faint)" }} />
            <p className="text-sm font-bold mb-1" style={{ color: "var(--bl-cream)" }}>Aucun favori</p>
            <p className="text-xs mb-4" style={{ color: "var(--bl-cream-faint)" }}>Sauvegardez des annonces pour les retrouver ici.</p>
            <Link href="/annonces" className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl"
              style={{ background: "rgba(212,175,55,0.12)", color: "var(--bl-amber)", border: "1px solid rgba(212,175,55,0.25)" }}>
              Explorer les annonces
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {favorites.map((fav) => (
              <Link key={fav.id} href={`/annonces/${fav.id}`}
                className="rounded-2xl overflow-hidden block"
                style={{ background: "var(--bl-surface)", border: "1px solid var(--bl-border)" }}>
                <div className="relative h-28" style={{ background: "var(--bl-surface-2)" }}>
                  {fav.primary_image
                    ? <Image src={fav.primary_image} alt={fav.title} fill className="object-cover" sizes="50vw" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl">🏠</div>}
                </div>
                <div className="p-2.5">
                  <p className="font-bold text-xs line-clamp-1" style={{ color: "var(--bl-cream)" }}>{fav.title}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--bl-cream-faint)" }}>{NL[fav.neighborhood] ?? fav.neighborhood}</p>
                  <p className="font-bold text-xs mt-1" style={{ color: "var(--bl-amber-light)" }}>
                    {formatPrice(fav.price, "GNF", fav.price_period)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recherches récentes */}
      {!loadingData && searches.length > 0 && (
        <div className="px-4 mt-6">
          <h2 className="font-bold text-base mb-3" style={{ color: "var(--bl-cream)" }}>Recherches récentes</h2>
          <div className="space-y-2">
            {searches.map((s) => {
              const parts = [
                s.neighborhood ? (NL[s.neighborhood] ?? s.neighborhood) : null,
                s.type ? (TL[s.type] ?? s.type) : null,
                s.transaction_type ? (s.transaction_type === "rent" ? "Location" : "Vente") : null,
              ].filter(Boolean);
              const params = new URLSearchParams();
              if (s.neighborhood) params.set("neighborhood", s.neighborhood);
              if (s.type) params.set("type", s.type);
              if (s.transaction_type) params.set("transaction_type", s.transaction_type);
              return (
                <Link key={s.id} href={`/annonces?${params.toString()}`}
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ background: "var(--bl-surface)", border: "1px solid var(--bl-border)" }}>
                  <Search className="w-4 h-4 flex-shrink-0" style={{ color: "var(--bl-cream-faint)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--bl-cream)" }}>{s.label}</p>
                    {parts.length > 0 && (
                      <p className="text-xs truncate" style={{ color: "var(--bl-cream-faint)" }}>{parts.join(" · ")}</p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--bl-cream-faint)" }} />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="h-24" />
    </div>
  );
}

// ─── REVIEWS SECTION ──────────────────────────────────────────────────────────

function ReviewsSection({ userId }: { userId: string }) {
  const [reviews, setReviews]     = useState<Review[]>([]);
  const [loading, setLoading]     = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase
      .from("reviews")
      .select("*")
      .eq("reviewed_id", userId)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (error) setUnavailable(true);
        else setReviews((data ?? []) as Review[]);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return (
    <div className="space-y-2">
      {[1,2,3].map((i) => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: "var(--bl-surface-2)" }} />)}
    </div>
  );

  if (unavailable || reviews.length === 0) return (
    <div className="text-center py-14 rounded-2xl" style={{ border: "2px dashed var(--bl-border-md)" }}>
      <Star className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--bl-cream-faint)" }} />
      <p className="font-bold mb-1" style={{ color: "var(--bl-cream)" }}>
        {unavailable ? "Avis & évaluations" : "Aucun avis pour le moment"}
      </p>
      <p className="text-sm" style={{ color: "var(--bl-cream-faint)" }}>
        {unavailable
          ? "Fonctionnalité bientôt disponible."
          : "Les évaluations de vos clients apparaîtront ici."}
      </p>
    </div>
  );

  const avg = reviews.reduce((a, r) => a + r.rating, 0) / reviews.length;

  return (
    <div>
      {/* Résumé */}
      <div className="flex items-center gap-4 p-4 rounded-2xl mb-4" style={{ background: "var(--bl-surface)", border: "1px solid var(--bl-border)" }}>
        <div className="text-center">
          <p className="text-3xl font-bold" style={{ color: "var(--bl-amber-light)", fontFamily: "var(--font-display), sans-serif" }}>
            {avg.toFixed(1)}
          </p>
          <div className="flex items-center gap-0.5 mt-1 justify-center">
            {[1,2,3,4,5].map((s) => (
              <Star key={s} className="w-3.5 h-3.5"
                fill={s <= Math.round(avg) ? "#D4AF37" : "none"}
                style={{ color: "#D4AF37" }} />
            ))}
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--bl-cream-faint)" }}>{reviews.length} avis</p>
        </div>
      </div>
      {/* Avis individuels */}
      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-2xl p-4" style={{ background: "var(--bl-surface)", border: "1px solid var(--bl-border)" }}>
            <div className="flex items-center gap-1 mb-2">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} className="w-3.5 h-3.5"
                  fill={s <= r.rating ? "#D4AF37" : "none"}
                  style={{ color: "#D4AF37" }} />
              ))}
              <span className="text-xs ml-2" style={{ color: "var(--bl-cream-faint)" }}>
                {new Date(r.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
              </span>
            </div>
            {r.comment && <p className="text-sm" style={{ color: "var(--bl-cream-dim)" }}>{r.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ABONNEMENT SECTION ───────────────────────────────────────────────────────

function AbonnementSection({ profile }: { profile: ReturnType<typeof useAuth>["profile"] }) {
  const isPro = profile?.is_verified_pro;
  const features = isPro ? [
    "Annonces illimitées",
    "Badge annonceur vérifié ✓",
    "Priorité dans les résultats de recherche",
    "Statistiques détaillées",
    "Rapports mensuels par WhatsApp",
  ] : [
    "Jusqu'à 5 annonces",
    "Visibilité standard",
    "Statistiques de base",
  ];

  return (
    <div>
      <div className="rounded-2xl p-5 mb-4" style={{ background: "var(--bl-surface)", border: isPro ? "1px solid rgba(212,175,55,0.30)" : "1px solid var(--bl-border)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: isPro ? "rgba(212,175,55,0.15)" : "var(--bl-surface-2)" }}>
            <CreditCard className="w-5 h-5" style={{ color: isPro ? "var(--bl-amber)" : "var(--bl-cream-faint)" }} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-base" style={{ color: "var(--bl-cream)" }}>{isPro ? "Plan Pro" : "Plan Gratuit"}</p>
            <p className="text-xs" style={{ color: "var(--bl-cream-faint)" }}>Plan actuel</p>
          </div>
          {isPro && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(212,175,55,0.15)", color: "#D4AF37" }}>
              Actif
            </span>
          )}
        </div>
        <ul className="space-y-2 mb-5">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "var(--bl-cream-dim)" }}>
              <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: isPro ? "var(--bl-amber)" : "var(--bl-cream-faint)" }} />
              {f}
            </li>
          ))}
        </ul>
        <Link href="/tarifs"
          className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all"
          style={isPro
            ? { background: "var(--bl-surface-2)", border: "1px solid var(--bl-border-md)", color: "var(--bl-cream-dim)" }
            : { background: "var(--bl-amber)", color: "#0B0F19" }
          }>
          {isPro ? "Gérer l'abonnement" : "Passer au Plan Pro →"}
        </Link>
      </div>

      {!isPro && (
        <div className="rounded-2xl p-4" style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.20)" }}>
          <p className="font-bold text-sm mb-1" style={{ color: "var(--bl-amber-light)" }}>Pourquoi passer Pro ?</p>
          <p className="text-xs" style={{ color: "var(--bl-cream-faint)" }}>
            Les annonceurs Pro obtiennent en moyenne 3x plus de contacts et bénéficient d&apos;une visibilité prioritaire dans les résultats.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── DASHBOARD LISTING CARD ───────────────────────────────────────────────────

function DashboardListingCard({ listing }: { listing: Listing }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const statusInfo = listing.status === "pending"
    ? { label: "En attente", bg: "rgba(234,179,8,0.90)", color: "#fff" }
    : !listing.available_now
    ? { label: "Inactif", bg: "rgba(239,68,68,0.90)", color: "#fff" }
    : { label: "Publié", bg: "rgba(34,197,94,0.90)", color: "#fff" };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bl-surface)", border: "1px solid var(--bl-border)" }}>
      <div className="relative" style={{ aspectRatio: "16/10" }}>
        {listing.primary_image
          ? <Image src={listing.primary_image} alt={listing.title} fill className="object-cover" sizes="(max-width:768px) 50vw,25vw" />
          : <div className="w-full h-full flex items-center justify-center text-3xl" style={{ background: "var(--bl-surface-2)" }}>🏠</div>}
        <span className="absolute top-2 left-2 text-[11px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: statusInfo.bg, color: statusInfo.color }}>{statusInfo.label}</span>
        <div ref={menuRef} className="absolute top-2 right-2">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
            className="w-7 h-7 rounded-full flex items-center justify-center font-bold"
            style={{ background: "rgba(0,0,0,0.55)", color: "#fff", backdropFilter: "blur(4px)", fontSize: 15, lineHeight: 1 }}>
            ···
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-9 rounded-xl overflow-hidden shadow-xl z-20 w-40"
              style={{ background: "var(--nav-dropdown-bg)", border: "1px solid var(--bl-border-md)", backdropFilter: "blur(12px)" }}>
              <Link href={`/annonces/${listing.id}`}
                className="flex items-center gap-2 px-3 py-2.5 text-xs font-medium hover:bg-white/5"
                style={{ color: "var(--bl-cream-dim)" }}>
                <Eye className="w-3.5 h-3.5" /> Voir l&apos;annonce
              </Link>
              <Link href={`/publier?edit=${listing.id}`}
                className="flex items-center gap-2 px-3 py-2.5 text-xs font-medium hover:bg-white/5"
                style={{ color: "var(--bl-cream-dim)" }}>
                <Pencil className="w-3.5 h-3.5" /> Modifier
              </Link>
            </div>
          )}
        </div>
      </div>
      <div className="p-3">
        <p className="font-bold text-xs line-clamp-2 leading-snug mb-1" style={{ color: "var(--bl-cream)" }}>{listing.title}</p>
        <p className="font-bold text-sm mb-1.5" style={{ color: "var(--bl-amber)" }}>{formatPrice(listing.price, "GNF", listing.price_period)}</p>
        <div className="flex items-center gap-1 text-[11px] mb-1.5" style={{ color: "var(--bl-cream-faint)" }}>
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{NL[listing.neighborhood] ?? listing.neighborhood}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px]" style={{ color: "var(--bl-cream-faint)" }}>
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {listing.views} vues</span>
          <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {listing.whatsapp_clicks} contacts</span>
        </div>
      </div>
    </div>
  );
}

// ─── ANNONCEUR SIDEBAR ────────────────────────────────────────────────────────

function AnnonceurSidebarContent({
  tabs, activeTab, onTabChange, profile, displayName, initials, accountTypeLabel, onSignOut, onClose,
}: {
  tabs: DashTab[]; activeTab: string; onTabChange: (t: string) => void;
  profile: ReturnType<typeof useAuth>["profile"];
  displayName: string; initials: string; accountTypeLabel: string;
  onSignOut: () => Promise<void>;
  onClose?: () => void;
}) {
  return (
    <div className="flex flex-col h-full" style={{ background: "#0F1923" }}>
      {onClose && (
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <span className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.30)", letterSpacing: "0.15em", textTransform: "uppercase" }}>Menu</span>
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.50)" }}><X className="w-5 h-5" /></button>
        </div>
      )}
      {/* Profile */}
      <div className="px-4 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center font-bold text-sm flex-shrink-0"
            style={{ background: "rgba(212,175,55,0.20)", color: "#D4AF37" }}>
            {profile?.avatar_url
              ? <Image src={profile.avatar_url} alt={displayName} width={40} height={40} className="w-10 h-10 object-cover rounded-full" />
              : initials}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate" style={{ color: "#fff" }}>{displayName}</p>
            <p className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.40)" }}>{accountTypeLabel}</p>
          </div>
        </div>
      </div>
      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {tabs.map((t) => {
          const isActive = activeTab === t.key;
          return (
            <button key={t.key}
              onClick={() => { onTabChange(t.key); onClose?.(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
              style={{
                background: isActive ? "rgba(212,175,55,0.12)" : "transparent",
                color: isActive ? "#D4AF37" : "rgba(255,255,255,0.50)",
                borderLeft: isActive ? "3px solid #D4AF37" : "3px solid transparent",
              }}>
              {t.icon}
              <span className="truncate flex-1">{t.label}</span>
              {(t.badge ?? 0) > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: "#D4AF37", color: "#0B0F19" }}>{t.badge}</span>
              )}
            </button>
          );
        })}
      </nav>
      {/* Sign out */}
      <div className="px-2 pb-4 pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <button onClick={onSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
          style={{ color: "rgba(240,68,68,0.70)" }}>
          <LogOut className="w-4 h-4" /> Se déconnecter
        </button>
      </div>
    </div>
  );
}

// ─── DASHBOARD ANNONCEUR (unified) ────────────────────────────────────────────

function AnnonceurDashboard({ user, profile, signOut, refreshProfile }: {
  user: { id: string; email?: string };
  profile: ReturnType<typeof useAuth>["profile"];
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}) {
  const [tab, setTab]                     = useState("dashboard");
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [statsData, setStatsData]         = useState<DayStat[]>([]);
  const [statsLoading, setStatsLoading]   = useState(true);
  const [totalViews, setTotalViews]       = useState(0);
  const [totalWA, setTotalWA]             = useState(0);
  const [activeCount, setActiveCount]     = useState(0);
  const [msgCount, setMsgCount]           = useState(0);
  const [pendingVisits, setPendingVisits] = useState(0);
  const [annStats, setAnnStats]           = useState<{
    listings: number; views: number; demands: number; visits: number; avgRating: number; reviewCount: number;
  } | null>(null);
  const [recentReviews, setRecentReviews] = useState<ReviewWithProfile[]>([]);
  const [dashListings, setDashListings]   = useState<Listing[]>([]);
  const [dashListingsLoading, setDashListingsLoading] = useState(true);

  const role          = profile?.role ?? "proprietaire";
  const isAgent       = role === "agent";
  const isAgence      = ["agence", "agency"].includes(role) || profile?.account_type === "agence";
  const accountTypeLabel = isAgence ? "Agence immobilière" : isAgent ? "Agent immobilier" : "Propriétaire";
  const displayName   = (isAgence ? profile?.agency_name : null) ?? profile?.full_name ?? "Annonceur";
  const initials      = displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memberSince   = (profile as any)?.created_at
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? new Date((profile as any).created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    : null;
  const wa            = profile?.phone?.replace(/\D/g, "") ?? "";

  useEffect(() => {
    Promise.all([
      loadDayStats(user.id, 30),
      loadMessagesCount(user.id),
      loadAnnonceurStats(user.id),
      loadRecentReviewsWithProfiles(user.id),
    ]).then(([{ data, active, totalViews: tv, totalWA: tw }, mc, ann, revs]) => {
      setStatsData(data); setActiveCount(active); setTotalViews(tv); setTotalWA(tw);
      setMsgCount(mc); setStatsLoading(false);
      setAnnStats(ann); setRecentReviews(revs);
    });
  }, [user.id]);

  useEffect(() => {
    async function loadDashListings() {
      if (!supabase) { setDashListingsLoading(false); return; }
      const { data } = await supabase.from("properties")
        .select("id,title,neighborhood,price,price_period,available_now,views,expires_at,status,property_images(url,is_primary,sort_order)")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(4);
      const { data: sd } = await supabase.from("listing_stats").select("property_id,whatsapp_clicks");
      const waMap: Record<string, number> = {};
      for (const s of sd ?? []) waMap[s.property_id] = (waMap[s.property_id] ?? 0) + (s.whatsapp_clicks ?? 0);
      const mapped: Listing[] = (data ?? []).map((row) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const imgs: any[] = (row as any).property_images ?? [];
        const primary = imgs.find((i) => i.is_primary) ?? imgs.sort((a, b) => a.sort_order - b.sort_order)[0];
        return {
          id: row.id, title: row.title, neighborhood: row.neighborhood,
          price: row.price, price_period: row.price_period,
          available_now: row.available_now ?? true, views: row.views ?? 0,
          whatsapp_clicks: waMap[row.id] ?? 0, primary_image: primary?.url ?? null,
          expires_at: (row as { expires_at?: string | null }).expires_at ?? null,
          status: (row as { status?: string | null }).status ?? null,
        };
      });
      setDashListings(mapped); setDashListingsLoading(false);
    }
    loadDashListings();
  }, [user.id]);

  const chartData    = statsData.map((d) => ({ ...d, label: fmtDate(d.date) }));
  const chartSampled = chartData.filter((_, i) => i % 5 === 0);

  const sidebarTabs: DashTab[] = [
    { key: "dashboard",    label: "Tableau de bord",    icon: <BarChart2 className="w-4 h-4" /> },
    { key: "annonces",     label: "Mes annonces",       icon: <Home className="w-4 h-4" /> },
    { key: "visites",      label: "Visites & demandes", icon: <Calendar className="w-4 h-4" />, badge: pendingVisits },
    { key: "messages",     label: "Messages",           icon: <MessageCircle className="w-4 h-4" /> },
    { key: "statistiques", label: "Statistiques",       icon: <TrendingUp className="w-4 h-4" /> },
    { key: "avis",         label: "Avis & évaluations", icon: <Star className="w-4 h-4" /> },
    { key: "profil",       label: "Profil",             icon: <User className="w-4 h-4" /> },
    { key: "abonnement",   label: "Abonnement",         icon: <CreditCard className="w-4 h-4" /> },
  ];

  const sidebarProps = { tabs: sidebarTabs, activeTab: tab, onTabChange: setTab, profile, displayName, initials, accountTypeLabel, onSignOut: signOut };

  return (
    <div style={{ display: "flex", minHeight: "80vh" }}>
      {/* ── Sidebar desktop ── */}
      <aside className="hidden lg:flex flex-col flex-shrink-0" style={{ width: 220, background: "#0F1923", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
        <AnnonceurSidebarContent {...sidebarProps} />
      </aside>

      {/* ── Mobile drawer ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 270, zIndex: 51 }}>
            <AnnonceurSidebarContent {...sidebarProps} onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* ── Content column ── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3" style={{ background: "#0F1923", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={() => setSidebarOpen(true)} style={{ color: "rgba(255,255,255,0.70)" }}>
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm flex-1 truncate" style={{ color: "#fff" }}>{displayName}</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "rgba(212,175,55,0.15)", color: "#D4AF37" }}>{accountTypeLabel}</span>
        </div>

        {/* ── Profile header ── */}
        <div style={{ background: "linear-gradient(135deg,#0F1923 0%,#162030 60%,#1a2535 100%)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "24px 24px 20px" }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden flex items-center justify-center font-bold text-2xl"
                style={{ background: "rgba(212,175,55,0.20)", color: "#D4AF37", border: "3px solid rgba(212,175,55,0.30)" }}>
                {profile?.avatar_url
                  ? <Image src={profile.avatar_url} alt={displayName} width={80} height={80} className="w-full h-full object-cover" />
                  : initials}
              </div>
              {profile?.is_verified_pro && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#D4AF37" }}>
                  <CheckCircle className="w-3.5 h-3.5" style={{ color: "#0B0F19" }} />
                </div>
              )}
            </div>

            {/* Name + contact */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="font-bold text-lg sm:text-xl" style={{ color: "#fff", fontFamily: "var(--font-display), sans-serif" }}>{displayName}</h1>
                {profile?.is_verified_pro && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(212,175,55,0.15)", color: "#D4AF37" }}>VÉRIFIÉ ✓</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs flex-wrap mb-3" style={{ color: "rgba(255,255,255,0.45)" }}>
                <span>{accountTypeLabel}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Conakry, Guinée</span>
                {memberSince && <span>Membre depuis {memberSince}</span>}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {profile?.phone && (
                  <a href={`tel:${profile.phone}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.75)" }}>
                    <Phone className="w-3.5 h-3.5" /> {profile.phone}
                  </a>
                )}
                {user.email && (
                  <a href={`mailto:${user.email}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.75)" }}>
                    <Mail className="w-3.5 h-3.5" /> Email
                  </a>
                )}
                {wa && (
                  <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                    style={{ background: "#25D366", color: "#fff" }}>
                    WhatsApp
                  </a>
                )}
              </div>
            </div>

            {/* Stats row */}
            {annStats && (
              <div className="flex items-center gap-5 sm:gap-6 flex-wrap sm:flex-nowrap sm:border-l sm:pl-6" style={{ borderColor: "rgba(255,255,255,0.10)" }}>
                {[
                  { label: "Annonces",  value: String(annStats.listings) },
                  { label: "Vues",      value: String(annStats.views) },
                  { label: "Demandes",  value: String(annStats.demands) },
                  { label: "Visites",   value: String(annStats.visits) },
                  ...(annStats.reviewCount > 0 ? [{ label: "Note", value: `${annStats.avgRating.toFixed(1)}★` }] : []),
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="font-bold text-base sm:text-lg" style={{ color: "#D4AF37" }}>{s.value}</p>
                    <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.38)" }}>{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Body: main + right panel ── */}
        <div style={{ flex: 1, display: "flex" }}>
          {/* Main tab content */}
          <div style={{ flex: 1, minWidth: 0, padding: "24px", overflowY: "auto" }}>

            {/* ── TABLEAU DE BORD ── */}
            {tab === "dashboard" && (
              <>
                <div className="mb-5">
                  <h2 style={{ fontFamily: "var(--font-display), sans-serif", color: "var(--bl-amber-light)", fontSize: 22, fontWeight: 700 }}>
                    Bonjour{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
                  </h2>
                  <p className="text-sm mt-0.5 capitalize" style={{ color: "var(--bl-cream-faint)", fontWeight: 300 }}>
                    Performance sur 30 jours · {todayLabel()}
                  </p>
                </div>

                {statsLoading ? (
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {[1,2,3,4].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl" style={{ background: "var(--bl-surface-2)" }} />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <StatCard label="Vues (30j)"       value={totalViews}  sub="toutes annonces"   borderColor="#D4AF37" />
                    <StatCard label="Clics WhatsApp"   value={totalWA}     sub="30 derniers jours" borderColor="#D4AF37" />
                    <StatCard label="Messages reçus"   value={msgCount}    sub="cette semaine"     borderColor="#D4AF37" />
                    <StatCard label="Annonces actives" value={activeCount} sub={profile?.is_verified_pro ? "illimitées" : "sur 5 max"} borderColor="#D4AF37" />
                  </div>
                )}

                {!statsLoading && (
                  <DashboardChart
                    type="bar"
                    title="Vues par jour — 30 jours"
                    data={chartData}
                    series={[{ dataKey: "views", name: "Vues", color: "#D4AF37" }]}
                    ticks={chartSampled.map((d) => d.label)}
                  />
                )}

                <div className="flex items-center justify-between mb-3 mt-6">
                  <h3 className="font-bold text-sm" style={{ color: "var(--bl-cream)" }}>Annonces récentes</h3>
                  <Link href="/publier" className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg"
                    style={{ background: "var(--bl-amber)", color: "var(--bl-cream)" }}>
                    <Plus className="w-3.5 h-3.5" /> Publier
                  </Link>
                </div>

                {dashListingsLoading ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[1,2].map((i) => <div key={i} className="rounded-2xl animate-pulse" style={{ aspectRatio: "16/10", background: "var(--bl-surface-2)" }} />)}
                  </div>
                ) : dashListings.length === 0 ? (
                  <div className="text-center py-10 rounded-2xl" style={{ border: "2px dashed var(--bl-border-md)" }}>
                    <p className="text-3xl mb-2">🏠</p>
                    <p className="font-bold mb-3" style={{ color: "var(--bl-cream)" }}>Aucune annonce</p>
                    <Link href="/publier" className="inline-flex items-center gap-2 font-bold px-5 py-2.5 rounded-xl text-sm"
                      style={{ background: "var(--bl-amber)", color: "var(--bl-cream)" }}>
                      <Plus className="w-4 h-4" /> Publier maintenant →
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      {dashListings.map((listing) => <DashboardListingCard key={listing.id} listing={listing} />)}
                    </div>
                    <button onClick={() => setTab("annonces")}
                      className="w-full mt-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
                      style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.25)", color: "var(--bl-amber)" }}>
                      Voir toutes les annonces →
                    </button>
                  </>
                )}

                <MonthlyReportSection userId={user.id} />
              </>
            )}

            {/* ── MES ANNONCES ── */}
            {tab === "annonces" && (
              <>
                <SectionHeader title="Mes annonces" action={
                  <Link href="/publier" className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: "var(--bl-amber)", color: "var(--bl-cream)" }}>
                    <Plus className="w-3.5 h-3.5" /> Publier
                  </Link>
                } />
                <ListingsManager userId={user.id} />
              </>
            )}

            {/* ── VISITES & DEMANDES ── */}
            {tab === "visites" && (
              <>
                <SectionHeader title="Visites & demandes" subtitle="Reçues sur vos annonces" />
                <VisitRequestsManager userId={user.id} onPendingCount={setPendingVisits} />
              </>
            )}

            {/* ── MESSAGES ── */}
            {tab === "messages" && (
              <div>
                <SectionHeader title="Messages" />
                <Link href="/messages" className="flex items-center justify-between rounded-2xl p-5"
                  style={{ background: "var(--bl-surface)", border: "1px solid var(--bl-border)" }}>
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-6 h-6 text-blue-400" />
                    <div>
                      <p className="font-bold" style={{ color: "var(--bl-cream)" }}>Mes messages</p>
                      <p className="text-sm" style={{ color: "var(--bl-cream-faint)" }}>Ouvrir la messagerie complète</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5" style={{ color: "var(--bl-cream-faint)" }} />
                </Link>
              </div>
            )}

            {/* ── STATISTIQUES ── */}
            {tab === "statistiques" && (
              <>
                <SectionHeader title="Statistiques" subtitle="30 derniers jours" />
                {statsLoading ? (
                  <div className="h-48 rounded-2xl animate-pulse" style={{ background: "var(--bl-surface-2)" }} />
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <StatCard label="Vues totales"      value={totalViews}  borderColor="#D4AF37" />
                      <StatCard label="Contacts WhatsApp" value={totalWA}     borderColor="#D4AF37" />
                      <StatCard label="Messages reçus"    value={msgCount}    borderColor="#D4AF37" />
                      <StatCard label="Annonces actives"  value={activeCount} borderColor="#D4AF37" />
                    </div>
                    <DashboardChart
                      type="line"
                      title="Vues + WhatsApp — 30 jours"
                      data={chartData}
                      height={200}
                      series={[
                        { dataKey: "views",           name: "Vues",     color: "#D4AF37" },
                        { dataKey: "whatsapp_clicks", name: "WhatsApp", color: "#25D366" },
                      ]}
                      ticks={chartSampled.map((d) => d.label)}
                      showDots
                    />
                  </>
                )}
              </>
            )}

            {/* ── AVIS & ÉVALUATIONS ── */}
            {tab === "avis" && (
              <>
                <SectionHeader title="Avis & évaluations" subtitle="Les avis laissés par vos clients" />
                <ReviewsSection userId={user.id} />
              </>
            )}

            {/* ── PROFIL ── */}
            {tab === "profil" && (
              <>
                <SectionHeader title="Mon profil" />
                {(isAgent || isAgence) && (
                  <Link href={isAgence ? `/agences/${user.id}` : `/agents/${user.id}`}
                    className="flex items-center justify-between rounded-2xl px-4 py-3 mb-4"
                    style={{ background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.20)" }}>
                    <span className="text-sm font-semibold" style={{ color: "var(--bl-amber-light)" }}>Voir mon profil public</span>
                    <ChevronRight className="w-4 h-4" style={{ color: "var(--bl-amber)" }} />
                  </Link>
                )}
                <ProfileForm user={user} profile={profile} refreshProfile={refreshProfile} />
              </>
            )}

            {/* ── ABONNEMENT ── */}
            {tab === "abonnement" && (
              <>
                <SectionHeader title="Abonnement" subtitle="Gérez votre plan" />
                <AbonnementSection profile={profile} />
              </>
            )}
          </div>

          {/* ── Right panel (xl+) ── */}
          <aside className="hidden xl:flex flex-col gap-4 flex-shrink-0"
            style={{ width: 280, padding: "24px", borderLeft: "1px solid var(--bl-border)" }}>

            {/* Statut du profil */}
            <div className="rounded-2xl p-4" style={{ background: "var(--bl-surface)", border: "1px solid var(--bl-border)" }}>
              <p className="text-[11px] font-bold uppercase mb-3" style={{ color: "var(--bl-cream-faint)", letterSpacing: "0.12em" }}>Statut du profil</p>
              {profile?.is_verified_pro ? (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(34,197,94,0.15)" }}>
                    <CheckCircle className="w-5 h-5" style={{ color: "#22c55e" }} />
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: "#22c55e" }}>VÉRIFIÉ</p>
                    <p className="text-xs" style={{ color: "var(--bl-cream-faint)" }}>Compte professionnel actif</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(234,179,8,0.15)" }}>
                    <AlertTriangle className="w-5 h-5" style={{ color: "#eab308" }} />
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: "#eab308" }}>EN ATTENTE</p>
                    <p className="text-xs" style={{ color: "var(--bl-cream-faint)" }}>Vérification en cours</p>
                  </div>
                </div>
              )}
            </div>

            {/* Plan actuel */}
            <div className="rounded-2xl p-4"
              style={{ background: "var(--bl-surface)", border: profile?.is_verified_pro ? "1px solid rgba(212,175,55,0.30)" : "1px solid var(--bl-border)" }}>
              <p className="text-[11px] font-bold uppercase mb-3" style={{ color: "var(--bl-cream-faint)", letterSpacing: "0.12em" }}>Plan actuel</p>
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-5 h-5" style={{ color: profile?.is_verified_pro ? "var(--bl-amber)" : "var(--bl-cream-faint)" }} />
                <p className="font-bold" style={{ color: "var(--bl-cream)" }}>{profile?.is_verified_pro ? "Plan Pro" : "Plan Gratuit"}</p>
                {profile?.is_verified_pro && (
                  <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(212,175,55,0.15)", color: "#D4AF37" }}>Actif</span>
                )}
              </div>
              <Link href="/tarifs" className="flex items-center justify-center py-2 rounded-xl text-xs font-bold transition-all"
                style={profile?.is_verified_pro
                  ? { background: "var(--bl-surface-2)", border: "1px solid var(--bl-border-md)", color: "var(--bl-cream-dim)" }
                  : { background: "var(--bl-amber)", color: "#0B0F19" }}>
                {profile?.is_verified_pro ? "Gérer l'abonnement" : "Passer Pro →"}
              </Link>
            </div>

            {/* Avis récents */}
            <div className="rounded-2xl p-4" style={{ background: "var(--bl-surface)", border: "1px solid var(--bl-border)" }}>
              <p className="text-[11px] font-bold uppercase mb-3" style={{ color: "var(--bl-cream-faint)", letterSpacing: "0.12em" }}>Avis des utilisateurs</p>
              {recentReviews.length === 0 ? (
                <div className="text-center py-4">
                  <Star className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--bl-cream-faint)" }} />
                  <p className="text-xs" style={{ color: "var(--bl-cream-faint)" }}>Aucun avis pour l&apos;instant</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentReviews.map((r) => {
                    const ini = (r.reviewer_name ?? "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                    return (
                      <div key={r.id} className="flex gap-2.5">
                        <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                          style={{ background: "rgba(212,175,55,0.15)", color: "#D4AF37" }}>
                          {r.reviewer_avatar
                            ? <Image src={r.reviewer_avatar} alt={r.reviewer_name ?? ""} width={28} height={28} className="w-7 h-7 object-cover rounded-full" />
                            : ini}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-0.5 mb-0.5">
                            {[1,2,3,4,5].map((s) => (
                              <Star key={s} className="w-2.5 h-2.5" fill={s <= r.rating ? "#D4AF37" : "none"} style={{ color: "#D4AF37" }} />
                            ))}
                          </div>
                          {r.comment && <p className="text-xs line-clamp-2" style={{ color: "var(--bl-cream-dim)" }}>{r.comment}</p>}
                          <p className="text-[10px] mt-0.5" style={{ color: "var(--bl-cream-faint)" }}>
                            {r.reviewer_name ?? "Anonyme"} · {new Date(r.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <button onClick={() => setTab("avis")}
                    className="w-full mt-1 py-2 rounded-xl text-xs font-bold"
                    style={{ background: "rgba(212,175,55,0.08)", color: "var(--bl-amber)", border: "1px solid rgba(212,175,55,0.20)" }}>
                    Voir tous les avis →
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
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
    background: "var(--bl-surface-2)", border: "1px solid var(--bl-border-md)",
    borderRadius: 12, padding: "10px 14px", color: "var(--bl-cream)", fontSize: 14, width: "100%", outline: "none",
  };

  const tabs: DashTab[] = [
    { key: "recherches", label: "Recherches",  icon: <Search className="w-4 h-4" /> },
    { key: "favoris",    label: "Favoris",     icon: <Heart className="w-4 h-4" /> },
    { key: "visites",    label: "Mes visites", icon: <Calendar className="w-4 h-4" /> },
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
            <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: "var(--bl-amber)", color: "var(--bl-cream)" }}>
              <Plus className="w-3.5 h-3.5" /> Nouvelle
            </button>
          } />
          {showNew && (
            <div className="rounded-2xl p-4 mb-4" style={{ background: "var(--bl-surface)", border: "1px solid rgba(212,175,55,0.30)" }}>
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
                <button onClick={saveNewSearch} disabled={saving || !newLabel.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50" style={{ background: "var(--bl-amber)", color: "var(--bl-cream)" }}>Sauvegarder</button>
              </div>
            </div>
          )}
          {searchesLoading ? (
            <div className="space-y-3">{[1,2].map((i) => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "var(--bl-surface-2)" }} />)}</div>
          ) : searches.length === 0 ? (
            <div className="text-center py-12 rounded-2xl" style={{ border: "2px dashed var(--bl-border-md)" }}>
              <Search className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--bl-cream-faint)" }} />
              <p className="font-bold mb-1" style={{ color: "var(--bl-cream)" }}>Aucune recherche sauvegardée</p>
              <p className="text-sm mb-4" style={{ color: "var(--bl-cream-faint)" }}>Sauvegardez vos critères pour recevoir des alertes.</p>
              <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-2 font-bold px-5 py-2.5 rounded-xl text-sm" style={{ background: "var(--bl-amber)", color: "var(--bl-cream)" }}>
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
                    {s.neighborhood && <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "var(--border-subtle)", color: "var(--bl-cream-dim)" }}>{NL[s.neighborhood] ?? s.neighborhood}</span>}
                    {s.type && <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "var(--border-subtle)", color: "var(--bl-cream-dim)" }}>{TL[s.type] ?? s.type}</span>}
                    {s.transaction_type && <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "var(--border-subtle)", color: "var(--bl-cream-dim)" }}>{s.transaction_type === "rent" ? "Location" : "Vente"}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={buildUrl(s)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold" style={{ background: "rgba(212,175,55,0.12)", color: "var(--bl-amber)", border: "1px solid rgba(212,175,55,0.25)" }}>
                      Voir les annonces <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                    <button onClick={() => toggleNotify(s)} className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold"
                      style={s.notify_whatsapp ? { background: "rgba(212,175,55,0.12)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.25)" } : { background: "var(--bl-surface-2)", color: "var(--bl-cream-faint)", border: "1px solid var(--bl-border)" }}>
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

      {tab === "visites" && (
        <>
          <SectionHeader title="Mes demandes de visite" subtitle="Suivi en temps réel du statut" />
          <VisitorVisitsSection userId={user.id} />
        </>
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

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--bl-amber)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!user) return null;

  const role      = profile?.role ?? "buyer";
  const dashProps = { user, profile, signOut, refreshProfile };

  // ── Acheteur simple ──────────────────────────────────────────────────────────
  if (role === "buyer") {
    return (
      <div className="max-w-xl mx-auto">
        <div className="lg:rounded-2xl lg:overflow-hidden" style={{ border: "1px solid var(--bl-border)" }}>
          <BuyerProfile user={user} profile={profile} refreshProfile={refreshProfile} />
        </div>
      </div>
    );
  }

  // ── Chercheur ────────────────────────────────────────────────────────────────
  if (role === "chercheur") {
    return (
      <div className="max-w-3xl lg:max-w-5xl mx-auto lg:px-0">
        <div className="lg:rounded-2xl lg:overflow-hidden" style={{ border: "1px solid var(--bl-border)" }}>
          <ChercheurDashboard {...dashProps} />
        </div>
      </div>
    );
  }

  // ── Annonceur (proprietaire / owner / agent / agence / agency) ───────────────
  return (
    <div className="max-w-3xl lg:max-w-6xl mx-auto lg:px-0">
      <div style={{ border: "1px solid var(--bl-border)", borderRadius: "0 0 16px 16px", overflow: "hidden" }}>
        <AnnonceurDashboard {...dashProps} />
      </div>
    </div>
  );
}
