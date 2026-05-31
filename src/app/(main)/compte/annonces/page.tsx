"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus, Eye, MessageCircle, CheckCircle, Clock, XCircle,
  Edit, Trash2, Zap, Copy, PauseCircle, PlayCircle,
} from "lucide-react";
import { formatPrice, timeAgo } from "@/lib/utils";
import { BoostModal } from "@/components/property/BoostModal";
import { useAppStore } from "@/lib/store";

const STATUS_CONFIG = {
  active: { label: "Active", color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/20", icon: CheckCircle },
  paused: { label: "En pause", color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10 dark:bg-[#D4AF37]/15", icon: Clock },
  pending: { label: "En attente", color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10 dark:bg-[#D4AF37]/15", icon: Clock },
  rented: { label: "Louée", color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/20", icon: CheckCircle },
  suspended: { label: "Suspendue", color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/20", icon: XCircle },
  sold: { label: "Vendue", color: "text-purple-500", bg: "bg-purple-100 dark:bg-purple-900/20", icon: CheckCircle },
} as const;

interface ConfirmDialog {
  id: string;
  title: string;
}

export default function MesAnnoncesPage() {
  const router = useRouter();
  const publishedListings = useAppStore((s) => s.publishedListings);
  const removePublishedListing = useAppStore((s) => s.removePublishedListing);
  const updateListingStatus = useAppStore((s) => s.updateListingStatus);
  const duplicateListing = useAppStore((s) => s.duplicateListing);

  const [boostingProperty, setBoostingProperty] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDialog | null>(null);

  const boostingPropertyData = boostingProperty
    ? publishedListings.find((p) => p.id === boostingProperty)
    : null;

  function handleDelete(id: string) {
    removePublishedListing(id);
    setConfirmDelete(null);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Mes annonces</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {publishedListings.length} annonce{publishedListings.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/publier"
          className="flex items-center gap-1.5 bg-[#D4AF37] text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-[#B8963A] transition-colors"
        >
          <Plus className="w-4 h-4" /> Publier
        </Link>
      </div>

      {publishedListings.length === 0 && (
        <div className="bg-[var(--bg-card-light)] rounded-2xl p-10 border border-[var(--border)] text-center">
          <p className="text-slate-400 text-sm mb-4">Vous n&apos;avez pas encore d&apos;annonce publiée.</p>
          <Link
            href="/publier"
            className="inline-flex items-center gap-1.5 bg-[#D4AF37] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#B8963A] transition-colors"
          >
            <Plus className="w-4 h-4" /> Publier ma première annonce
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {publishedListings.map((p) => {
          const statusKey = (p.status ?? "active") as keyof typeof STATUS_CONFIG;
          const cfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.active;
          const Icon = cfg.icon;
          const isPaused = p.status === "paused";

          return (
            <div
              key={p.id}
              className={`bg-[var(--bg-card-light)] rounded-2xl p-4 border border-[var(--border)] transition-opacity ${isPaused ? "opacity-60" : ""}`}
            >
              <div className="flex items-start gap-3">
                {/* Thumbnail */}
                <div className="relative w-20 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-[#151922]">
                  {p.images[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                  )}
                  {p.isBoosted && (
                    <div className="absolute inset-0 bg-[#D4AF37]/80 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-1">{p.title}</p>
                      <p className="text-[#D4AF37] font-bold text-sm">
                        {formatPrice(p.price)}{p.pricePeriod === "month" ? "/mois" : ""}
                      </p>
                    </div>
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
                      <Icon className="w-2.5 h-2.5" />{cfg.label}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />{p.views} vues
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />0 contacts
                    </span>
                    <span>{timeAgo(p.createdAt)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Link
                      href={`/annonces/${p.id}`}
                      className="flex-1 text-center text-xs font-semibold py-1.5 rounded-lg border border-[var(--border)] text-slate-600 dark:text-slate-300 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
                    >
                      Voir
                    </Link>

                    <button
                      onClick={() => router.push(`/compte/annonces/${p.id}/modifier`)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-1.5 rounded-lg border border-[var(--border)] text-slate-600 dark:text-slate-300 hover:border-blue-500 hover:text-blue-500 transition-colors"
                    >
                      <Edit className="w-3 h-3" /> Modifier
                    </button>

                    {/* Pause/Reactivate */}
                    <button
                      onClick={() => updateListingStatus(p.id, isPaused ? "active" : "paused")}
                      className={`flex items-center justify-center gap-1 text-xs font-semibold py-1.5 px-3 rounded-lg border transition-colors ${
                        isPaused
                          ? "border-green-400 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
                          : "border-slate-200 dark:border-[var(--border)] text-slate-500 dark:text-slate-400 hover:border-[#D4AF37] hover:text-[#D4AF37]"
                      }`}
                      title={isPaused ? "Réactiver" : "Mettre en pause"}
                    >
                      {isPaused ? <PlayCircle className="w-3 h-3" /> : <PauseCircle className="w-3 h-3" />}
                    </button>

                    {/* Duplicate */}
                    <button
                      onClick={() => duplicateListing(p.id)}
                      className="flex items-center justify-center gap-1 text-xs font-semibold py-1.5 px-3 rounded-lg border border-[var(--border)] text-slate-600 dark:text-slate-300 hover:border-blue-400 hover:text-blue-400 transition-colors"
                      title="Dupliquer"
                    >
                      <Copy className="w-3 h-3" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setConfirmDelete({ id: p.id, title: p.title })}
                      className="flex items-center justify-center gap-1 text-xs font-semibold py-1.5 px-3 rounded-lg border border-[var(--border)] text-red-400 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>

                    {/* Boost */}
                    {!p.isBoosted && (
                      <button
                        onClick={() => setBoostingProperty(p.id)}
                        className="flex items-center justify-center gap-1 text-xs font-bold py-1.5 px-3 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#B8963A]/20 transition-colors"
                      >
                        <Zap className="w-3 h-3" /> Booster
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Boost Modal */}
      {boostingProperty && boostingPropertyData && (
        <BoostModal
          propertyId={boostingProperty}
          propertyTitle={boostingPropertyData.title}
          isBoosted={boostingPropertyData.isBoosted}
          boostExpiry={boostingPropertyData.boostExpiry}
          onClose={() => setBoostingProperty(null)}
        />
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--bg-card-light)] rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-[var(--border)]">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-center mb-2">Supprimer cette annonce ?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-1 line-clamp-2">
              &ldquo;{confirmDelete.title}&rdquo;
            </p>
            <p className="text-red-500 text-xs text-center mb-6 font-semibold">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-slate-600 dark:text-slate-300 text-sm font-semibold hover:border-slate-400 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.id)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors"
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
