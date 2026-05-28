"use client";
import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X, Search } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const USD_RATE = 8600; // 1 USD ≈ 8 600 GNF

// Only rendered on the home page — avoids cluttering every detail / listing page

const BUDGET_PRESETS_GNF = [
  { label: "500k", value: 500_000 },
  { label: "1M",   value: 1_000_000 },
  { label: "2M",   value: 2_000_000 },
  { label: "5M",   value: 5_000_000 },
  { label: "10M",  value: 10_000_000 },
];

const BUDGET_PRESETS_USD = [
  { label: "$50",  value: 50 },
  { label: "$100", value: 100 },
  { label: "$200", value: 200 },
  { label: "$500", value: 500 },
  { label: "$1k",  value: 1000 },
];

function formatGNF(n: number): string {
  const raw = new Intl.NumberFormat("fr-FR").format(Math.round(n));
  return raw.replace(/ /g, " ").replace(/ /g, " ") + " GNF";
}

// Pill nav: bottom = 16px + safe-area, height = 60px → top of nav = 76px + safe-area
// FAB sits 16px above the nav top
const FAB_BOTTOM   = "calc(76px + env(safe-area-inset-bottom, 0px) + 16px)";
// Panel sits directly above the FAB (52 px FAB height + 8 px gap)
const PANEL_BOTTOM = "calc(76px + env(safe-area-inset-bottom, 0px) + 16px + 60px)";

