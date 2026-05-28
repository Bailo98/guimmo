"use client";
import { useState, useMemo } from "react";
import { MOCK_PROPERTIES } from "@/data/mock-properties";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { formatPrice } from "@/lib/utils";
import { Calculator, Info, ChevronRight } from "lucide-react";

const CHARGE_PRESETS = [100000, 200000, 300000];

export default function CalculateurPage() {
  const [revenu, setRevenu] = useState(5000000);
  const [charges, setCharges] = useState(200000);
  const [customCharges, setCustomCharges] = useState(false);
  const [customChargesValue, setCustomChargesValue] = useState("");

  const chargesValue = customCharges ? (parseInt(customChargesValue) || 0) : charges;
  const budgetMax = Math.max(0, Math.round((revenu - chargesValue) * 0.33));

  const filteredProperties = useMemo(() => {
    return MOCK_PROPERTIES.filter(
      (p) => p.transaction_type === "rent" && p.price <= budgetMax
    );
  }, [budgetMax]);

  return (
    <div className="max-w-3xl mx-auto px-4 pb-24 pt-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "linear-gradient(135deg, #D4AF37, #B8963A)" }}>
          <Calculator className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Calculateur de budget logement</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
          Estimez le loyer maximum selon vos revenus
        </p>
      </div>

      {/* Calculator card */}
      <div className="bg-[#2c2f36] rounded-2xl p-6 border border-[#1e2a30] mb-6 space-y-6">
        {/* Revenu */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Revenu mensuel</label>
            <span className="text-[#D4AF37] font-bold text-sm">{formatPrice(revenu)}</span>
          </div>
          <input
            type="range"
            min={500000}
            max={50000000}
            step={100000}
            value={revenu}
            onChange={(e) => setRevenu(parseInt(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: "#D4AF37" }}
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>500k GNF</span>
            <span>50M GNF</span>
          </div>
          <input
            type="number"
            value={revenu}
            onChange={(e) => setRevenu(Math.max(0, parseInt(e.target.value) || 0))}
            className="mt-3 w-full bg-[#2c2f36] border border-[#1e2a30] rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
            placeholder="Entrez votre revenu"
          />
        </div>

        {/* Charges */}
        <div>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
            Charges mensuelles (eau, électricité, internet)
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {CHARGE_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => { setCharges(preset); setCustomCharges(false); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  !customCharges && charges === preset
                    ? "bg-[#D4AF37] border-[#D4AF37] text-white"
                    : "border-slate-200 dark:border-[#2a3040] text-slate-600 dark:text-slate-400 hover:border-[#D4AF37] hover:text-[#D4AF37]"
                }`}
              >
                {formatPrice(preset)}
              </button>
            ))}
            <button
              onClick={() => setCustomCharges(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                customCharges
                  ? "bg-[#D4AF37] border-[#D4AF37] text-white"
                  : "border-slate-200 dark:border-[#2a3040] text-slate-600 dark:text-slate-400 hover:border-[#D4AF37] hover:text-[#D4AF37]"
              }`}
            >
              Personnalisé
            </button>
          </div>
          {customCharges && (
            <input
              type="number"
              value={customChargesValue}
              onChange={(e) => setCustomChargesValue(e.target.value)}
              placeholder="Entrez vos charges en GNF"
              className="w-full bg-[#2c2f36] border border-[#1e2a30] rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
            />
          )}
          <p className="text-xs text-slate-400 mt-1">
            Charges actuelles : <span className="font-semibold text-slate-600 dark:text-slate-300">{formatPrice(chargesValue)}</span>
          </p>
        </div>
      </div>

      {/* Result card */}
      <div
        className="rounded-2xl p-6 mb-6 text-white"
        style={{ background: "linear-gradient(135deg, #D4AF37, #B8963A)" }}
      >
        <p className="text-orange-100 text-sm font-medium mb-1">Budget maximum recommandé pour le loyer</p>
        <p className="text-4xl font-black mb-1">{formatPrice(budgetMax)}</p>
        <p className="text-orange-100 text-xs">
          = ({formatPrice(revenu)} - {formatPrice(chargesValue)}) × 33%
        </p>
        <div className="mt-4 pt-4 border-t border-white/20 flex items-start gap-2">
          <Info className="w-4 h-4 text-orange-100 flex-shrink-0 mt-0.5" />
          <p className="text-orange-100 text-xs leading-relaxed">
            Les experts recommandent de ne pas dépasser <strong>33%</strong> de vos revenus pour le logement. Cela vous laisse de la marge pour les autres dépenses et l&apos;épargne.
          </p>
        </div>
      </div>

      {/* Filtered properties */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-900 dark:text-white">
            Annonces dans votre budget
            {filteredProperties.length > 0 && (
              <span className="ml-2 text-sm text-slate-400 font-normal">{filteredProperties.length} annonce{filteredProperties.length > 1 ? "s" : ""}</span>
            )}
          </h2>
          {filteredProperties.length > 0 && (
            <a href="/annonces" className="text-xs text-[#D4AF37] hover:underline flex items-center gap-0.5">
              Voir tout <ChevronRight className="w-3 h-3" />
            </a>
          )}
        </div>

        {budgetMax === 0 ? (
          <div className="bg-[#2c2f36] rounded-2xl p-8 border border-[#1e2a30] text-center">
            <p className="text-slate-400 text-sm">Augmentez votre revenu ou réduisez vos charges pour voir des annonces.</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="bg-[#2c2f36] rounded-2xl p-8 border border-[#1e2a30] text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">
              Aucune annonce disponible pour un budget de {formatPrice(budgetMax)}.
            </p>
            <p className="text-slate-400 text-xs">
              Essayez d&apos;augmenter votre revenu ou de réduire vos charges.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredProperties.map((p, i) => (
              <PropertyCard key={p.id} property={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
