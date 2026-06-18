"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Home, KeyRound, MapPin, Search } from "lucide-react";
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
  background: "var(--surface-soft)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  borderRadius: "11px",
  padding: "0 12px",
  fontSize: "16px",
  width: "100%",
  height: "44px",
  minHeight: "44px",
  outline: "none",
  appearance: "none",
  WebkitAppearance: "none",
};

export function HeroSearch() {
  const [tab, setTab]               = useState<"rent" | "sale">("rent");
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
    if (neighborhood) params.set("neighborhood", neighborhood);
    if (type)         params.set("type", type);
    if (budgetMax)    params.set("max_price", budgetMax.replace(/\D/g, ""));
    router.push(`/annonces?${params.toString()}`);
  }

  return (
    <div
      className="rounded-2xl p-2.5 sm:p-3.5 w-full max-w-[1080px] mx-auto"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-soft)",
      }}
    >
      {/* Tabs — pleine largeur, 50/50 */}
      <div
        className="grid grid-cols-2 gap-1 mb-3 p-1 rounded-[10px]"
        style={{ background: "var(--surface-soft)", borderRadius: 12 }}
      >
        {(["rent", "sale"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 text-sm font-semibold rounded-lg transition-all"
            style={{
              minHeight: "40px",
              borderRadius: 10,
              ...(tab === t
                ? { background: "var(--accent-gold)", color: "var(--bg-primary)", fontWeight: 700 }
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

      {/* Selects + budget — empilés mobile, côte à côte sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
        <div>
          <label
            htmlFor="hs-commune"
            className="block text-xs font-semibold mb-1.5"
            style={{ color: "var(--text-secondary)" }}
          >
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" strokeWidth={2.4} />
              Commune
            </span>
          </label>
          <div className="relative">
            <select
              id="hs-commune"
              value={neighborhood}
              onChange={(e) => {
                setNeighborhood(e.target.value);
                (e.target as HTMLSelectElement).style.color = "var(--text-primary)";
              }}
              style={SELECT_BASE}
            >
              <option value="" style={{ color: "var(--text-primary)" }}>Tous</option>
              {COMMUNES.map((q) => (
                <option key={q.id} value={q.id} style={{ color: "var(--text-primary)" }}>
                  {q.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label
            htmlFor="hs-budget"
            className="block text-xs font-semibold mb-1.5"
            style={{ color: "var(--text-secondary)" }}
          >
            <span className="inline-flex items-center gap-1.5">
              <Banknote className="h-3.5 w-3.5" strokeWidth={2.4} />
              Budget
            </span>
          </label>
          <input
            id="hs-budget"
            type="number"
            value={budgetMax}
            onChange={(e) => setBudgetMax(e.target.value)}
            placeholder="Ex : 2 000 000"
            style={{ ...SELECT_BASE, color: budgetMax ? "var(--text-primary)" : "var(--text-muted)" }}
          />
        </div>
        <div>
          <label
            htmlFor="hs-type"
            className="block text-xs font-semibold mb-1.5"
            style={{ color: "var(--text-secondary)" }}
          >
            <span className="inline-flex items-center gap-1.5">
              <Home className="h-3.5 w-3.5" strokeWidth={2.4} />
              Type
            </span>
          </label>
          <div className="relative">
            <select
              id="hs-type"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                (e.target as HTMLSelectElement).style.color = "var(--text-primary)";
              }}
              style={SELECT_BASE}
            >
              <option value="" style={{ color: "var(--text-primary)" }}>Tous</option>
              {TYPES.map((t) => (
                <option key={t.id} value={t.id} style={{ color: "var(--text-primary)" }}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bouton Rechercher + micro — flex row pleine largeur */}
      <div className="flex gap-2 px-8 sm:px-0">
        <button
          onClick={handleSearch}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors"
          style={{ background: "var(--accent-gold)", color: "var(--bg-primary)", minHeight: "46px", fontWeight: 700 }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#B8963A"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent-gold)"; }}
        >
          <Search className="w-4 h-4" />
          Voir
        </button>
        <VoiceSearchButton onResult={handleVoiceResult} />
      </div>
    </div>
  );
}
