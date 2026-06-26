"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, ChevronDown, Home, KeyRound, MapPin, Search } from "lucide-react";
import { VoiceSearchButton } from "@/components/ui/VoiceSearchButton";

const COMMUNES = [
  { id: "kaloum", name: "Kaloum" },
  { id: "dixinn", name: "Dixinn" },
  { id: "matam", name: "Matam" },
  { id: "ratoma", name: "Ratoma" },
  { id: "matoto", name: "Matoto" },
];

const TYPES = [
  { id: "apartment", name: "Appartement" },
  { id: "house",     name: "Maison" },
  { id: "studio",    name: "Studio" },
  { id: "villa",     name: "Villa" },
  { id: "room",      name: "Chambre" },
  { id: "office",    name: "Bureau" },
  { id: "land",      name: "Terrain" },
];

const SELECT_BASE: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "var(--text-primary)",
  borderRadius: "999px",
  padding: "0 34px 0 44px",
  fontSize: "16px",
  fontWeight: 800,
  width: "100%",
  height: "56px",
  minHeight: "56px",
  outline: "none",
  appearance: "none",
  WebkitAppearance: "none",
};

export function HeroSearch() {
  const [tab, setTab]               = useState<"rent" | "sale">("rent");
  const [query, setQuery]           = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [type, setType]             = useState("");
  const [budgetMax, setBudgetMax]   = useState("");
  const router = useRouter();

  function handleVoiceResult(text: string) {
    const lower = text.toLowerCase();
    const match = COMMUNES.find((q) => lower.includes(q.name.toLowerCase()));
    if (match) { setNeighborhood(match.id); return; }
    const typeMatch = TYPES.find((t) => lower.includes(t.name.toLowerCase()));
    if (typeMatch) { setType(typeMatch.id); return; }
    router.push(`/annonces?q=${encodeURIComponent(text)}`);
  }

  function handleSearch() {
    const params = new URLSearchParams();
    params.set("tx", tab);
    if (query.trim()) params.set("q", query.trim());
    if (neighborhood) params.set("neighborhood", neighborhood);
    if (type)         params.set("type", type);
    if (budgetMax)    params.set("max_price", budgetMax.replace(/\D/g, ""));
    router.push(`/annonces?${params.toString()}`);
  }

  return (
    <div
      className="w-full max-w-[760px] mx-auto"
    >
      <div
        className="mb-3 flex min-h-[64px] items-center gap-2 rounded-[28px] px-4 sm:px-5"
        style={{
          background: "var(--bg-card)",
          border: "1px solid rgba(185,138,46,0.24)",
          boxShadow: "0 18px 45px rgba(24,21,16,0.13)",
        }}
      >
        <Search className="h-6 w-6 flex-shrink-0" strokeWidth={2.4} style={{ color: "var(--accent-gold)" }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
          placeholder="Hamdallaye, Sonfonia, Lambanyi..."
          className="min-w-0 flex-1 bg-transparent text-[17px] font-black outline-none placeholder:font-bold"
          style={{ color: "var(--text-primary)" }}
          aria-label="Rechercher une commune ou un quartier"
        />
        <VoiceSearchButton
          onResult={handleVoiceResult}
          style={{
            minWidth: 46,
            minHeight: 46,
            borderRadius: 999,
            background: "var(--surface-soft)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
          }}
        />
      </div>

      <div
        className="rounded-[28px] p-3 sm:p-4"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-soft)",
      }}
    >
      <div
        className="grid grid-cols-2 gap-2 mb-3 rounded-[22px] p-1.5"
        style={{ background: "var(--surface-soft)" }}
      >
        {(["rent", "sale"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 text-base font-black transition-all active:scale-[0.98]"
            style={{
              minHeight: "52px",
              borderRadius: 18,
              ...(tab === t
                ? { background: "var(--accent-gold)", color: "var(--bg-primary)", boxShadow: "0 10px 24px rgba(185,138,46,0.22)" }
                : { color: "var(--text-secondary)" }),
            }}
          >
            <span className="inline-flex items-center justify-center gap-2">
              {t === "rent" ? <KeyRound className="h-4 w-4" strokeWidth={2.4} /> : <Banknote className="h-4 w-4" strokeWidth={2.4} />}
              {t === "rent" ? "Location" : "Achat"}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <div
          className="relative overflow-hidden rounded-full"
          style={{ background: "var(--surface-soft)", border: "1px solid var(--border)" }}
        >
          <MapPin className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2" strokeWidth={2.4} style={{ color: "var(--accent-gold)" }} />
            <select
              id="hs-commune"
              value={neighborhood}
              onChange={(e) => {
                setNeighborhood(e.target.value);
                (e.target as HTMLSelectElement).style.color = "var(--text-primary)";
              }}
              style={SELECT_BASE}
              aria-label="Commune"
            >
              <option value="" style={{ color: "var(--text-primary)" }}>Commune</option>
              {COMMUNES.map((q) => (
                <option key={q.id} value={q.id} style={{ color: "var(--text-primary)" }}>
                  {q.name}
                </option>
              ))}
            </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2" strokeWidth={2.4} style={{ color: "var(--text-secondary)" }} />
        </div>
        <div
          className="relative overflow-hidden rounded-full"
          style={{ background: "var(--surface-soft)", border: "1px solid var(--border)" }}
        >
          <Banknote className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2" strokeWidth={2.4} style={{ color: "var(--accent-gold)" }} />
          <input
            id="hs-budget"
            type="number"
            value={budgetMax}
            onChange={(e) => setBudgetMax(e.target.value)}
            placeholder="Budget"
            className="placeholder:font-black"
            style={{ ...SELECT_BASE, color: budgetMax ? "var(--text-primary)" : "var(--text-secondary)" }}
            aria-label="Budget maximum"
          />
        </div>
        <div
          className="relative overflow-hidden rounded-full"
          style={{ background: "var(--surface-soft)", border: "1px solid var(--border)" }}
        >
          <Home className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2" strokeWidth={2.4} style={{ color: "var(--accent-gold)" }} />
            <select
              id="hs-type"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                (e.target as HTMLSelectElement).style.color = "var(--text-primary)";
              }}
              style={SELECT_BASE}
              aria-label="Type de logement"
            >
              <option value="" style={{ color: "var(--text-primary)" }}>Type</option>
              {TYPES.map((t) => (
                <option key={t.id} value={t.id} style={{ color: "var(--text-primary)" }}>
                  {t.name}
                </option>
              ))}
            </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2" strokeWidth={2.4} style={{ color: "var(--text-secondary)" }} />
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={handleSearch}
          className="flex flex-1 items-center justify-center gap-2 rounded-[22px] text-base font-black transition-all active:scale-[0.99]"
          style={{ background: "var(--accent-gold)", color: "var(--bg-primary)", minHeight: "58px", boxShadow: "0 16px 34px rgba(185,138,46,0.28)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#B8963A"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent-gold)"; }}
        >
          <Search className="h-5 w-5" strokeWidth={2.5} />
          Voir les logements
        </button>
      </div>
    </div>
    </div>
  );
}
