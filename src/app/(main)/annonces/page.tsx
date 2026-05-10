"use client";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Search, SlidersHorizontal, X, MapPin, ChevronDown, Grid3x3, List, Map, Clock, Mic, MicOff, Link2 } from "lucide-react";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { MOCK_PROPERTIES } from "@/data/mock-properties";
import { fetchProperties } from "@/lib/properties";
import { POPULAR_NEIGHBORHOODS, NEIGHBORHOOD_COORDINATES } from "@/data/neighborhoods";
import { PROPERTY_TYPES } from "@/lib/constants";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Suspense } from "react";
import { PropertyMapWrapper } from "@/components/map/PropertyMapWrapper";
import { toast } from "@/lib/toast";
import { useAppStore } from "@/lib/store";
import type { Property } from "@/types";

const SEARCH_HISTORY_KEY = "guimmo-searches";
const MAX_HISTORY = 5;
const PAGE_SIZE = 9;
const SAVED_SEARCHES_KEY = "guimmo-saved-searches";

function getSavedSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveSearch(query: string) {
  const prev = getSavedSearches().filter((s) => s !== query);
  const next = [query, ...prev].slice(0, MAX_HISTORY);
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
}

function removeSearch(query: string) {
  const next = getSavedSearches().filter((s) => s !== query);
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read all params from URL on init
  const initSortBy = (searchParams.get("sortBy") ?? "recent") as "recent" | "price_asc" | "price_desc" | "popular";
  const initMinPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : 0;
  const initMaxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : 10_000_000;

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [neighborhood, setNeighborhood] = useState(searchParams.get("neighborhood") ?? "");
  const [type, setType] = useState(searchParams.get("type") ?? "");
  const [transactionType, setTransactionType] = useState(searchParams.get("transactionType") ?? "");
  const [furnished, setFurnished] = useState<boolean | null>(null);
  const [availableNow, setAvailableNow] = useState(false);
  const [minPrice, setMinPrice] = useState(initMinPrice);
  const [maxPrice, setMaxPrice] = useState(initMaxPrice);
  const [sortBy, setSortBy] = useState<"recent" | "price_asc" | "price_desc" | "popular">(initSortBy);
  const [view, setView] = useState<"grid" | "list" | "map">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [listening, setListening] = useState(false);
  const [radiusKm, setRadiusKm] = useState(0);

  // Pagination
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Skeleton loading state
  const [loading, setLoading] = useState(true);
  const _hasHydrated = useAppStore((s) => s._hasHydrated);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // User-published listings from store
  const publishedListings = useAppStore((s) => s.publishedListings);

  // Supabase properties (replaces mock when real data exists)
  const [dbProperties, setDbProperties] = useState<Property[]>(MOCK_PROPERTIES);
  useEffect(() => {
    fetchProperties().then(setDbProperties);
  }, []);

  const allProperties: Property[] = [
    ...(publishedListings as unknown as Property[]),
    ...dbProperties,
  ];

  // Search history
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const historyDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchHistory(getSavedSearches());
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        historyDropdownRef.current &&
        !historyDropdownRef.current.contains(e.target as Node) &&
        !searchInputRef.current?.contains(e.target as Node)
      ) {
        setShowHistory(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Bidirectional URL sync — update URL whenever key filter state changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (neighborhood) params.set("neighborhood", neighborhood);
    if (type) params.set("type", type);
    if (transactionType) params.set("transactionType", transactionType);
    if (sortBy !== "recent") params.set("sortBy", sortBy);
    if (minPrice > 0) params.set("minPrice", String(minPrice));
    if (maxPrice < 10_000_000) params.set("maxPrice", String(maxPrice));

    const search = params.toString();
    router.replace(search ? `?${search}` : "?", { scroll: false });
  }, [query, neighborhood, type, transactionType, sortBy, minPrice, maxPrice, router]);

  // Reset pagination whenever filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, neighborhood, type, transactionType, furnished, availableNow, minPrice, maxPrice, sortBy, publishedListings]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setShowHistory(val === "");
  };

  const handleQueryBlur = () => {
    if (query.trim()) {
      saveSearch(query.trim());
      setSearchHistory(getSavedSearches());
    }
  };

  const handleHistoryClick = useCallback((item: string) => {
    setQuery(item);
    setShowHistory(false);
    searchInputRef.current?.focus();
  }, []);

  const handleHistoryRemove = useCallback((item: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeSearch(item);
    setSearchHistory(getSavedSearches());
  }, []);

  function startVoiceSearch() {
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition
      ?? (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast("Recherche vocale non supportée sur ce navigateur", "warning");
      return;
    }
    const recognition = new (SpeechRecognition as new () => {
      lang: string;
      onresult: (e: { results: { transcript: string }[][] }) => void;
      onerror: () => void;
      onend: () => void;
      start: () => void;
    })();
    recognition.lang = "fr-FR";
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setQuery(transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    setListening(true);
    recognition.start();
  }

  const filtered = useMemo(() => {
    let results = [...allProperties];

    if (query) {
      const q = query.toLowerCase();
      results = results.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.neighborhood.includes(q)
      );
    }
    if (neighborhood) results = results.filter((p) => p.neighborhood === neighborhood);
    if (type) results = results.filter((p) => p.type === type);
    if (transactionType) results = results.filter((p) => p.transactionType === transactionType);
    if (furnished !== null) results = results.filter((p) => p.furnished === furnished);
    if (availableNow) results = results.filter((p) => p.availableNow);

    results = results.filter((p) => p.price >= minPrice && p.price <= maxPrice);
    results = results.filter((p) => p.status === "active");

    if (radiusKm > 0 && neighborhood) {
      const center = NEIGHBORHOOD_COORDINATES[neighborhood];
      if (center) {
        results = results.filter((p) => {
          const coords = NEIGHBORHOOD_COORDINATES[p.neighborhood];
          if (!coords) return true; // keep if no coords available
          return haversineKm(center[0], center[1], coords[0], coords[1]) <= radiusKm;
        });
      }
    }

    results.sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      if (sortBy === "popular") return b.views - a.views;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return results;
  }, [query, neighborhood, type, transactionType, furnished, availableNow, minPrice, maxPrice, sortBy, radiusKm, publishedListings]);

  // Sliced results for pagination
  const visibleItems = filtered.slice(0, visibleCount);

  const hasActiveFilters =
    !!neighborhood || !!type || !!transactionType || furnished !== null || availableNow ||
    minPrice > 0 || maxPrice < 10_000_000 || radiusKm > 0;

  function clearFilters() {
    setNeighborhood("");
    setType("");
    setTransactionType("");
    setFurnished(null);
    setAvailableNow(false);
    setMinPrice(0);
    setMaxPrice(10_000_000);
    setRadiusKm(0);
  }

  function handleSaveSearch() {
    const parts: string[] = [];
    if (query) parts.push(`Recherche: ${query}`);
    if (type) parts.push(`Type: ${type}`);
    if (neighborhood) parts.push(`Quartier: ${neighborhood}`);
    if (transactionType) parts.push(transactionType === "rent" ? "Location" : "Vente");
    const label = parts.length > 0 ? parts.join(", ") : "Recherche sauvegardée";

    try {
      const existing = JSON.parse(localStorage.getItem(SAVED_SEARCHES_KEY) ?? "[]") as Array<{
        label: string;
        url: string;
        savedAt: number;
      }>;
      const entry = { label, url: window.location.href, savedAt: Date.now() };
      localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify([entry, ...existing].slice(0, 20)));
    } catch {
      // ignore storage errors
    }
    toast("Recherche sauvegardée !", "success");
  }

  const fmt = (v: number) =>
    new Intl.NumberFormat("fr-GN", { style: "currency", currency: "GNF", maximumFractionDigits: 0 }).format(v);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Search bar sticky */}
      <div className="sticky top-16 z-30 bg-white/90 dark:bg-[#111418]/90 backdrop-blur py-3 -mx-4 px-4 mb-4 border-b border-slate-100 dark:border-[#2a3040]">
        <div className="flex gap-2">
          {/* Search input with history dropdown */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Rechercher (quartier, type...)"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => { if (!query) setShowHistory(true); }}
              onBlur={handleQueryBlur}
              className="w-full bg-slate-50 dark:bg-[#1e2430] border border-slate-200 dark:border-[#2a3040] rounded-xl pl-9 pr-16 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent dark:text-white placeholder:text-slate-400"
            />
            <button
              onClick={startVoiceSearch}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 transition-colors",
                query ? "right-8" : "right-3",
                listening ? "text-red-500 animate-pulse" : "text-slate-400 hover:text-[#F97316]"
              )}
              title="Recherche vocale"
            >
              {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            {query && (
              <button
                onClick={() => { setQuery(""); setShowHistory(true); }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}

            {/* History dropdown */}
            {showHistory && searchHistory.length > 0 && (
              <div
                ref={historyDropdownRef}
                className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1e2430] rounded-xl shadow-lg border border-slate-100 dark:border-[#2a3040] z-50 overflow-hidden"
              >
                {searchHistory.map((item) => (
                  <div
                    key={item}
                    onMouseDown={() => handleHistoryClick(item)}
                    className="flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-[#2a3040] cursor-pointer group"
                  >
                    <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="flex-1 text-sm text-slate-700 dark:text-slate-300 truncate">{item}</span>
                    <button
                      onMouseDown={(e) => handleHistoryRemove(item, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                    >
                      <X className="w-3 h-3 text-slate-400 hover:text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors",
              showFilters || hasActiveFilters
                ? "bg-[#F97316] text-white border-[#F97316]"
                : "bg-slate-50 dark:bg-[#1e2430] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#2a3040]"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtres
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-white rounded-full" />
            )}
          </button>

          {/* View toggle: grid / list / map */}
          <div className="hidden md:flex items-center gap-1 bg-slate-50 dark:bg-[#1e2430] border border-slate-200 dark:border-[#2a3040] rounded-xl p-1">
            <button
              onClick={() => setView("grid")}
              className={cn("p-1.5 rounded-lg transition-colors", view === "grid" ? "bg-white dark:bg-[#2a3040] text-[#F97316] shadow-sm" : "text-slate-400")}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn("p-1.5 rounded-lg transition-colors", view === "list" ? "bg-white dark:bg-[#2a3040] text-[#F97316] shadow-sm" : "text-slate-400")}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("map")}
              className={cn(
                "flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors text-xs font-semibold",
                view === "map" ? "bg-white dark:bg-[#2a3040] text-[#F97316] shadow-sm" : "text-slate-400"
              )}
            >
              <Map className="w-4 h-4" />
              <span>Carte</span>
            </button>
          </div>
        </div>

        {/* Quick toggles — always visible */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => setAvailableNow(!availableNow)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors",
              availableNow
                ? "bg-[#F97316] text-white border-[#F97316]"
                : "bg-slate-50 dark:bg-[#1e2430] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#2a3040] hover:border-[#F97316] hover:text-[#F97316]"
            )}
          >
            <span className={cn("w-2 h-2 rounded-full", availableNow ? "bg-white" : "bg-green-400")} />
            Disponible maintenant
          </button>
          <button
            onClick={() => setFurnished(furnished === true ? null : true)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors",
              furnished === true
                ? "bg-[#F97316] text-white border-[#F97316]"
                : "bg-slate-50 dark:bg-[#1e2430] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#2a3040] hover:border-[#F97316] hover:text-[#F97316]"
            )}
          >
            Meublé
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mt-3 p-4 bg-white dark:bg-[#1e2430] rounded-2xl border border-slate-100 dark:border-[#2a3040] space-y-4 animate-[slideDown_0.2s_ease-out]">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {/* Neighborhood */}
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Quartier</label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <select value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className="w-full appearance-none bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] rounded-xl pl-8 pr-6 py-2 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F97316]">
                    <option value="">Tous</option>
                    {POPULAR_NEIGHBORHOODS.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Type</label>
                <div className="relative">
                  <select value={type} onChange={(e) => setType(e.target.value)} className="w-full appearance-none bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] rounded-xl px-3 pr-6 py-2 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F97316]">
                    <option value="">Tous</option>
                    {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Transaction */}
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Transaction</label>
                <div className="relative">
                  <select value={transactionType} onChange={(e) => setTransactionType(e.target.value)} className="w-full appearance-none bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] rounded-xl px-3 pr-6 py-2 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F97316]">
                    <option value="">Tout</option>
                    <option value="rent">Location</option>
                    <option value="sale">Vente</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Trier par</label>
                <div className="relative">
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="w-full appearance-none bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] rounded-xl px-3 pr-6 py-2 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F97316]">
                    <option value="recent">Plus récent</option>
                    <option value="price_asc">Prix croissant</option>
                    <option value="price_desc">Prix décroissant</option>
                    <option value="popular">Plus populaire</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Radius */}
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Rayon</label>
                <div className="relative">
                  <select
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    className="w-full appearance-none bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] rounded-xl px-3 pr-6 py-2 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                  >
                    <option value={0}>Tout Conakry</option>
                    <option value={2}>2 km</option>
                    <option value={5}>5 km</option>
                    <option value={10}>10 km</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Price range sliders */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 block">Budget</label>
              <div className="flex gap-6">
                {/* Min price */}
                <div className="flex-1">
                  <p className="text-xs font-semibold mb-1.5" style={{ color: "#F97316" }}>{fmt(minPrice)}</p>
                  <input
                    type="range"
                    min={0}
                    max={10_000_000}
                    step={100_000}
                    value={minPrice}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setMinPrice(Math.min(v, maxPrice - 100_000));
                    }}
                    style={{ accentColor: "#F97316" }}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-400 mt-0.5">Min</p>
                </div>
                {/* Max price */}
                <div className="flex-1">
                  <p className="text-xs font-semibold mb-1.5" style={{ color: "#F97316" }}>{fmt(maxPrice)}</p>
                  <input
                    type="range"
                    min={0}
                    max={10_000_000}
                    step={100_000}
                    value={maxPrice}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setMaxPrice(Math.max(v, minPrice + 100_000));
                    }}
                    style={{ accentColor: "#F97316" }}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-400 mt-0.5">Max</p>
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setFurnished(furnished === true ? null : true)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border",
                  furnished === true
                    ? "bg-[#F97316] text-white border-[#F97316]"
                    : "bg-slate-50 dark:bg-[#151922] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#2a3040]"
                )}
              >
                Meublé uniquement
              </button>
              <button
                onClick={() => setAvailableNow(!availableNow)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border",
                  availableNow
                    ? "bg-[#F97316] text-white border-[#F97316]"
                    : "bg-slate-50 dark:bg-[#151922] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#2a3040]"
                )}
              >
                Disponible maintenant
              </button>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-1">
                  <X className="w-3 h-3" /> Effacer tout
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mb-3">
          {type && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 dark:bg-orange-900/20 text-[#F97316] border border-orange-200 dark:border-orange-800">
              {PROPERTY_TYPES.find((t) => t.value === type)?.label ?? type}
              <button onClick={() => setType("")} className="ml-0.5 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
            </span>
          )}
          {neighborhood && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 dark:bg-orange-900/20 text-[#F97316] border border-orange-200 dark:border-orange-800">
              <MapPin className="w-3 h-3" />
              {POPULAR_NEIGHBORHOODS.find((n) => n.id === neighborhood)?.name ?? neighborhood}
              <button onClick={() => setNeighborhood("")} className="ml-0.5 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
            </span>
          )}
          {transactionType && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 dark:bg-orange-900/20 text-[#F97316] border border-orange-200 dark:border-orange-800">
              {transactionType === "rent" ? "Location" : "Vente"}
              <button onClick={() => setTransactionType("")} className="ml-0.5 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
            </span>
          )}
          {minPrice > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 dark:bg-orange-900/20 text-[#F97316] border border-orange-200 dark:border-orange-800">
              Min {fmt(minPrice)}
              <button onClick={() => setMinPrice(0)} className="ml-0.5 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
            </span>
          )}
          {maxPrice < 10_000_000 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 dark:bg-orange-900/20 text-[#F97316] border border-orange-200 dark:border-orange-800">
              Max {fmt(maxPrice)}
              <button onClick={() => setMaxPrice(10_000_000)} className="ml-0.5 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
            </span>
          )}
          {furnished === true && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 dark:bg-orange-900/20 text-[#F97316] border border-orange-200 dark:border-orange-800">
              Meublé
              <button onClick={() => setFurnished(null)} className="ml-0.5 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
            </span>
          )}
          {availableNow && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 dark:bg-orange-900/20 text-[#F97316] border border-orange-200 dark:border-orange-800">
              Disponible maintenant
              <button onClick={() => setAvailableNow(false)} className="ml-0.5 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
            </span>
          )}
        </div>
      )}

      {/* Results count + save search + copy URL + mobile map toggle */}
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            <span className="font-bold text-slate-900 dark:text-white">{filtered.length}</span> annonce{filtered.length !== 1 ? "s" : ""} trouvée{filtered.length !== 1 ? "s" : ""}
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleSaveSearch}
              className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-[#1e2430] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#2a3040] hover:border-[#F97316] hover:text-[#F97316] transition-colors"
            >
              💾 Sauvegarder
            </button>
          )}
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href).then(() => {
                toast("Lien copié !", "success");
              }).catch(() => {
                toast("Impossible de copier le lien", "warning");
              });
            }}
            className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-[#1e2430] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#2a3040] hover:border-[#F97316] hover:text-[#F97316] transition-colors"
            title="Copier le lien de recherche"
          >
            <Link2 className="w-3 h-3" /> Copier la recherche
          </button>
        </div>
        <button
          onClick={() => setView(view === "map" ? "grid" : "map")}
          className={cn(
            "md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors",
            view === "map"
              ? "bg-[#F97316] text-white border-[#F97316]"
              : "bg-slate-50 dark:bg-[#1e2430] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#2a3040]"
          )}
        >
          <Map className="w-3.5 h-3.5" />
          {view === "map" ? "Liste" : "Carte"}
        </button>
      </div>

      {/* Results */}
      {(loading || !_hasHydrated) ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : view === "map" ? (
        <PropertyMapWrapper properties={filtered} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Aucune annonce trouvée"
          description="Essayez de modifier vos filtres pour voir plus de résultats."
          action={{ label: "Effacer les filtres", href: "/annonces" }}
        />
      ) : (
        <>
          <div className={cn(
            "gap-4",
            view === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              : "grid grid-cols-1"
          )}>
            {visibleItems.map((p, i) => (
              <PropertyCard key={p.id} property={p} variant={view === "list" ? "horizontal" : "default"} index={i} />
            ))}
          </div>

          {/* Pagination footer */}
          <div className="mt-8 flex flex-col items-center gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Affichage de{" "}
              <span className="font-semibold text-slate-900 dark:text-white">{visibleItems.length}</span>
              {" "}sur{" "}
              <span className="font-semibold text-slate-900 dark:text-white">{filtered.length}</span>
              {" "}annonce{filtered.length !== 1 ? "s" : ""}
            </p>
            {visibleCount < filtered.length && (
              <button
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="bg-[#F97316] hover:bg-[#EA6C0A] active:bg-[#D96309] text-white font-semibold px-8 py-3 rounded-xl transition-colors shadow-sm"
              >
                Voir {Math.min(PAGE_SIZE, filtered.length - visibleCount)} annonce{Math.min(PAGE_SIZE, filtered.length - visibleCount) !== 1 ? "s" : ""} de plus
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function AnnoncesPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    }>
      <PullToRefresh onRefresh={() => window.location.reload()}>
        <SearchPageContent />
      </PullToRefresh>
    </Suspense>
  );
}