export default function BudgetEstimator() {
  const pathname = usePathname();
  const router   = useRouter();

  const [open,     setOpen]     = useState(false);
  const [currency, setCurrency] = useState<"GNF" | "USD">("GNF");
  const [budget,   setBudget]   = useState(2_000_000); // always stored in GNF
  const [count,    setCount]    = useState<number | null>(null);
  const [loading,  setLoading]  = useState(false);

  const displayValue = currency === "GNF" ? budget : Math.round(budget / USD_RATE);

  const getBudgetGNF = useCallback(
    (val: number) => (currency === "GNF" ? val : val * USD_RATE),
    [currency],
  );

  const fetchCount = useCallback(async (gnfBudget: number) => {
    if (!isSupabaseConfigured || !supabase) return;
    setLoading(true);
    const min = Math.round(gnfBudget * 0.7);
    const max = Math.round(gnfBudget * 1.3);
    const { count: c } = await supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .gte("price", min)
      .lte("price", max)
      .eq("status", "active");
    setCount(c ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => fetchCount(budget), 350);
    return () => clearTimeout(timer);
  }, [budget, open, fetchCount]);

  const sliderMin  = currency === "GNF" ? 300_000    : 35;
  const sliderMax  = currency === "GNF" ? 30_000_000 : 3500;
  const sliderStep = currency === "GNF" ? 100_000    : 10;

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBudget(getBudgetGNF(Number(e.target.value)));
  };

  const handleSearch = () => {
    const min = Math.round(budget * 0.7);
    const max = Math.round(budget * 1.3);
    router.push(`/annonces?price_min=${min}&price_max=${max}`);
    setOpen(false);
  };

  if (pathname !== "/") return null;

  return (
    <>
      {/* ── Panel — opens above the FAB ───────────────────────────── */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: PANEL_BOTTOM,
            right: 16,
            zIndex: 50,
            width: "min(320px, calc(100vw - 32px))",
            background: "#1a252b",
            borderRadius: 20,
            boxShadow: "0 8px 40px rgba(0,0,0,0.55)",
            border: "1px solid rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", lineHeight: 1 }}>
                💰 Estimateur de budget
              </p>
              <p style={{ fontSize: 11, color: "var(--text-secondary-new)", marginTop: 3 }}>
                Trouvez des logements dans votre budget
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: "rgba(255,255,255,0.07)", border: "none", borderRadius: "50%",
                width: 30, height: 30, display: "flex", alignItems: "center",
                justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.6)",
                minHeight: "auto",
              }}
              aria-label="Fermer"
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: "16px" }}>
            {/* Currency toggle */}
            <div style={{
              display: "flex", background: "rgba(255,255,255,0.05)",
              borderRadius: 999, padding: 3, marginBottom: 16, width: "fit-content",
            }}>
              {(["GNF", "USD"] as const).map((cur) => (
                <button
                  key={cur}
                  onClick={() => setCurrency(cur)}
                  style={{
                    background: currency === cur ? "#D4AF37" : "transparent",
                    color: currency === cur ? "#0A1216" : "rgba(255,255,255,0.55)",
                    border: "none", borderRadius: 999, padding: "5px 18px",
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                    transition: "background 0.2s, color 0.2s", minHeight: "auto",
                  }}
                >
                  {cur}
                </button>
              ))}
            </div>

            {/* Budget display */}
            <div style={{ textAlign: "center", marginBottom: 14 }}>
              <p style={{ fontSize: 24, fontWeight: 800, color: "#D4AF37", lineHeight: 1 }}>
                {currency === "GNF"
                  ? formatGNF(budget)
                  : `$${new Intl.NumberFormat("en-US").format(Math.round(budget / USD_RATE))}`}
              </p>
              {currency === "USD" && (
                <p style={{ fontSize: 11, color: "var(--text-secondary-new)", marginTop: 4 }}>
                  ≈ {formatGNF(budget)}
                </p>
              )}
            </div>

            {/* Slider */}
            <input
              type="range"
              min={sliderMin} max={sliderMax} step={sliderStep} value={displayValue}
              onChange={handleSlider}
              style={{ width: "100%", accentColor: "#D4AF37", marginBottom: 12, height: 4, cursor: "pointer" }}
            />

            {/* Presets */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {(currency === "GNF" ? BUDGET_PRESETS_GNF : BUDGET_PRESETS_USD).map((p) => {
                const gnfVal = currency === "GNF" ? p.value : p.value * USD_RATE;
                const active = Math.abs(budget - gnfVal) < (currency === "GNF" ? 50_000 : 500);
                return (
                  <button
                    key={p.label}
                    onClick={() => setBudget(gnfVal)}
                    style={{
                      background: active ? "#D4AF37" : "rgba(255,255,255,0.07)",
                      color: active ? "#0A1216" : "rgba(255,255,255,0.7)",
                      border: "none", borderRadius: 999, padding: "5px 12px",
                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                      transition: "background 0.2s, color 0.2s", minHeight: "auto",
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Count indicator */}
            <div style={{
              background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.15)",
              borderRadius: 12, padding: "10px 14px", marginBottom: 14,
              textAlign: "center", minHeight: 48, display: "flex",
              alignItems: "center", justifyContent: "center",
            }}>
              {loading ? (
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Recherche en cours…</span>
              ) : count === null ? (
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                  Ajustez votre budget pour voir les résultats
                </span>
              ) : (
                <span style={{ fontSize: 13, color: "#D4AF37", fontWeight: 600 }}>
                  {count === 0
                    ? "Aucune annonce dans cette fourchette"
                    : `${count} annonce${count > 1 ? "s" : ""} dans cette fourchette de prix`}
                </span>
              )}
            </div>

            {/* CTA */}
            <button
              onClick={handleSearch}
              disabled={count === 0 || count === null}
              style={{
                width: "100%",
                background: count && count > 0 ? "#D4AF37" : "rgba(255,255,255,0.08)",
                color: count && count > 0 ? "#0A1216" : "rgba(255,255,255,0.35)",
                border: "none", borderRadius: 12, padding: "12px 16px",
                fontSize: 14, fontWeight: 700,
                cursor: count && count > 0 ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "background 0.2s, color 0.2s",
              }}
            >
              <Search style={{ width: 16, height: 16 }} />
              Voir les annonces
            </button>
          </div>
        </div>
      )}

      {/* ── FAB — always above the BottomNav ──────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Estimateur de budget"
        style={{
          position: "fixed",
          bottom: FAB_BOTTOM,
          right: 16,
          zIndex: 50,
          width: 52, height: 52,
          borderRadius: "50%",
          background: open ? "#B8963A" : "#D4AF37",
          border: "none",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22,
          boxShadow: "0 4px 20px rgba(212,175,55,0.35)",
          transition: "background 0.2s, transform 0.15s",
          minHeight: "auto",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.1)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
      >
        💰
      </button>
    </>
  );
}
