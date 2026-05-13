"use client";
import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { NearbySection } from "@/components/ui/NearbySection";
import { fetchProperties } from "@/lib/properties";
import { cn } from "@/lib/utils";
import type { Property } from "@/types";

const PAGE_SIZE = 12;

const TYPE_CHIPS = [
  { id: "", label: "Tous" },
  { id: "apartment", label: "Appartement" },
  { id: "villa", label: "Villa" },
  { id: "studio", label: "Studio" },
  { id: "house", label: "Maison" },
  { id: "office", label: "Bureau" },
  { id: "land", label: "Terrain" },
  { id: "room", label: "Chambre" },
];

const QUARTIER_CHIPS = [
  { id: "", label: "Tous" },
  { id: "kipe", label: "Kipé" },
  { id: "hamdallaye", label: "Hamdallaye" },
  { id: "dixinn", label: "Dixinn" },
  { id: "ratoma", label: "Ratoma" },
  { id: "taouyah", label: "Taouyah" },
  { id: "sonfonia", label: "Sonfonia" },
  { id: "kaloum", label: "Kaloum" },
  { id: "lambanyi", label: "Lambanyi" },
  { id: "matam", label: "Matam" },
  { id: "madina", label: "Madina" },
  { id: "cosa", label: "Cosa" },
];

const BUDGET_CHIPS = [
  { id: "", label: "Tous budgets", min: 0, max: Infinity },
  { id: "lt1m", label: "< 1 M", min: 0, max: 1_000_000 },
  { id: "1to2m", label: "1–2 M", min: 1_000_000, max: 2_000_000 },
  { id: "2to5m", label: "2–5 M", min: 2_000_000, max: 5_000_000 },
  { id: "gt5m", label: "> 5 M", min: 5_000_000, max: Infinity },
];

function TypeChip({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-none px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap",
        active ? "text-white" : "text-white/50 hover:text-white"
      )}
      style={active
        ? { background: "rgba(255,255,255,0.20)", border: "1px solid rgba(255,255,255,0.25)" }
        : { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}
    >
      {children}
    </button>
  );
}

function SmallChip({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-none px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap",
        active ? "text-white" : "text-white/50 hover:text-white"
      )}
      style={active
        ? { background: "rgba(255,255,255,0.20)", border: "1px solid rgba(255,255,255,0.25)" }
        : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {children}
    </button>
  );
}

function AnnoncesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const neighborhood = searchParams.get("neighborhood") ?? "";
  const type = searchParams.get("type") ?? "";
  const budget = searchParams.get("budget") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  useEffect(() => {
    fetchProperties()
      .then(setAllProperties)
      .finally(() => setLoading(false));
  }, []);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.delete("page");
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function setPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (p === 1) params.delete("page"); else params.set("page", String(p));
    router.replace(`?${params.toString()}`, { scroll: true });
  }

  const budgetChip = BUDGET_CHIPS.find((b) => b.id === budget) ?? BUDGET_CHIPS[0];
  const hasFilters = !!neighborhood || !!type || !!budget;

  const filtered = useMemo(() => {
    return allProperties.filter((p) => {
      if (neighborhood && p.neighborhood !== neighborhood) return false;
      if (type && p.type !== type) return false;
      if (budget && (p.price < budgetChip.min || p.price > budgetChip.max)) return false;
      return true;
    });
  }, [allProperties, neighborhood, type, budget, budgetChip]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function clearFilters() { router.replace("/annonces", { scroll: false }); }

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1
  );

  const activeFilterCount = [neighborhood, type, budget].filter(Boolean).length;

  return (
    <div className="bg-[#0F0F0F] min-h-screen">
      {/* ── Sticky filter bar ───────────────────────────────────── */}
      <div className="sticky top-16 z-30 -mx-0 px-4 pt-4 pb-3 space-y-3" style={{ background: "rgba(15,15,15,0.97)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        {/* Search pill + filter button */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-3 rounded-full px-4 py-2.5" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <Search className="w-4 h-4 text-white/40 flex-shrink-0" />
            <span className="flex-1 text-sm text-white/40">Rechercher un bien…</span>
          </div>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition-all",
              filtersOpen || activeFilterCount > 0
                ? "text-white"
                : "text-white/50 hover:text-white"
            )}
            style={filtersOpen || activeFilterCount > 0
              ? { background: "rgba(255,255,255,0.20)", border: "1px solid rgba(255,255,255,0.25)" }
              : { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeFilterCount > 0 ? `Filtres (${activeFilterCount})` : "Filtres"}
          </button>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="w-9 h-9 rounded-full flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Type chips — always visible */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {TYPE_CHIPS.map((c) => (
            <TypeChip key={c.id} active={type === c.id} onClick={() => setParam("type", c.id)}>
              {c.label}
            </TypeChip>
          ))}
        </div>

        {/* Neighborhood + budget — collapsible */}
        {filtersOpen && (
          <div className="space-y-2 pt-1 border-t border-white/8">
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Quartier</p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {QUARTIER_CHIPS.map((c) => (
                  <SmallChip key={c.id} active={neighborhood === c.id} onClick={() => setParam("neighborhood", c.id)}>
                    {c.label}
                  </SmallChip>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Budget</p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {BUDGET_CHIPS.map((c) => (
                  <SmallChip key={c.id} active={budget === c.id} onClick={() => setParam("budget", c.id)}>
                    {c.label}
                  </SmallChip>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Results count */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-[#6B7280]">
            {loading ? (
              <span className="inline-block w-24 h-4 bg-white/10 rounded animate-pulse" />
            ) : (
              <>
                <span className="font-bold text-white">{filtered.length}</span>{" "}
                annonce{filtered.length !== 1 ? "s" : ""}
                {hasFilters && (
                  <button onClick={clearFilters} className="ml-2 text-[#F97316] hover:underline text-xs">
                    (voir tout)
                  </button>
                )}
              </>
            )}
          </p>
          {!loading && totalPages > 1 && (
            <p className="text-xs text-white/40">Page {safePage} / {totalPages}</p>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">🏠</p>
            <h3 className="text-lg font-bold text-white mb-2">Aucune annonce trouvée</h3>
            <p className="text-white/50 text-sm mb-6">Essayez d&apos;élargir vos filtres.</p>
            <button
              onClick={clearFilters}
              className="bg-[#F97316] hover:bg-[#EA6C0A] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Voir toutes les annonces
            </button>
          </div>
        ) : (
          <>
            {!hasFilters && <NearbySection properties={allProperties} />}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {pageItems.map((p, i) => (
                <PropertyCard key={p.id} property={p} index={i} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(safePage - 1)}
                  disabled={safePage === 1}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-[#F97316] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.10)" }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {pageNumbers.map((n, idx) => {
                  const prev = pageNumbers[idx - 1];
                  return (
                    <div key={n} className="flex items-center gap-2">
                      {prev && n - prev > 1 && (
                        <span className="text-white/30 text-sm px-1">…</span>
                      )}
                      <button
                        onClick={() => setPage(n)}
                        className={cn(
                          "w-9 h-9 rounded-full text-sm font-semibold transition-colors",
                          n === safePage ? "text-white" : "text-white/50 hover:text-white"
                        )}
                        style={n === safePage
                          ? { background: "rgba(255,255,255,0.20)", border: "1px solid rgba(255,255,255,0.25)" }
                          : { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}
                      >
                        {n}
                      </button>
                    </div>
                  );
                })}
                <button
                  onClick={() => setPage(safePage + 1)}
                  disabled={safePage === totalPages}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-[#F97316] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.10)" }}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function AnnoncesPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      }
    >
      <AnnoncesContent />
    </Suspense>
  );
}
