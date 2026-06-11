"use client";
import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  LocateFixed,
  Map,
  List,
  MapPin,
  Banknote,
  Home,
  Building2,
  DoorOpen,
  CalendarClock,
  CheckCircle2,
  MessageCircle,
  Zap,
  Droplets,
  Sofa,
  Car,
  Snowflake,
} from "lucide-react";
import dynamic from "next/dynamic";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { NearbySection } from "@/components/ui/NearbySection";
import { VoiceSearchButton } from "@/components/ui/VoiceSearchButton";
import { fetchProperties } from "@/lib/properties";
import { SaveSearchButton } from "@/components/SaveSearchButton";
import { getAvailabilityStatus } from "@/lib/property-signals";
import type { Property } from "@/types";

// Dynamically load map (no SSR — Leaflet requires window)
const AnnoncesMap = dynamic(
  () => import("@/components/map/AnnoncesMap"),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: "calc(100vh - 180px)", background: "#111820", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "var(--text-primary-faint)", fontSize: 14 }}>Chargement de la carte…</span>
      </div>
    ),
  }
);

// Adapt PAGE_SIZE for low-bandwidth mode
function getPageSize() {
  if (typeof localStorage !== "undefined" && localStorage.getItem("logerbien_low_bandwidth") === "1") return 6;
  return 12;
}

const TYPE_CHIPS = [
  { id: "", label: "Tous", Icon: Home },
  { id: "apartment", label: "Appart.", Icon: Building2 },
  { id: "house", label: "Maison", Icon: Home },
  { id: "room", label: "Chambre", Icon: DoorOpen },
  { id: "studio", label: "Studio", Icon: Sofa },
  { id: "villa", label: "Villa", Icon: Home },
  { id: "office", label: "Bureau", Icon: Building2 },
  { id: "land", label: "Terrain", Icon: MapPin },
];

const QUARTIER_CHIPS = [
  { id: "", label: "Tous" },
  { id: "kaloum", label: "Kaloum" },
  { id: "dixinn", label: "Dixinn" },
  { id: "matam", label: "Matam" },
  { id: "ratoma", label: "Ratoma" },
  { id: "matoto", label: "Matoto" },
];

const BUDGET_CHIPS = [
  { label: "Tous", min: 0, max: Infinity },
  { label: "< 1M", min: 0, max: 1_000_000 },
  { label: "1M-2M", min: 1_000_000, max: 2_000_000 },
  { label: "2M-5M", min: 2_000_000, max: 5_000_000 },
  { label: "> 5M", min: 5_000_000, max: Infinity },
];

const AMENITY_GROUPS = [
  {
    label: "Electricite",
    items: [
      { key: "has_edg", Icon: Zap, label: "EDG" },
      { key: "has_generator", Icon: Zap, label: "Groupe" },
      { key: "has_solar", Icon: Zap, label: "Solaire" },
    ],
  },
  {
    label: "Eau",
    items: [
      { key: "has_tap_water", Icon: Droplets, label: "Robinet" },
      { key: "has_borehole", Icon: Droplets, label: "Forage" },
      { key: "has_running_water", Icon: Droplets, label: "Courante" },
    ],
  },
  {
    label: "Confort",
    items: [
      { key: "has_ac", Icon: Snowflake, label: "Clim" },
      { key: "is_furnished", Icon: Sofa, label: "Meuble" },
      { key: "has_parking", Icon: Car, label: "Parking" },
      { key: "has_pool", Icon: Droplets, label: "Piscine" },
      { key: "has_security", Icon: CheckCircle2, label: "Gardien" },
    ],
  },
] as const;

type AmenityKey =
  | "has_edg" | "has_generator" | "has_solar"
  | "has_tap_water" | "has_borehole" | "has_running_water"
  | "has_ac" | "is_furnished" | "has_parking" | "has_pool" | "has_security";

function VisualChip({ active, onClick, icon, label, compact = false }: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl font-black transition-all inline-flex items-center justify-center gap-2 text-center"
      style={{
        minHeight: compact ? 44 : 56,
        padding: compact ? "9px 12px" : "12px 14px",
        fontSize: compact ? 12 : 13,
        lineHeight: 1.1,
        ...(active
          ? {
              background: "var(--accent-gold)",
              border: "2px solid var(--accent-gold)",
              color: "#17120a",
              boxShadow: "0 10px 24px rgba(193,139,28,0.22)",
            }
          : {
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }),
      }}
    >
      <span className="shrink-0">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function FilterGroup({ title, icon, children }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
        {icon}
        <span>{title}</span>
      </div>
      {children}
    </section>
  );
}

