"use client";
import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { fetchProperties } from "@/lib/properties";
import { cn } from "@/lib/utils";
import type { Property } from "@/types";

const PAGE_SIZE = 12;

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

const TYPE_CHIPS = [
  { id: "", label: "Tous" },
  { id: "apartment", label: "Appartement" },
  { id: "house", label: "Maison" },
  { id: "studio", label: "Studio" },
  { id: "villa", label: "Villa" },
  { id: "room", label: "Chambre" },
  { id: "office", label: "Bureau" },
  { id: "shop", label: "Boutique" },
  { id: "land", label: "Terrain" },
];

const BUDGET_CHIPS = [
  { id: "", label: "Tous budgets", min: 0, max: Infinity },
  { id: "lt1m", label: "< 1 M GNF", min: 0, max: 1_000_000 },
  { id: "1to2m", label: "1–2 M GNF", min: 1_000_000, max: 2_000_000 },
  { id: "2to5m", label: "2–5 M GNF", min: 2_000_000, max: 5_000_000 },
  { id: "gt5m", label: "> 5 M GNF", min: 5_000_000, max: Infinity },
];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-none px-4 py-2 rounded-full text-sm font-semibold border transition-colors whitespace-nowrap",
        active
          ? "bg-[#F97316] text-white border-[#F97316]"
          : "bg-white dark:bg-[#1e2430] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#2a3040] hover:border-[#F97316] hover:text-[#F97316]"
      )}
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
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function setPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (p === 1) {
      params.delete("page");
    } else {
      params.set("page", String(p));
    }
    router.replace(`?${params.toString()}`, { scroll: true });
  }

  const budgetChip = BUDGET_CHIPS.find((b) => b.id === budget) ?? BUDGET_CHIPS[0];

  const filtered = useMemo(() => {
    return allProperties.filter((p) => {
      if (neighborhood && p.neighborhood !== neighborhood) return false;
      if (type && p.type !== type) return false;
      if (budget) {
        if (p.price < budgetChip.min || p.price > budgetChip.max) return false;
      }
      return true;
    });
  }, [allProperties, neighborhood, type, budget, budgetChip]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const hasFilters = !!neighborhood || !!type || !!budget;

  function clearFilters() {
    router.replace("/annonces", { scroll: false });
  }

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Filter chips */}
      <div className="sticky top-16 z-30 bg-white/95 dark:bg-[#111418]/95 backdrop-blur -mx-4 px-4 py-3 border-b border-slate-100 dark:border-[#2a3040] space-y-2 mb-6">
        {/* Search hint row */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-slate-50 dark:bg-[#1e2430] border border-slate-200 dark:border-[#2a3040] rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="text-sm text-slate-400">Filtrer les annonces…</span>
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-red-500 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Effacer
            </button>
          )}
        </div>

        {/* Quartier row */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-0.5">Quartier</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {QUARTIER_CHIPS.map((c) => (
              <Chip key={c.id} active={neighborhood === c.id} onClick={() => setParam("neighborhood", c.id)}>
                {c.label}
              </Chip>
            ))}
          </div>
        </div>

        {/* Type row */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-0.5">Type</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {TYPE_CHIPS.map((c) => (
              <Chip key={c.id} active={type === c.id} onClick={() => setParam("type", c.id)}>
                {c.label}
              </Chip>
            ))}
          </div>
        </div>

        {/* Budget row */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-0.5">Budget</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {BUDGET_CHIPS.map((c) => (
              <Chip key={c.id} active={budget === c.id} onClick={() => setParam("budget", c.id)}>
                {c.label}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {loading ? (
            <span className="inline-block w-24 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          ) : (
            <>
              <span className="font-bold text-slate-900 dark:text-white">{filtered.length}</span>{" "}
              annonce{filtered.length !== 1 ? "s" : ""} trouvée{filtered.length !== 1 ? "s" : ""}
              {hasFilters && (
                <button onClick={clearFilters} className="ml-2 text-[#F97316] hover:underline text-xs">
                  (voir tout)
                </button>
              )}
            </>
          )}
        </p>
        {!loading && totalPages > 1 && (
          <p className="text-xs text-slate-400">
            Page {safePage} / {totalPages}
          </p>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🏠</div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Aucune annonce trouvée
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            Essayez d&apos;élargir vos filtres pour voir plus de résultats.
          </p>
          <button
            onClick={clearFilters}
            className="bg-[#F97316] hover:bg-[#EA6C0A] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Voir toutes les annonces
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pageItems.map((p, i) => (
              <PropertyCard key={p.id} property={p} index={i} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(safePage - 1)}
                disabled={safePage === 1}
                className="w-9 h-9 rounded-xl border border-slate-200 dark:border-[#2a3040] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:border-[#F97316] hover:text-[#F97316] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {pageNumbers.map((n, idx) => {
                const prev = pageNumbers[idx - 1];
                return (
                  <div key={n} className="flex items-center gap-2">
                    {prev && n - prev > 1 && (
                      <span className="text-slate-300 dark:text-slate-600 text-sm px-1">…</span>
                    )}
                    <button
                      onClick={() => setPage(n)}
                      className={cn(
                        "w-9 h-9 rounded-xl text-sm font-semibold border transition-colors",
                        n === safePage
                          ? "bg-[#F97316] text-white border-[#F97316]"
                          : "border-slate-200 dark:border-[#2a3040] text-slate-600 dark:text-slate-300 hover:border-[#F97316] hover:text-[#F97316]"
                      )}
                    >
                      {n}
                    </button>
                  </div>
                );
              })}

              <button
                onClick={() => setPage(safePage + 1)}
                disabled={safePage === totalPages}
                className="w-9 h-9 rounded-xl border border-slate-200 dark:border-[#2a3040] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:border-[#F97316] hover:text-[#F97316] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AnnoncesPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      }
    >
      <AnnoncesContent />
    </Suspense>
  );
}
