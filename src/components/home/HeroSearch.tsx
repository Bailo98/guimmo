"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { VoiceSearchButton } from "@/components/ui/VoiceSearchButton";

const QUARTIERS = [
  { id: "kipe",       name: "Kipé" },
  { id: "hamdallaye", name: "Hamdallaye" },
  { id: "dixinn",     name: "Dixinn" },
  { id: "ratoma",     name: "Ratoma" },
  { id: "taouyah",    name: "Taouyah" },
  { id: "sonfonia",   name: "Sonfonia" },
  { id: "lambanyi",   name: "Lambanyi" },
  { id: "kaloum",     name: "Kaloum" },
  { id: "matam",      name: "Matam" },
  { id: "madina",     name: "Madina" },
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
  borderRadius: "12px",
  padding: "0 14px",
  fontSize: "16px",
  width: "100%",
  height: "48px",
  minHeight: "48px",
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
    const match = QUARTIERS.find((q) => lower.includes(q.name.toLowerCase()));
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
      className="rounded-2xl p-3 sm:p-4 w-full max-w-[760px] mx-auto lg:mx-0"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-soft)",
      }}
    >
      {/* Tabs — pleine largeur, 50/50 */}
      <div
        className="grid grid-cols-2 gap-1 mb-4 p-1 rounded-[10px]"
        style={{ background: "var(--surface-soft)", borderRadius: 12 }}
      >
        {(["rent", "sale"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 text-sm font-semibold rounded-lg transition-all"
            style={{
              minHeight: "44px",
              borderRadius: 10,
              ...(tab === t
                ? { background: "var(--accent-gold)", color: "var(--bg-primary)", fontWeight: 700 }
                : { color: "var(--text-secondary)" }),
            }}
          >
            {t === "rent" ? "🔑 Location" : "💰 Achat"}
          </button>
        ))}
      </div>

      {/* Selects + budget — empilés mobile, côte à côte sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div>
          <label
            htmlFor="hs-quartier"
            className="block text-xs font-semibold mb-1.5"
            style={{ color: "var(--text-secondary)" }}
          >
            📍 Quartier
          </label>
          <div className="relative">
            <select
              id="hs-quartier"
              value={neighborhood}
              onChange={(e) => {
                setNeighborhood(e.target.value);
                (e.target as HTMLSelectElement).style.color = "var(--text-primary)";
              }}
              style={SELECT_BASE}
            >
              <option value="" style={{ color: "var(--text-primary)" }}>Tous</option>
              {QUARTIERS.map((q) => (
                <option key={q.id} value={q.id} style={{ color: "var(--text-primary)" }}>
                  {q.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label
            htmlFor="hs-type"
            className="block text-xs font-semibold mb-1.5"
            style={{ color: "var(--text-secondary)" }}
          >
            🏠 Type
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
        <div>
          <label
            htmlFor="hs-budget"
            className="block text-xs font-semibold mb-1.5"
            style={{ color: "var(--text-secondary)" }}
          >
            💰 Budget
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
      </div>

      {/* Bouton Rechercher + micro — flex row pleine largeur */}
      <div className="flex gap-2">
        <button
          onClick={handleSearch}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors"
          style={{ background: "var(--accent-gold)", color: "var(--bg-primary)", minHeight: "52px", fontWeight: 700 }}
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
