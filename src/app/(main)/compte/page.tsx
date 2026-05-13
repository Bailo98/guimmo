"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Plus, Eye, MapPin, LogOut, Pencil, Trash2, User,
  CheckCircle, XCircle, RotateCcw, AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const NEIGHBORHOOD_LABELS: Record<string, string> = {
  kipe: "Kipé", lambanyi: "Lambanyi", ratoma: "Ratoma Centre",
  sonfonia: "Sonfonia", cosa: "Cosa", hamdallaye: "Hamdallaye",
  nongo: "Nongo", taouyah: "Taouyah", koloma: "Koloma",
  dixinn: "Dixinn", matam: "Matam", madina: "Madina",
  kaloum: "Kaloum", matoto: "Matoto Centre", sangoyah: "Sangoyah",
};

function formatGNF(amount: number, period?: string | null): string {
  const f = new Intl.NumberFormat("fr-GN", { maximumFractionDigits: 0 }).format(amount);
  return period === "month" ? `${f} GNF/mois` : `${f} GNF`;
}

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

interface DeleteDialogProps {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteDialog({ title, onConfirm, onCancel }: DeleteDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="rounded-2xl p-6 max-w-sm w-full shadow-2xl" style={{ background: "rgba(15,15,22,0.95)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">Supprimer l&apos;annonce</p>
            <p className="text-white/50 text-xs mt-0.5">Cette action est irréversible.</p>
          </div>
        </div>
        <p className="text-white/70 text-sm mb-5 line-clamp-2">
          &ldquo;{title}&rdquo;
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-white/70 font-semibold text-sm hover:bg-white/5 transition-colors" style={{ border: "1px solid rgba(255,255,255,0.10)" }}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ComptePage() {
  const { user, profile, loading: authLoading, signOut, refreshProfile } = useAuth();
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Listing | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Profile edit
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [upgrading, setUpgrading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/connexion?redirect=/compte");
    }
  }, [authLoading, user, router]);

  // Sync profile fields
  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
    if (profile?.phone) setPhone(profile.phone);
    if (profile?.agency_name) setAgencyName(profile.agency_name);
  }, [profile]);

  // Admin redirect
  useEffect(() => {
    if (!authLoading && profile?.role === "admin") router.replace("/admin");
  }, [authLoading, profile, router]);

  const loadListings = useCallback(async () => {
    if (!user || !supabase) return;
    setListingsLoading(true);
    const { data, error } = await supabase
      .from("properties")
      .select(`
        id, title, neighborhood, price, price_period,
        available_now, views,
        property_images!inner(url, is_primary, sort_order)
      `)
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (error) { console.error(error); setListingsLoading(false); return; }

    const mapped: Listing[] = (data ?? []).map((row) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const imgs: any[] = (row as any).property_images ?? [];
      const primary = imgs.find((i) => i.is_primary) ?? imgs.sort((a, b) => a.sort_order - b.sort_order)[0];
      return {
        id: row.id,
        title: row.title,
        neighborhood: row.neighborhood,
        price: row.price,
        price_period: row.price_period,
        available_now: row.available_now ?? true,
        views: row.views ?? 0,
        primary_image: primary?.url ?? null,
      };
    });
    setListings(mapped);
    setListingsLoading(false);
  }, [user]);

  useEffect(() => { loadListings(); }, [loadListings]);

  async function toggleAvailability(listing: Listing) {
    if (!supabase) return;
    setActionLoading(listing.id + "-avail");
    const newVal = !listing.available_now;
    const { error } = await supabase
      .from("properties")
      .update({ available_now: newVal })
      .eq("id", listing.id);
    if (error) {
      toast("Erreur lors de la mise à jour", "error");
    } else {
      setListings((prev) =>
        prev.map((l) => l.id === listing.id ? { ...l, available_now: newVal } : l)
      );
      toast(newVal ? "✅ Annonce remise disponible" : "✅ Annonce marquée comme louée", "success");
    }
    setActionLoading(null);
  }

  async function deleteListing(listing: Listing) {
    if (!supabase) return;
    setDeleteTarget(null);
    setActionLoading(listing.id + "-delete");
    const { error } = await supabase.from("properties").delete().eq("id", listing.id);
    if (error) {
      toast("Erreur lors de la suppression", "error");
    } else {
      setListings((prev) => prev.filter((l) => l.id !== listing.id));
      toast("✅ Annonce supprimée", "success");
    }
    setActionLoading(null);
  }

  async function saveProfile() {
    if (!user || !supabase || !fullName.trim()) return;
    setSavingProfile(true);
    const updates: Record<string, string> = { full_name: fullName.trim() };
    if (phone.trim()) updates.phone = phone.trim();
    if (profile?.role === "agence" && agencyName.trim()) updates.agency_name = agencyName.trim();
    const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
    if (error) {
      toast("Erreur lors de la sauvegarde", "error");
    } else {
      await refreshProfile();
      toast("✅ Profil sauvegardé", "success");
    }
    setSavingProfile(false);
  }

  async function upgradeToProprietaire() {
    if (!user || !supabase) return;
    setUpgrading(true);
    const { error } = await supabase.from("profiles").update({ role: "proprietaire" }).eq("id", user.id);
    if (error) {
      toast("Erreur lors de la mise à jour", "error");
    } else {
      await refreshProfile();
      toast("✅ Vous êtes maintenant propriétaire !", "success");
    }
    setUpgrading(false);
  }

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  // Keep spinner visible while auth resolves OR while the redirect is still pending,
  // so the page never shows a black/empty frame.
  if (authLoading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/40 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const role = profile?.role ?? "buyer";
  const isProprietaire = ["proprietaire", "owner", "agent", "agence"].includes(role);
  const isChercheur = !isProprietaire && role !== "admin";
  const isAgence = role === "agence";

  const displayName = profile?.full_name ?? user.email?.split("@")[0] ?? "Propriétaire";
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24">

      {/* ── Header ── */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black flex-shrink-0" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.20)" }}>
          {initials || <User className="w-6 h-6" />}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-black text-white truncate">{displayName}</h1>
          <p className="text-white/50 text-sm truncate">{user.email}</p>
        </div>
        {isProprietaire && (
          <Link
            href="/publier"
            className="ml-auto flex-none flex items-center gap-1.5 bg-[#F97316] hover:bg-[#EA6C0A] text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-[0_4px_20px_rgba(249,115,22,0.3)]"
          >
            <Plus className="w-4 h-4" />
            Publier
          </Link>
        )}
      </div>

      {/* ══════════════════════════════════════
          SECTION CHERCHEUR
      ══════════════════════════════════════ */}
      {isChercheur && (
        <section className="mb-8 space-y-3">
          <Link
            href="/messages"
            className="flex items-center justify-between rounded-2xl px-4 py-4 hover:bg-white/5 transition-colors" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
          >
            <span className="font-semibold text-white text-sm">💬 Mes messages</span>
            <span className="text-white/40 text-xs">→</span>
          </Link>
          <Link
            href="/favoris"
            className="flex items-center justify-between rounded-2xl px-4 py-4 hover:bg-white/5 transition-colors" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
          >
            <span className="font-semibold text-white text-sm">❤️ Mes favoris</span>
            <span className="text-white/40 text-xs">→</span>
          </Link>
          <div className="rounded-2xl px-4 py-4" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <p className="font-bold text-white text-sm mb-1">Vous êtes propriétaire ?</p>
            <p className="text-white/50 text-xs mb-3">Publiez vos annonces et gérez vos locations.</p>
            <button
              onClick={upgradeToProprietaire}
              disabled={upgrading}
              className="flex items-center gap-2 bg-[#F97316] hover:bg-[#EA6C0A] disabled:opacity-50 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
            >
              {upgrading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
              Devenir propriétaire
            </button>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════
          SECTION 1 — Mes annonces (propriétaires)
      ══════════════════════════════════════ */}
      {isProprietaire && <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">
            Mes annonces
            {!listingsLoading && listings.length > 0 && (
              <span className="ml-2 text-sm font-semibold text-white/40">({listings.length})</span>
            )}
          </h2>
        </div>

        {listingsLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-14 border-2 border-dashed border-white/10 rounded-2xl">
            <div className="text-4xl mb-3">🏠</div>
            <p className="font-bold text-white mb-1">Aucune annonce pour l&apos;instant</p>
            <p className="text-white/50 text-sm mb-4">
              Publiez votre premier bien en quelques minutes.
            </p>
            <Link
              href="/publier"
              className="inline-flex items-center gap-2 bg-[#F97316] hover:bg-[#EA6C0A] text-white font-bold px-5 py-2.5 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              Publier maintenant →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((listing) => {
              const isAvailBusy   = actionLoading === listing.id + "-avail";
              const isDeleteBusy  = actionLoading === listing.id + "-delete";
              const busy = isAvailBusy || isDeleteBusy;

              return (
                <div
                  key={listing.id}
                  className={cn(
                    "rounded-2xl overflow-hidden transition-opacity",
                    busy && "opacity-60 pointer-events-none"
                  )}
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  <div className="flex gap-3 p-3">
                    {/* Thumbnail */}
                    <Link href={`/annonces/${listing.id}`} className="relative w-24 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-white/5">
                      {listing.primary_image ? (
                        <Image
                          src={listing.primary_image}
                          alt={listing.title}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🏠</div>
                      )}
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link href={`/annonces/${listing.id}`}>
                        <p className="font-bold text-white text-sm leading-snug line-clamp-2">
                          {listing.title}
                        </p>
                      </Link>
                      <div className="flex items-center gap-1 text-white/50 text-xs mt-0.5">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {NEIGHBORHOOD_LABELS[listing.neighborhood] ?? listing.neighborhood}
                      </div>
                      <p className="text-white font-bold text-sm mt-1">
                        {formatGNF(listing.price, listing.price_period)}
                      </p>

                      <div className="flex items-center gap-3 mt-1.5">
                        {/* Availability badge */}
                        {listing.available_now ? (
                          <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-[11px] font-bold">
                            <CheckCircle className="w-3 h-3" /> Disponible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-500 text-[11px] font-bold">
                            <XCircle className="w-3 h-3" /> Déjà loué
                          </span>
                        )}
                        {/* Views */}
                        <span className="flex items-center gap-1 text-white/40 text-[11px]">
                          <Eye className="w-3 h-3" /> {listing.views} vue{listing.views !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 px-3 pb-3">
                    {/* Toggle availability */}
                    <button
                      onClick={() => toggleAvailability(listing)}
                      disabled={busy}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-colors border",
                        listing.available_now
                          ? "border-red-200 dark:border-red-800/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                          : "border-green-200 dark:border-green-800/40 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                      )}
                    >
                      {isAvailBusy ? (
                        <div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
                      ) : listing.available_now ? (
                        <><XCircle className="w-3.5 h-3.5" /> Marquer loué</>
                      ) : (
                        <><RotateCcw className="w-3.5 h-3.5" /> Remettre dispo</>
                      )}
                    </button>

                    {/* Edit */}
                    <Link
                      href={`/publier?edit=${listing.id}`}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-white/60 hover:text-white hover:border-white/30 transition-colors" style={{ border: "1px solid rgba(255,255,255,0.10)" }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Modifier
                    </Link>

                    {/* Delete */}
                    <button
                      onClick={() => setDeleteTarget(listing)}
                      disabled={busy}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors" style={{ border: "1px solid rgba(255,255,255,0.10)" }}
                    >
                      {isDeleteBusy ? (
                        <div className="w-3.5 h-3.5 border border-red-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      }

      {/* ══════════════════════════════════════
          SECTION 2 — Mon profil
      ══════════════════════════════════════ */}
      <section>
        <h2 className="text-lg font-bold text-white mb-4">Mon profil</h2>

        <div className="rounded-2xl divide-y divide-white/8" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
          {/* Name field */}
          <div className="p-4">
            <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">
              Prénom &amp; Nom
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Votre nom complet"
                className="flex-1 rounded-xl px-3 py-2.5 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F97316]/50" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
              />
              <button
                onClick={saveProfile}
                disabled={savingProfile || !fullName.trim()}
                className="px-4 py-2.5 bg-[#F97316] hover:bg-[#EA6C0A] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-colors"
              >
                {savingProfile ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Sauvegarder"
                )}
              </button>
            </div>
          </div>

          {/* Email (read-only) */}
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Email</p>
              <p className="text-white/70 text-sm font-medium mt-0.5 truncate max-w-[200px]">
                {user.email}
              </p>
            </div>
            <span className="text-[11px] text-white/40 font-medium px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
              Non modifiable
            </span>
          </div>

          {/* Phone editable */}
          <div className="p-4">
            <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">
              Téléphone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+224 620 00 00 00"
              className="w-full rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]/50" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
            />
          </div>

          {/* Agency name (agence only) */}
          {isAgence && (
            <div className="p-4">
              <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">
                Nom de l&apos;agence
              </label>
              <input
                type="text"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="Nom de votre agence"
                className="w-full rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]/50" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
              />
            </div>
          )}

          {/* Sign out */}
          <div className="p-4">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 dark:border-red-800/40 text-red-500 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Se déconnecter
            </button>
          </div>
        </div>
      </section>

      {/* ── Delete confirmation dialog ── */}
      {deleteTarget && (
        <DeleteDialog
          title={deleteTarget.title}
          onConfirm={() => deleteListing(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
