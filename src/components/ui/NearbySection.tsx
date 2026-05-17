"use client";

import { useState, useEffect } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { PropertyCard } from "@/components/ui/PropertyCard";
import type { Property } from "@/types";

const MAX_DISTANCE_KM = 10;
const MAX_RESULTS = 5;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface Props {
  properties: Property[];
  horizontal?: boolean;
}

export function NearbySection({ properties, horizontal = false }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "ready" | "denied">("idle");
  const [nearby, setNearby] = useState<(Property & { distanceKm: number })[]>([]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    setState("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: userLat, longitude: userLon } = pos.coords;
        const withDistance = properties
          .filter((p) => p.latitude != null && p.longitude != null)
          .map((p) => ({
            ...p,
            distanceKm: haversineKm(userLat, userLon, p.latitude!, p.longitude!),
          }))
          .filter((p) => p.distanceKm <= MAX_DISTANCE_KM)
          .sort((a, b) => a.distanceKm - b.distanceKm)
          .slice(0, MAX_RESULTS);

        setNearby(withDistance);
        setState("ready");
      },
      () => setState("denied"),
      { timeout: 8000, maximumAge: 60_000 }
    );
  }, [properties]);

  if (state === "idle" || state === "denied") return null;

  if (state === "loading") {
    return (
      <div className="mb-8 flex items-center gap-2 text-sm text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        Recherche des annonces près de vous…
      </div>
    );
  }

  if (nearby.length === 0) return null;

  const header = (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-7 h-7 bg-[#E9E900]/10 rounded-lg flex items-center justify-center">
        <MapPin className="w-4 h-4 text-[#E9E900]" />
      </div>
      <h2 className="font-black text-slate-900 dark:text-white text-lg">Près de vous</h2>
      <span className="text-xs text-slate-400 ml-1">dans un rayon de {MAX_DISTANCE_KM} km</span>
    </div>
  );

  if (horizontal) {
    return (
      <section className="mb-10">
        {header}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
          {nearby.map((p, i) => (
            <div key={p.id} className="relative flex-none w-64 snap-start">
              <PropertyCard property={p} index={i} />
              <div className="absolute top-3 left-3 bg-[#E9E900] text-white text-[10px] font-bold px-2 py-0.5 rounded-full pointer-events-none">
                {p.distanceKm < 1
                  ? `${Math.round(p.distanceKm * 1000)} m`
                  : `${p.distanceKm.toFixed(1)} km`}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-10">
      {header}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {nearby.map((p, i) => (
          <div key={p.id} className="relative">
            <PropertyCard property={p} index={i} />
            <div className="absolute top-3 left-3 bg-[#E9E900] text-white text-[10px] font-bold px-2 py-0.5 rounded-full pointer-events-none">
              {p.distanceKm < 1
                ? `${Math.round(p.distanceKm * 1000)} m`
                : `${p.distanceKm.toFixed(1)} km`}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 border-t border-slate-100 dark:border-[#2a3040]" />
    </section>
  );
}
