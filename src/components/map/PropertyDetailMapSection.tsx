"use client";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

const PropertyDetailMapDynamic = dynamic(
  () => import("./PropertyDetailMap").then((m) => m.PropertyDetailMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[200px] bg-slate-100 dark:bg-[#1e2430] rounded-xl animate-pulse" />
    ),
  }
);

interface Props {
  neighborhood: string;
}

export function PropertyDetailMapSection({ neighborhood }: Props) {
  return (
    <div className="bg-[var(--bg-card-light)] rounded-2xl p-5 border border-[var(--border)]">
      <h2 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
        <MapPin className="w-4 h-4 text-[#D4AF37]" />
        Voir sur la carte
      </h2>
      <p className="text-xs text-slate-400 mb-3">
        Position approximative du quartier (adresse exacte fournie lors de la visite)
      </p>
      <div className="rounded-xl overflow-hidden h-[200px]">
        {/* isDark is read inside the map component's useEffect to avoid hydration mismatch */}
        <PropertyDetailMapDynamic neighborhood={neighborhood} />
      </div>
    </div>
  );
}
