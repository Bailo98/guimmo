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
      <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-[#2a3040]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white text-sm">Supprimer l&apos;annonce</p>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Cette action est irréversible.</p>
          </div>
        </div>
        <p className="text-slate-600 dark:text-slate-300 text-sm mb-5 line-clamp-2">
          &ldquo;{title}&rdquo;
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-[#2a3040] text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-[#2a3040] transition-colors"
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
  const [savingProfile, setSavingProfile] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/connexion?redirect=/compte");
    }
  }, [authLoading, user, router]);

  // Sync full name from profile
  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
  }, [profile]);

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
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim() })
      .eq("id", user.id);
    if (error) {
      toast("Erreur lors de la sauvegarde", "error");
    } else {
      await refreshProfile();
      toast("✅ Profil sauvegardé", "success");
    }
    setSavingProfile(false);
  }

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return null;

  const displayName = profile?.full_name ?? user.email?.split("@")[0] ?? "Propriétaire";
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24">

      {/* ── Header ── */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-[#F97316] flex items-center justify-center text-white text-xl font-black flex-shrink-0">
          {initials || <User className="w-6 h-6" />}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-black text-slate-900 dark:text-white truncate">{displayName}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm truncate">{user.email}</p>
        </div>
        <Link
          href="/publier"
          className="ml-auto flex-none flex items-center gap-1.5 bg-[#F97316] hover:bg-[#EA6C0A] text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-[0_4px_20px_rgba(249,115,22,0.3)]"
        >
          <Plus className="w-4 h-4" />
          Publier
        </Link>
      </div>

      {/* ══════════════════════════════════════
          SECTION 1 — Mes annonces
      ══════════════════════════════════════ */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Mes annonces
            {!listingsLoading && listings.length > 0 && (
              <span className="ml-2 text-sm font-semibold text-slate-400">({listings.length})</span>
            )}
          </h2>
        </div>

        {listingsLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 bg-slate-100 dark:bg-[#1e2430] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-14 border-2 border-dashed border-slate-200 dark:border-[#2a3040] rounded-2xl">
            <div className="text-4xl mb-3">🏠</div>
            <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Aucune annonce pour l&apos;instant</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
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
                    "bg-white dark:bg-[#1e2430] rounded-2xl border border-slate-100 dark:border-[#2a3040] overflow-hidden transition-opacity",
                    busy && "opacity-60 pointer-events-none"
                  )}
                >
                  <div className="flex gap-3 p-3">
                    {/* Thumbnail */}
                    <Link href={`/annonces/${listing.id}`} className="relative w-24 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-[#151922]">
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
                        <p className="font-bold text-slate-900 dark:text-white text-sm leading-snug line-clamp-2">
                          {listing.title}
                        </p>
                      </Link>
                      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {NEIGHBORHOOD_LABELS[listing.neighborhood] ?? listing.neighborhood}
                      </div>
                      <p className="text-[#F97316] font-bold text-sm mt-1">
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
                        <span className="flex items-center gap-1 text-slate-400 text-[11px]">
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
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border border-slate-200 dark:border-[#2a3040] text-slate-600 dark:text-slate-300 hover:border-[#F97316] hover:text-[#F97316] transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Modifier
                    </Link>

                    {/* Delete */}
                    <button
                      onClick={() => setDeleteTarget(listing)}
                      disabled={busy}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border border-slate-200 dark:border-[#2a3040] text-red-400 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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

      {/* ══════════════════════════════════════
          SECTION 2 — Mon profil
      ══════════════════════════════════════ */}
      <section>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Mon profil</h2>

        <div className="bg-white dark:bg-[#1e2430] rounded-2xl border border-slate-100 dark:border-[#2a3040] divide-y divide-slate-100 dark:divide-[#2a3040]">
          {/* Name field */}
          <div className="p-4">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Prénom &amp; Nom
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Votre nom complet"
                className="flex-1 bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F97316]/50"
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
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</p>
              <p className="text-slate-700 dark:text-slate-300 text-sm font-medium mt-0.5 truncate max-w-[200px]">
                {user.email}
              </p>
            </div>
            <span className="text-[11px] text-slate-400 font-medium bg-slate-100 dark:bg-[#2a3040] px-2.5 py-1 rounded-full">
              Non modifiable
            </span>
          </div>

          {/* Phone (from profile, read-only display) */}
          {profile?.phone && (
            <div className="px-4 py-3">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Téléphone</p>
              <p className="text-slate-700 dark:text-slate-300 text-sm font-medium mt-0.5">{profile.phone}</p>
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
