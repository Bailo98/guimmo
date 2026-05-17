"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, ChevronDown } from "lucide-react";
import { POPULAR_NEIGHBORHOODS } from "@/data/neighborhoods";
import { PROPERTY_TYPES } from "@/lib/constants";

export function SearchBar() {
  const router = useRouter();
  const [neighborhood, setNeighborhood] = useState("");
  const [type, setType] = useState("");
  const [transactionType, setTransactionType] = useState("rent");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (neighborhood) params.set("neighborhood", neighborhood);
    if (type) params.set("type", type);
    if (transactionType) params.set("transactionType", transactionType);
    router.push(`/annonces?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSearch} className="bg-white dark:bg-[#1e2430] rounded-2xl p-2 shadow-2xl max-w-3xl mx-auto">
      {/* Transaction type tabs */}
      <div className="flex gap-1 mb-2 p-1 bg-slate-100 dark:bg-[#151922] rounded-xl">
        {[
          { value: "rent", label: "Location" },
          { value: "sale", label: "Achat" },
        ].map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTransactionType(t.value)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
              transactionType === t.value
                ? "bg-white dark:bg-[#1e2430] text-[#E9E900] shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search fields */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Neighborhood */}
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            className="w-full appearance-none bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] rounded-xl pl-9 pr-8 py-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E9E900] focus:border-transparent"
          >
            <option value="">Tous les quartiers</option>
            {POPULAR_NEIGHBORHOODS.map((n) => (
              <option key={n.id} value={n.id}>{n.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Type */}
        <div className="relative sm:w-44">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full appearance-none bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] rounded-xl pl-4 pr-8 py-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E9E900] focus:border-transparent"
          >
            <option value="">Tout type</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="flex items-center justify-center gap-2 bg-[#E9E900] hover:bg-[#c4c400] active:scale-95 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-[0_4px_20px_rgba(233,233,0,0.25)]"
        >
          <Search className="w-5 h-5" />
          <span className="sm:hidden">Rechercher</span>
          <span className="hidden sm:inline">Rechercher</span>
        </button>
      </div>
    </form>
  );
}
