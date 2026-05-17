"use client";
import { useAppStore } from "@/lib/store";
import { MOCK_PROPERTIES } from "@/data/mock-properties";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { Clock } from "lucide-react";

export function RecentlyViewedSection() {
  const recentViews = useAppStore((s) => s.recentViews);
  const _hasHydrated = useAppStore((s) => s._hasHydrated);

  if (!_hasHydrated || recentViews.length === 0) return null;

  const properties = recentViews
    .slice(0, 3)
    .map((id) => MOCK_PROPERTIES.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  if (properties.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 mb-5">
        <Clock className="w-5 h-5 text-[#E9E900]" />
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Biens récemment consultés</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
        {properties.map((p) => (
          <div key={p.id} className="flex-none w-72 snap-start">
            <PropertyCard property={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
