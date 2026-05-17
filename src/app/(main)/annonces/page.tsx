"use client";
import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, LocateFixed } from "lucide-react";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { NearbySection } from "@/components/ui/NearbySection";
import { VoiceSearchButton } from "@/components/ui/VoiceSearchButton";
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
  { label: "Tous budgets", min: 0, max: Infinity },
  { label: "< 1 000 000", min: 0, max: 1_000_000 },
  { label: "1M–2M", min: 1_000_000, max: 2_000_000 },
  { label: "2M–5M", min: 2_000_000, max: 5_000_000 },
  { label: "> 5M", min: 5_000_000, max: Infinity },
];

function TypeChip({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-none px-4 rounded-full text-sm font-semibold transition-all whitespace-nowrap inline-flex items-center",
        active ? "text-white" : "text-white/50 hover:text-white"
      )}
      style={{
        minHeight: "48px",
        ...(active
          ? { background: "rgba(255,255,255,0.20)", border: "1px solid rgba(255,255,255,0.25)" }
          : { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }),
      }}
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
        "flex-none px-3 rounded-full text-xs font-semibold transition-all whitespace-nowrap inline-flex items-center",
        active ? "text-white" : "text-white/50 hover:text-white"
      )}
      style={{
        minHeight: "48px",
        ...(active
          ? { background: "rgba(255,255,255,0.20)", border: "1px solid rgba(255,255,255,0.25)" }
          : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }),
      }}
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
  const [nearbyCoords, setNearbyCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);

  const neighborhood = searchParams.get("neighborhood") ?? "";
  const type = searchParams.get("type") ?? "";
  const tx = searchParams.get("tx") ?? "";
  const priceMin = Number(searchParams.get("price_min") ?? 0);
  const priceMax = Number(searchParams.get("price_max") ?? Infinity);
  const page = Number(searchParams.get("page") ?? "1");

  function handleVoiceResult(text: string) {
    const lower = text.toLowerCase();
    const QUARTIER_CHIPS_FLAT = QUARTIER_CHIPS.slice(1);
    const match = QUARTIER_CHIPS_FLAT.find((q) => lower.includes(q.label.toLowerCase()));
    if (match) { setParam("neighborhood", match.id); return; }
    const TYPE_FLAT = TYPE_CHIPS.slice(1);
    const typeMatch = TYPE_FLAT.find((t) => lower.includes(t.label.toLowerCase()));
    if (typeMatch) { setParam("type", typeMatch.id); }
  }

  const QUARTIER_COORDS: Record<string, { lat: number; lng: number }> = {
    kipe:       { lat: 9.5370, lng: -13.6773 },
    hamdallaye: { lat: 9.5780, lng: -13.6420 },
    dixinn:     { lat: 9.5140, lng: -13.6890 },
    ratoma:     { lat: 9.5650, lng: -13.6600 },
    taouyah:    { lat: 9.5490, lng: -13.6510 },
    lambanyi:   { lat: 9.5580, lng: -13.6680 },
    sonfonia:   { lat: 9.6100, lng: -13.6200 },
    matam:      { lat: 9.5200, lng: -13.7100 },
    madina:     { lat: 9.5350, lng: -13.6950 },
    kaloum:     { lat: 9.5100, lng: -13.7050 },
    cosa:       { lat: 9.5300, lng: -13.6800 },
  };

  function handleNearby() {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    setGpsMessage(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        setNearbyCoords({ lat: userLat, lng: userLng });
        setGpsLoading(false);

        // Find nearest quartier within 5km
        let nearest: { id: string; dist: number } | null = null;
        for (const [id, coords] of Object.entries(QUARTIER_COORDS)) {
          const dist = haversineKm(userLat, userLng, coords.lat, coords.lng);
          if (!nearest || dist < nearest.dist) nearest = { id, dist };
        }
        if (nearest && nearest.dist <= 5) {
          setParam("neighborhood", nearest.id);
        } else {
          setGpsMessage("Aucun quartier BienLoger à moins de 5 km de vous.");
          setTimeout(() => setGpsMessage(null), 4000);
        }
      },
      () => setGpsLoading(false),
      { timeout: 8000, maximumAge: 60000 }
    );
  }

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

  function setPriceRange(min: number, max: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (min > 0) params.set("price_min", String(min)); else params.delete("price_min");
    if (max < Infinity) params.set("price_max", String(max)); else params.delete("price_max");
    params.delete("page");
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function setPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (p === 1) params.delete("page"); else params.set("page", String(p));
    router.replace(`?${params.toString()}`, { scroll: true });
  }

  const hasPriceFilter = priceMin > 0 || priceMax < Infinity;
  const hasFilters = !!neighborhood || !!type || !!tx || hasPriceFilter;

  function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  const filtered = useMemo(() => {
    let list = allProperties.filter((p) => {
      if (!p.title || p.title.trim().length < 5) return false;
      if (neighborhood && p.neighborhood !== neighborhood) return false;
      if (type && p.type !== type) return false;
      if (tx && p.transaction_type !== tx) return false;
      if (priceMin > 0 && p.price < priceMin) return false;
      if (priceMax < Infinity && p.price > priceMax) return false;
      return true;
    });
    if (nearbyCoords) {
      list = list
        .filter((p) => p.latitude != null && p.longitude != null)
        .sort((a, b) =>
          haversineKm(nearbyCoords.lat, nearbyCoords.lng, a.latitude!, a.longitude!) -
          haversineKm(nearbyCoords.lat, nearbyCoords.lng, b.latitude!, b.longitude!)
        );
    }
    return list;
  }, [allProperties, neighborhood, type, tx, priceMin, priceMax, nearbyCoords]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function clearFilters() { router.replace("/annonces", { scroll: false }); }

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1
  );

  const activeFilterCount = [neighborhood, type, tx, hasPriceFilter ? "price" : ""].filter(Boolean).length;

  return (
    <div className="bg-[#111a14] min-h-screen">
      {/* ── Sticky filter bar ───────────────────────────────────── */}
      <div className="sticky top-16 z-30 -mx-0 px-4 pt-4 pb-3 space-y-3" style={{ background: "rgba(15,15,15,0.97)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        {/* Search pill + filter button */}
        <div className="flex items-center gap-2">
          <div
            className="flex-1 flex items-center gap-3 rounded-full px-4"
            style={{ minHeight: 48, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            <Search className="w-4 h-4 text-white/40 flex-shrink-0" />
            <span className="flex-1 text-sm text-white/40">Rechercher un bien…</span>
            <VoiceSearchButton
              onResult={handleVoiceResult}
              style={{ minHeight: 32, minWidth: 32, borderRadius: 8, background: "transparent", border: "none", color: "rgba(255,255,255,0.40)" }}
            />
          </div>
          <button
            type="button"
            onClick={handleNearby}
            disabled={gpsLoading}
            aria-label="Rechercher les biens près de moi"
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
              nearbyCoords ? "text-[#6ec97a]" : "text-white/50 hover:text-white"
            )}
            style={nearbyCoords
              ? { background: "rgba(110,201,122,0.15)", border: "1px solid rgba(110,201,122,0.35)" }
              : { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}
          >
            {gpsLoading
              ? <span className="w-4 h-4 border-2 border-white/40 border-t-transparent rounded-full animate-spin" />
              : <LocateFixed className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-all flex-shrink-0",
              filtersOpen || activeFilterCount > 0
                ? "text-white"
                : "text-white/50 hover:text-white"
            )}
            style={{
              minHeight: 48,
              ...(filtersOpen || activeFilterCount > 0
                ? { background: "rgba(255,255,255,0.20)", border: "1px solid rgba(255,255,255,0.25)" }
                : { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }),
            }}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="ml-1.5">{activeFilterCount > 0 ? `Filtres (${activeFilterCount})` : "Filtres"}</span>
          </button>
          {hasFilters && (
            <button
              onClick={clearFilters}
              aria-label="Effacer les filtres"
              className="w-12 h-12 rounded-full flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Type chips — always visible */}
        <div className="-mx-4 px-4 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
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
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Transaction</p>
              <div className="-mx-4 px-4 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                {[{ id: "", label: "Toutes" }, { id: "rent", label: "Location" }, { id: "sale", label: "Achat" }].map((c) => (
                  <SmallChip key={c.id} active={tx === c.id} onClick={() => setParam("tx", c.id)}>
                    {c.label}
                  </SmallChip>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Quartier</p>
              <div className="-mx-4 px-4 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                {QUARTIER_CHIPS.map((c) => (
                  <SmallChip key={c.id} active={neighborhood === c.id} onClick={() => setParam("neighborhood", c.id)}>
                    {c.label}
                  </SmallChip>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Budget</p>
              <div className="-mx-4 px-4 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                {BUDGET_CHIPS.map((c) => {
                  const isAll = c.min === 0 && c.max === Infinity;
                  const active = isAll
                    ? !hasPriceFilter
                    : priceMin === c.min && priceMax === c.max;
                  return (
                    <SmallChip key={c.label} active={active} onClick={() => setPriceRange(c.min, c.max)}>
                      {c.label}
                    </SmallChip>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* GPS message */}
        {gpsMessage && (
          <div className="mb-4 rounded-xl px-4 py-3 text-sm font-semibold text-white/70" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}>
            📍 {gpsMessage}
          </div>
        )}
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
                  <button onClick={clearFilters} className="ml-2 text-[#daa84a] hover:underline text-xs">
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
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-[#daa84a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-[#daa84a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
