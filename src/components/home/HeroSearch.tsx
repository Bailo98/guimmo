"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

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
  background: "rgba(247,242,230,0.07)",
  border: "1px solid rgba(247,242,230,0.18)",
  color: "rgba(247,242,230,0.55)",
  borderRadius: "12px",
  padding: "10px 14px",
  fontSize: "0.875rem",
  width: "100%",
  outline: "none",
  appearance: "none",
  WebkitAppearance: "none",
};

export function HeroSearch() {
  const [tab, setTab]               = useState<"rent" | "sale">("rent");
  const [neighborhood, setNeighborhood] = useState("");
  const [type, setType]             = useState("");
  const router = useRouter();

  function handleSearch() {
    const params = new URLSearchParams();
    if (neighborhood) params.set("neighborhood", neighborhood);
    if (type)         params.set("type", type);
    router.push(`/annonces?${params.toString()}`);
  }

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "rgba(10,18,12,0.55)",
        border: "1px solid rgba(247,242,230,0.12)",
        maxWidth: "480px",
      }}
    >
      {/* Tabs */}
      <div
        className="flex gap-1 mb-4 p-1 rounded-[10px]"
        style={{ background: "rgba(247,242,230,0.08)" }}
      >
        {(["rent", "sale"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all"
            style={
              tab === t
                ? { background: "#f7f2e6", color: "#111a14" }
                : { color: "rgba(247,242,230,0.55)" }
            }
          >
            {t === "rent" ? "🔑 Location" : "💰 Achat"}
          </button>
        ))}
      </div>

      {/* Selects */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label
            className="block text-xs font-semibold mb-1.5"
            style={{ color: "rgba(247,242,230,0.50)" }}
          >
            Quartier
          </label>
          <div className="relative">
            <select
              value={neighborhood}
              onChange={(e) => {
                setNeighborhood(e.target.value);
                (e.target as HTMLSelectElement).style.color = e.target.value
                  ? "#f7f2e6"
                  : "rgba(247,242,230,0.55)";
              }}
              style={SELECT_BASE}
            >
              <option value="" style={{ color: "#111a14" }}>Tous les quartiers</option>
              {QUARTIERS.map((q) => (
                <option key={q.id} value={q.id} style={{ color: "#111a14" }}>
                  {q.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label
            className="block text-xs font-semibold mb-1.5"
            style={{ color: "rgba(247,242,230,0.50)" }}
          >
            Type de bien
          </label>
          <div className="relative">
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                (e.target as HTMLSelectElement).style.color = e.target.value
                  ? "#f7f2e6"
                  : "rgba(247,242,230,0.55)";
              }}
              style={SELECT_BASE}
            >
              <option value="" style={{ color: "#111a14" }}>Tous les types</option>
              {TYPES.map((t) => (
                <option key={t.id} value={t.id} style={{ color: "#111a14" }}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Search button */}
      <button
        onClick={handleSearch}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-colors"
        style={{ background: "#c8901e", color: "#fff" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "#b87c18"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "#c8901e"; }}
      >
        <Search className="w-4 h-4" />
        Rechercher
      </button>
    </div>
  );
}
