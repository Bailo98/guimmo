"use client";
import { useRouter } from "next/navigation";
import { X, Scale } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { MOCK_PROPERTIES } from "@/data/mock-properties";

export function CompareBar() {
  const { compareList, removeFromCompare, clearCompare, _hasHydrated } = useAppStore();
  const router = useRouter();

  if (!_hasHydrated || compareList.length === 0) return null;

  const properties = compareList
    .map((id) => MOCK_PROPERTIES.find((p) => p.id === id))
    .filter(Boolean);

  return (
    <div
      className="fixed bottom-16 md:bottom-0 left-0 right-0 z-50 border-t"
      style={{ background: "#1e2430", borderColor: "#2a3040" }}
    >
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
        <span className="text-slate-400 text-xs font-semibold whitespace-nowrap flex items-center gap-1">
          <Scale className="w-3.5 h-3.5" /> Comparer :
        </span>
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          {properties.map((p) => p && (
            <div
              key={p.id}
              className="flex items-center gap-1.5 bg-[#151922] border border-[#2a3040] rounded-lg px-2.5 py-1.5"
            >
              <span className="text-xs font-medium text-slate-200 line-clamp-1 max-w-[120px]">{p.title}</span>
              <button
                onClick={() => removeFromCompare(p.id)}
                className="text-slate-400 hover:text-white transition-colors ml-0.5"
                aria-label="Retirer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => clearCompare()}
            className="text-slate-400 hover:text-slate-200 text-xs transition-colors"
          >
            Vider
          </button>
          <button
            onClick={() => router.push("/comparer")}
            className="flex items-center gap-1.5 bg-[#D4AF37] hover:bg-[#B8963A] active:scale-95 text-white font-bold text-sm px-4 py-2 rounded-xl transition-all"
          >
            <Scale className="w-4 h-4" />
            Comparer ({compareList.length})
          </button>
        </div>
      </div>
    </div>
  );
}
