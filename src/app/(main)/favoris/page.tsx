"use client";
import { useState } from "react";
import { Heart, Bell, BellOff, FolderPlus, Pencil, Trash2, ChevronRight, CheckCircle, X } from "lucide-react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { MOCK_PROPERTIES } from "@/data/mock-properties";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import type { Property } from "@/types";
import type { PublishedProperty, FavoriteCollection } from "@/lib/store";

const PRESET_COLORS = ["#F97316", "#22c55e", "#3b82f6", "#a855f7", "#ef4444"];

function asProperty(p: PublishedProperty): Property {
  return p as unknown as Property;
}

export default function FavorisPage() {
  const favorites = useAppStore((s) => s.favorites);
  const publishedListings = useAppStore((s) => s.publishedListings);
  const favoriteCollections = useAppStore((s) => s.favoriteCollections);
  const createCollection = useAppStore((s) => s.createCollection);
  const addToCollection = useAppStore((s) => s.addToCollection);
  const removeFromCollection = useAppStore((s) => s.removeFromCollection);
  const deleteCollection = useAppStore((s) => s.deleteCollection);
  const renameCollection = useAppStore((s) => s.renameCollection);
  const addPriceAlert = useAppStore((s) => s.addPriceAlert);
  const removePriceAlert = useAppStore((s) => s.removePriceAlert);
  const hasPriceAlert = useAppStore((s) => s.hasPriceAlert);
  const _hasHydrated = useAppStore((s) => s._hasHydrated);

  const [activeTab, setActiveTab] = useState<"favoris" | "collections">("favoris");
  const [showNewCollectionForm, setShowNewCollectionForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionColor, setNewCollectionColor] = useState(PRESET_COLORS[0]);
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [addToCollectionCardId, setAddToCollectionCardId] = useState<string | null>(null);

  const allProperties: Property[] = [
    ...publishedListings.map(asProperty),
    ...MOCK_PROPERTIES,
  ];

  const favProperties = allProperties.filter((p) => favorites.includes(p.id));

  function handleCreateCollection() {
    if (!newCollectionName.trim()) return;
    createCollection(newCollectionName.trim(), newCollectionColor);
    setNewCollectionName("");
    setNewCollectionColor(PRESET_COLORS[0]);
    setShowNewCollectionForm(false);
    toast("Collection créée", "success");
  }

  function handleRename(collection: FavoriteCollection) {
    if (!editingName.trim()) return;
    renameCollection(collection.id, editingName.trim());
    setEditingCollectionId(null);
    setEditingName("");
  }

  function getCollectionProperties(collection: FavoriteCollection): Property[] {
    return collection.propertyIds
      .map((id) => allProperties.find((p) => p.id === id))
      .filter((p): p is Property => Boolean(p));
  }

  if (!_hasHydrated) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2" />
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Mes favoris</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          {favProperties.length} annonce{favProperties.length !== 1 ? "s" : ""} sauvegardée{favProperties.length !== 1 ? "s" : ""}
          {" · "}
          {favoriteCollections.length} collection{favoriteCollections.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 dark:bg-[#1e2430] rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab("favoris")}
          className={cn(
            "px-5 py-2 rounded-lg text-sm font-semibold transition-all",
            activeTab === "favoris"
              ? "bg-white dark:bg-[#2a3040] text-slate-900 dark:text-white shadow"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          )}
        >
          Tous les favoris
        </button>
        <button
          onClick={() => setActiveTab("collections")}
          className={cn(
            "px-5 py-2 rounded-lg text-sm font-semibold transition-all",
            activeTab === "collections"
              ? "bg-white dark:bg-[#2a3040] text-slate-900 dark:text-white shadow"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          )}
        >
          Collections
          {favoriteCollections.length > 0 && (
            <span className="ml-1.5 bg-[#F97316] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {favoriteCollections.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB: Tous les favoris */}
      {activeTab === "favoris" && (
        <>
          {favProperties.length === 0 ? (
            <div className="text-center py-20">
              <Heart className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Aucun favori</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Appuyez sur le cœur sur une annonce pour la sauvegarder ici
              </p>
              <Link
                href="/annonces"
                className="bg-[#F97316] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#EA6C0A] transition-colors inline-block"
              >
                Parcourir les annonces
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {favProperties.map((p, i) => (
                <div key={p.id} className="flex flex-col gap-2 relative">
                  <PropertyCard property={p} index={i} />

                  {/* Price alert button */}
                  {hasPriceAlert(p.id) ? (
                    <button
                      onClick={() => {
                        removePriceAlert(p.id);
                        toast("Alerte prix désactivée", "info");
                      }}
                      className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                    >
                      <BellOff className="w-3.5 h-3.5" />
                      Alerte active — Désactiver
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        addPriceAlert(p.id, p.price);
                        toast("Alerte prix activée pour cette annonce 🔔", "success");
                      }}
                      className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-xl border border-slate-200 dark:border-[#2a3040] text-slate-600 dark:text-slate-400 hover:border-[#F97316] hover:text-[#F97316] dark:hover:border-[#F97316] dark:hover:text-[#F97316] transition-colors"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      Alerte prix
                    </button>
                  )}

                  {/* Add to collection */}
                  <div className="relative">
                    <button
                      onClick={() => setAddToCollectionCardId(addToCollectionCardId === p.id ? null : p.id)}
                      className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-xl border border-slate-200 dark:border-[#2a3040] text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      Ajouter à une collection
                    </button>
                    {addToCollectionCardId === p.id && (
                      <div className="absolute bottom-full mb-1 left-0 right-0 bg-white dark:bg-[#1e2430] border border-slate-200 dark:border-[#2a3040] rounded-xl shadow-xl z-50 overflow-hidden">
                        {favoriteCollections.length === 0 ? (
                          <p className="text-xs text-slate-400 p-3">Aucune collection. Créez-en une dans l&apos;onglet Collections.</p>
                        ) : (
                          favoriteCollections.map((col) => {
                            const inCol = col.propertyIds.includes(p.id);
                            return (
                              <button
                                key={col.id}
                                onClick={() => {
                                  if (inCol) {
                                    removeFromCollection(col.id, p.id);
                                    toast(`Retiré de « ${col.name} »`, "info");
                                  } else {
                                    addToCollection(col.id, p.id);
                                    toast(`Ajouté à « ${col.name} »`, "success");
                                  }
                                  setAddToCollectionCardId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-[#2a3040] transition-colors text-left"
                              >
                                <span
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: col.color }}
                                />
                                <span className="flex-1 text-slate-800 dark:text-white">{col.name}</span>
                                {inCol && <CheckCircle className="w-3.5 h-3.5 text-[#F97316]" />}
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB: Collections */}
      {activeTab === "collections" && (
        <div className="space-y-6">
          {/* Create collection button */}
          {!showNewCollectionForm ? (
            <button
              onClick={() => setShowNewCollectionForm(true)}
              className="flex items-center gap-2 text-sm font-semibold text-[#F97316] hover:text-[#EA6C0A] transition-colors"
            >
              <FolderPlus className="w-4 h-4" />
              Créer une collection
            </button>
          ) : (
            <div className="bg-white dark:bg-[#1e2430] border border-slate-200 dark:border-[#2a3040] rounded-2xl p-5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Nouvelle collection</h3>
              <input
                type="text"
                placeholder="Nom de la collection"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateCollection()}
                autoFocus
                className="w-full bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F97316] mb-3"
              />
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-slate-500 dark:text-slate-400">Couleur :</span>
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewCollectionColor(color)}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-transform",
                      newCollectionColor === color ? "border-white scale-110 shadow-md" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateCollection}
                  disabled={!newCollectionName.trim()}
                  className="flex-1 bg-[#F97316] disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-xl text-sm hover:bg-[#EA6C0A] transition-colors"
                >
                  Créer
                </button>
                <button
                  onClick={() => {
                    setShowNewCollectionForm(false);
                    setNewCollectionName("");
                  }}
                  className="py-2 px-4 rounded-xl text-sm border border-slate-200 dark:border-[#2a3040] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#2a3040] transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Collections list */}
          {favoriteCollections.length === 0 && !showNewCollectionForm ? (
            <div className="text-center py-16">
              <FolderPlus className="w-14 h-14 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-slate-900 dark:text-white font-bold mb-1">Aucune collection</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Organisez vos favoris en créant des collections thématiques
              </p>
            </div>
          ) : (
            favoriteCollections.map((collection) => {
              const collectionProperties = getCollectionProperties(collection);

              return (
                <div
                  key={collection.id}
                  className="bg-white dark:bg-[#1e2430] border border-slate-100 dark:border-[#2a3040] rounded-2xl overflow-hidden"
                >
                  {/* Collection header */}
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-[#2a3040]">
                    <span
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: collection.color }}
                    />

                    {editingCollectionId === collection.id ? (
                      <form
                        onSubmit={(e) => { e.preventDefault(); handleRename(collection); }}
                        className="flex-1 flex gap-2"
                      >
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          autoFocus
                          className="flex-1 bg-slate-50 dark:bg-[#151922] border border-[#F97316] rounded-lg px-3 py-1 text-sm text-slate-900 dark:text-white focus:outline-none"
                        />
                        <button type="submit" className="text-xs font-bold text-[#F97316] hover:underline">
                          OK
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCollectionId(null)}
                          className="text-xs text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">{collection.name}</h3>
                          <p className="text-xs text-slate-400">
                            {collection.propertyIds.length} annonce{collection.propertyIds.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 ml-auto">
                          <button
                            onClick={() => {
                              setEditingCollectionId(collection.id);
                              setEditingName(collection.name);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2a3040] transition-colors"
                            title="Renommer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              deleteCollection(collection.id);
                              toast("Collection supprimée", "info");
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            href={`/favoris?collection=${collection.id}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2a3040] transition-colors"
                            title="Voir tout"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Properties horizontal scroll */}
                  {collectionProperties.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                      <p className="text-sm text-slate-400">Aucune annonce dans cette collection</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Ajoutez des annonces depuis l&apos;onglet &quot;Tous les favoris&quot;
                      </p>
                    </div>
                  ) : (
                    <div className="px-4 py-4">
                      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                        {collectionProperties.map((p, i) => (
                          <div key={p.id} className="flex-shrink-0 w-72 relative group/item">
                            <PropertyCard property={p} variant="horizontal" index={i} />
                            <button
                              onClick={() => {
                                removeFromCollection(collection.id, p.id);
                                toast(`Retiré de « ${collection.name} »`, "info");
                              }}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity z-10"
                              title="Retirer de la collection"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Click outside to close dropdown */}
      {addToCollectionCardId && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setAddToCollectionCardId(null)}
        />
      )}
    </div>
  );
}