function AmenityChip({ active, onClick, Icon, label }: {
  active: boolean;
  onClick: () => void;
  Icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "10px 14px",
        borderRadius: 16,
        border: active ? "2px solid var(--accent-gold)" : "1px solid var(--border)",
        background: active ? "var(--accent-gold)" : "var(--bg-secondary)",
        color: active ? "#17120a" : "var(--text-primary)",
        fontSize: 13,
        fontWeight: 900,
        cursor: "pointer",
        minHeight: 46,
        letterSpacing: 0,
        textTransform: "none",
        transition: "all 0.15s ease",
      }}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
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
  const [amenities, setAmenities] = useState<Set<AmenityKey>>(new Set());
  const [mapView, setMapView] = useState(false);
  const [pageSize] = useState(getPageSize);
  const [nowForFilters] = useState(() => Date.now());

  const neighborhood = searchParams.get("neighborhood") ?? "";
  const type = searchParams.get("type") ?? "";
  const tx = searchParams.get("tx") ?? "";
  const priceMin = Number(searchParams.get("price_min") ?? 0);
  const priceMax = Number(searchParams.get("price_max") ?? Infinity);
  const surfaceMin = Number(searchParams.get("surface_min") ?? 0);
  const furnished = searchParams.get("furnished") === "1";
  const availability = searchParams.get("availability") ?? "";
  const noAdvance = searchParams.get("no_advance") === "1";
  const whatsappDirect = searchParams.get("whatsapp") === "1";
  const sortOrder = (searchParams.get("sort") ?? "default") as "default" | "price_asc" | "price_desc" | "newest";
  const page = Number(searchParams.get("page") ?? "1");

  // Local state for price inputs (typed values before committing)
  const [priceMinInput, setPriceMinInput] = useState(priceMin > 0 ? String(priceMin) : "");
  const [priceMaxInput, setPriceMaxInput] = useState(priceMax < Infinity ? String(priceMax) : "");
  const [surfaceMinInput, setSurfaceMinInput] = useState(surfaceMin > 0 ? String(surfaceMin) : "");

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

        let nearest: { id: string; dist: number } | null = null;
        for (const [id, coords] of Object.entries(QUARTIER_COORDS)) {
          const dist = haversineKm(userLat, userLng, coords.lat, coords.lng);
          if (!nearest || dist < nearest.dist) nearest = { id, dist };
        }
        if (nearest && nearest.dist <= 5) {
          setParam("neighborhood", nearest.id);
        } else {
          setGpsMessage("Aucun quartier LogerBien à moins de 5 km de vous.");
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

  function toggleAmenity(key: AmenityKey) {
    setAmenities((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const diaspora = searchParams.get("diaspora") === "1";
  const recentOnly = searchParams.get("recent") === "1";
  const hasPriceFilter = priceMin > 0 || priceMax < Infinity;
  const hasFilters = !!neighborhood || !!type || !!tx || hasPriceFilter || diaspora || amenities.size > 0 || surfaceMin > 0 || furnished || sortOrder !== "default" || recentOnly || !!availability || noAdvance || whatsappDirect;

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
      if (diaspora && !p.is_diaspora) return false;
      if (surfaceMin > 0 && (p.surface ?? 0) < surfaceMin) return false;
      if (furnished && !p.is_furnished && !p.furnished) return false;
      if (availability === "now" && getAvailabilityStatus(p) !== "available_now") return false;
      if (availability === "soon" && getAvailabilityStatus(p) !== "available_soon") return false;
      if (noAdvance && p.advance_required) return false;
      if (whatsappDirect && !p.contact_phone) return false;
      if (recentOnly) {
        const age = nowForFilters - new Date(p.created_at ?? 0).getTime();
        if (age > 7 * 24 * 60 * 60 * 1000) return false;
      }
      // Amenity filters
      for (const key of amenities) {
        if (!p[key]) return false;
      }
      return true;
    });
    // Sort
    if (nearbyCoords) {
      list = list
        .filter((p) => p.latitude != null && p.longitude != null)
        .sort((a, b) =>
          haversineKm(nearbyCoords.lat, nearbyCoords.lng, a.latitude!, a.longitude!) -
          haversineKm(nearbyCoords.lat, nearbyCoords.lng, b.latitude!, b.longitude!)
        );
    } else if (sortOrder === "price_asc") {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortOrder === "price_desc") {
      list = [...list].sort((a, b) => b.price - a.price);
    } else if (sortOrder === "newest") {
      list = [...list].sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());
    }
    return list;
  }, [allProperties, neighborhood, type, tx, priceMin, priceMax, nearbyCoords, amenities, surfaceMin, furnished, sortOrder, recentOnly, availability, noAdvance, whatsappDirect, nowForFilters, diaspora]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  function clearFilters() {
    setAmenities(new Set());
    setPriceMinInput("");
    setPriceMaxInput("");
    setSurfaceMinInput("");
    router.replace("/annonces", { scroll: false });
  }

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1
  );

  const activeFilterCount = [
    neighborhood, type, tx,
    hasPriceFilter ? "price" : "",
    diaspora ? "diaspora" : "",
    amenities.size > 0 ? "amenities" : "",
    surfaceMin > 0 ? "surface" : "",
    furnished ? "furnished" : "",
    availability ? "availability" : "",
    noAdvance ? "advance" : "",
    whatsappDirect ? "whatsapp" : "",
    sortOrder !== "default" ? "sort" : "",
    recentOnly ? "recent" : "",
  ].filter(Boolean).length;

  return (
    <div className="bg-[var(--bg-primary)] min-h-screen">
      <div
        className="sticky top-16 z-30 px-4 pt-3 pb-3 space-y-3"
        style={{
          background: "var(--nav-bg)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="mx-auto max-w-7xl space-y-3">
          <div className="flex items-center gap-2">
            <div
              className="flex-1 flex items-center gap-3 rounded-2xl px-4"
              style={{ minHeight: 52, background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <Search className="w-5 h-5 text-[var(--accent-gold)] flex-shrink-0" />
              <span className="flex-1 text-sm font-bold text-[var(--text-primary)]">Chercher un logement</span>
              <VoiceSearchButton
                onResult={handleVoiceResult}
                style={{ minHeight: 34, minWidth: 34, borderRadius: 10, background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              />
            </div>

            <button
              type="button"
              onClick={handleNearby}
              disabled={gpsLoading}
              aria-label="Biens pres de moi"
              className="w-13 h-13 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all"
              style={nearbyCoords
                ? { width: 52, height: 52, background: "var(--accent-gold)", border: "1px solid var(--accent-gold)", color: "#17120a" }
                : { width: 52, height: 52, background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            >
              {gpsLoading
                ? <span className="w-4 h-4 border-2 border-[var(--text-muted)] border-t-transparent rounded-full animate-spin" />
                : <LocateFixed className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={() => setMapView(!mapView)}
              className="rounded-2xl flex items-center justify-center flex-shrink-0 transition-all"
              style={mapView
                ? { width: 52, height: 52, background: "var(--accent-gold)", border: "1px solid var(--accent-gold)", color: "#17120a" }
                : { width: 52, height: 52, background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              title={mapView ? "Vue liste" : "Vue carte"}
            >
              {mapView ? <List className="w-5 h-5" /> : <Map className="w-5 h-5" />}
            </button>
          </div>

          <div className="md:hidden space-y-2">
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {QUARTIER_CHIPS.slice(0, 5).map((c) => (
                <VisualChip key={c.id} active={neighborhood === c.id} onClick={() => setParam("neighborhood", c.id)} icon={<MapPin className="h-4 w-4" />} label={c.label} compact />
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {TYPE_CHIPS.slice(0, 5).map((c) => (
                <VisualChip key={c.id} active={type === c.id} onClick={() => setParam("type", c.id)} icon={<c.Icon className="h-4 w-4" />} label={c.label} compact />
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {BUDGET_CHIPS.map((c) => {
                const isAll = c.min === 0 && c.max === Infinity;
                const active = isAll ? !hasPriceFilter : priceMin === c.min && priceMax === c.max;
                return <VisualChip key={c.label} active={active} onClick={() => setPriceRange(c.min, c.max)} icon={<Banknote className="h-4 w-4" />} label={c.label} compact />;
              })}
              <VisualChip active={availability === "now"} onClick={() => setParam("availability", availability === "now" ? "" : "now")} icon={<CheckCircle2 className="h-4 w-4" />} label="Dispo" compact />
              <VisualChip active={recentOnly} onClick={() => setParam("recent", recentOnly ? "" : "1")} icon={<CalendarClock className="h-4 w-4" />} label="Recent" compact />
            </div>
          </div>

          <div className="hidden md:grid gap-3 lg:grid-cols-4">
            <FilterGroup title="Commune" icon={<MapPin className="h-4 w-4" />}>
              <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-2 gap-2">
                {QUARTIER_CHIPS.slice(0, 5).map((c) => (
                  <VisualChip key={c.id} active={neighborhood === c.id} onClick={() => setParam("neighborhood", c.id)} icon={<MapPin className="h-4 w-4" />} label={c.label} compact />
                ))}
              </div>
            </FilterGroup>

            <FilterGroup title="Budget" icon={<Banknote className="h-4 w-4" />}>
              <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-2 gap-2">
                {BUDGET_CHIPS.map((c) => {
                  const isAll = c.min === 0 && c.max === Infinity;
                  const active = isAll ? !hasPriceFilter : priceMin === c.min && priceMax === c.max;
                  return <VisualChip key={c.label} active={active} onClick={() => setPriceRange(c.min, c.max)} icon={<Banknote className="h-4 w-4" />} label={c.label} compact />;
                })}
              </div>
            </FilterGroup>

            <FilterGroup title="Type" icon={<Home className="h-4 w-4" />}>
              <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-2 gap-2">
                {TYPE_CHIPS.slice(0, 5).map((c) => (
                  <VisualChip key={c.id} active={type === c.id} onClick={() => setParam("type", c.id)} icon={<c.Icon className="h-4 w-4" />} label={c.label} compact />
                ))}
              </div>
            </FilterGroup>

            <FilterGroup title="Dispo" icon={<CalendarClock className="h-4 w-4" />}>
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2">
                <VisualChip active={availability === "now"} onClick={() => setParam("availability", availability === "now" ? "" : "now")} icon={<CheckCircle2 className="h-4 w-4" />} label="Maintenant" compact />
                <VisualChip active={availability === "soon"} onClick={() => setParam("availability", availability === "soon" ? "" : "soon")} icon={<CalendarClock className="h-4 w-4" />} label="Bientot" compact />
                <VisualChip active={recentOnly} onClick={() => setParam("recent", recentOnly ? "" : "1")} icon={<CalendarClock className="h-4 w-4" />} label="Recent" compact />
              </div>
            </FilterGroup>
          </div>

          <div className="hidden md:flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            <VisualChip active={availability === "now"} onClick={() => setParam("availability", availability === "now" ? "" : "now")} icon={<CheckCircle2 className="h-4 w-4" />} label="Dispo" compact />
            <VisualChip active={recentOnly} onClick={() => setParam("recent", recentOnly ? "" : "1")} icon={<CalendarClock className="h-4 w-4" />} label="Nouveau" compact />
            <VisualChip active={whatsappDirect} onClick={() => setParam("whatsapp", whatsappDirect ? "" : "1")} icon={<MessageCircle className="h-4 w-4" />} label="WhatsApp" compact />
            <VisualChip active={noAdvance} onClick={() => setParam("no_advance", noAdvance ? "" : "1")} icon={<CheckCircle2 className="h-4 w-4" />} label="Sans avance" compact />
            <VisualChip active={furnished} onClick={() => setParam("furnished", furnished ? "" : "1")} icon={<Sofa className="h-4 w-4" />} label="Meuble" compact />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black transition-all"
              style={filtersOpen || activeFilterCount > 0
                ? { minHeight: 48, background: "rgba(212,175,55,0.16)", border: "1px solid rgba(212,175,55,0.45)", color: "var(--accent-gold)" }
                : { minHeight: 48, background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {activeFilterCount > 0 ? `Plus de filtres (${activeFilterCount})` : "Plus de filtres"}
            </button>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black transition-colors"
                style={{ minHeight: 48, background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.35)", color: "#ef4444" }}
              >
                <X className="w-4 h-4" />
                Reset
              </button>
            )}
          </div>
        </div>

        {filtersOpen && (
          <div
            className="fixed inset-0 z-50 md:static md:inset-auto md:z-auto overflow-y-auto"
            style={{ background: "var(--bg-primary)" }}
          >
            <div className="mx-auto max-w-7xl px-4 py-4 md:px-0 md:py-3 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-black" style={{ color: "var(--text-primary)" }}>Plus de filtres</h2>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center md:hidden"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <FilterGroup title="Transaction" icon={<Home className="h-4 w-4" />}>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ id: "", label: "Toutes", Icon: Home }, { id: "rent", label: "Location", Icon: Home }, { id: "sale", label: "Achat", Icon: Banknote }].map((c) => (
                      <VisualChip key={c.id} active={tx === c.id} onClick={() => setParam("tx", c.id)} icon={<c.Icon className="h-4 w-4" />} label={c.label} compact />
                    ))}
                  </div>
                </FilterGroup>

                <FilterGroup title="Prix" icon={<Banknote className="h-4 w-4" />}>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="Min"
                      value={priceMinInput}
                      onChange={(e) => setPriceMinInput(e.target.value)}
                      onBlur={() => {
                        const v = Number(priceMinInput.replace(/\D/g, ""));
                        const params = new URLSearchParams(searchParams.toString());
                        if (v > 0) params.set("price_min", String(v)); else params.delete("price_min");
                        params.delete("page");
                        router.replace(`?${params.toString()}`, { scroll: false });
                      }}
                      style={{ flex: 1, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 14px", color: "var(--text-primary)", fontSize: 15, outline: "none", minWidth: 0 }}
                    />
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="Max"
                      value={priceMaxInput}
                      onChange={(e) => setPriceMaxInput(e.target.value)}
                      onBlur={() => {
                        const v = Number(priceMaxInput.replace(/\D/g, ""));
                        const params = new URLSearchParams(searchParams.toString());
                        if (v > 0) params.set("price_max", String(v)); else params.delete("price_max");
                        params.delete("page");
                        router.replace(`?${params.toString()}`, { scroll: false });
                      }}
                      style={{ flex: 1, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 14px", color: "var(--text-primary)", fontSize: 15, outline: "none", minWidth: 0 }}
                    />
                  </div>
                </FilterGroup>

                <FilterGroup title="Surface" icon={<Map className="h-4 w-4" />}>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="Ex: 50 m2"
                    value={surfaceMinInput}
                    onChange={(e) => setSurfaceMinInput(e.target.value)}
                    onBlur={() => {
                      const v = Number(surfaceMinInput);
                      const params = new URLSearchParams(searchParams.toString());
                      if (v > 0) params.set("surface_min", String(v)); else params.delete("surface_min");
                      params.delete("page");
                      router.replace(`?${params.toString()}`, { scroll: false });
                    }}
                    style={{ width: "100%", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 14px", color: "var(--text-primary)", fontSize: 15, outline: "none", boxSizing: "border-box" }}
                  />
                </FilterGroup>

                <FilterGroup title="Tri" icon={<SlidersHorizontal className="h-4 w-4" />}>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "default", label: "Defaut" },
                      { id: "price_asc", label: "Prix +" },
                      { id: "price_desc", label: "Prix -" },
                      { id: "newest", label: "Recent" },
                    ].map((c) => (
                      <VisualChip key={c.id} active={sortOrder === c.id} onClick={() => setParam("sort", c.id === "default" ? "" : c.id)} icon={<SlidersHorizontal className="h-4 w-4" />} label={c.label} compact />
                    ))}
                  </div>
                </FilterGroup>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {AMENITY_GROUPS.map((group) => (
                  <FilterGroup key={group.label} title={group.label} icon={<CheckCircle2 className="h-4 w-4" />}>
                    <div className="grid grid-cols-2 gap-2">
                      {group.items.map((item) => (
                        <AmenityChip
                          key={item.key}
                          active={amenities.has(item.key as AmenityKey)}
                          onClick={() => toggleAmenity(item.key as AmenityKey)}
                          Icon={item.Icon}
                          label={item.label}
                        />
                      ))}
                    </div>
                  </FilterGroup>
                ))}
              </div>

              <FilterGroup title="Autres" icon={<CheckCircle2 className="h-4 w-4" />}>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <VisualChip active={diaspora} onClick={() => setParam("diaspora", diaspora ? "" : "1")} icon={<MapPin className="h-4 w-4" />} label="Diaspora" compact />
                  <VisualChip active={furnished} onClick={() => setParam("furnished", furnished ? "" : "1")} icon={<Sofa className="h-4 w-4" />} label="Meuble" compact />
                  <VisualChip active={noAdvance} onClick={() => setParam("no_advance", noAdvance ? "" : "1")} icon={<CheckCircle2 className="h-4 w-4" />} label="Sans avance" compact />
                  <VisualChip active={whatsappDirect} onClick={() => setParam("whatsapp", whatsappDirect ? "" : "1")} icon={<MessageCircle className="h-4 w-4" />} label="WhatsApp" compact />
                  <VisualChip active={recentOnly} onClick={() => setParam("recent", recentOnly ? "" : "1")} icon={<CalendarClock className="h-4 w-4" />} label="Recent" compact />
                </div>
              </FilterGroup>

              <div className="sticky bottom-0 md:static flex gap-2 py-3" style={{ background: "var(--bg-primary)" }}>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex-1 rounded-2xl font-black"
                  style={{ minHeight: 52, background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                >
                  Reinitialiser
                </button>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="flex-1 rounded-2xl font-black"
                  style={{ minHeight: 52, background: "var(--accent-gold)", border: "1px solid var(--accent-gold)", color: "#17120a" }}
                >
                  Appliquer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        className="max-w-7xl mx-auto px-4 py-6"
        style={{ paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }}
      >
        {/* GPS message */}
        {gpsMessage && (
          <div
            className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-[var(--text-secondary)]"
            style={{ background: "var(--border-subtle)", border: "1px solid var(--border)" }}
          >
            <MapPin className="h-4 w-4" strokeWidth={2.4} />
            {gpsMessage}
          </div>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <p className="text-sm text-[#6B7280]">
            {loading ? (
              <span className="inline-block w-24 h-4 bg-white/10 rounded animate-pulse" />
            ) : (
              <>
                <span className="font-bold text-[var(--text-primary)]">{filtered.length}</span>{" "}
                annonce{filtered.length !== 1 ? "s" : ""}
                {hasFilters && (
                  <button onClick={clearFilters} className="ml-2 text-[var(--accent-gold)] hover:underline text-xs">
                    (voir tout)
                  </button>
                )}
              </>
            )}
          </p>
          <div className="flex items-center gap-3">
            {hasFilters && !loading && (
              <SaveSearchButton
                neighborhood={neighborhood || undefined}
                type={type || undefined}
                transactionType={tx || undefined}
                priceMin={priceMin > 0 ? priceMin : undefined}
                priceMax={priceMax < Infinity ? priceMax : undefined}
              />
            )}
            {!loading && totalPages > 1 && !mapView && (
              <p className="text-xs text-[var(--text-muted)]">Page {safePage} / {totalPages}</p>
            )}
          </div>
        </div>

        {/* ── Map or Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 xl:gap-6">
            {Array.from({ length: pageSize }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <Home className="mx-auto mb-4 h-12 w-12 text-[var(--text-muted)]" strokeWidth={1.8} />
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Aucune annonce trouvée</h3>
            <p className="text-[var(--text-secondary)] text-sm mb-6">Essayez d&apos;élargir vos filtres.</p>
            <button
              onClick={clearFilters}
              className="bg-[var(--accent-gold)] hover:bg-[#B8963A] text-[var(--bg-primary)] font-bold px-6 py-3 rounded-xl transition-colors"
            >
              Voir toutes les annonces
            </button>
          </div>
        ) : mapView ? (
          /* MAP VIEW */
          <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
            <AnnoncesMap properties={filtered} />
          </div>
        ) : (
          /* LIST VIEW */
          <>
            {!hasFilters && <NearbySection properties={allProperties} />}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 xl:gap-6">
              {pageItems.map((p, i) => (
                <PropertyCard key={p.id} property={p} index={i} showDiasporaPrice={diaspora} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(safePage - 1)}
                  disabled={safePage === 1}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent-gold)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  style={{ background: "var(--border-subtle)", border: "1px solid var(--border)" }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {pageNumbers.map((n, idx) => {
                  const prev = pageNumbers[idx - 1];
                  return (
                    <div key={n} className="flex items-center gap-2">
                      {prev && n - prev > 1 && (
                        <span className="text-[var(--text-muted)] text-sm px-1">…</span>
                      )}
                      <button
                        onClick={() => setPage(n)}
                        className="w-9 h-9 rounded-full text-sm font-semibold transition-colors"
                        style={n === safePage
                          ? { background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.40)", color: "var(--accent-gold)" }
                          : { background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "#666666" }}
                      >
                        {n}
                      </button>
                    </div>
                  );
                })}
                <button
                  onClick={() => setPage(safePage + 1)}
                  disabled={safePage === totalPages}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent-gold)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  style={{ background: "var(--border-subtle)", border: "1px solid var(--border)" }}
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
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-5 xl:gap-6">
          {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      }
    >
      <AnnoncesContent />
    </Suspense>
  );
}
