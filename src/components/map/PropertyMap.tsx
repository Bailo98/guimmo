"use client";
import { useEffect, useRef, useState } from "react";
import { Flame } from "lucide-react";
import type { Property } from "@/types";
import { NEIGHBORHOOD_COORDINATES } from "@/data/neighborhoods";
import { cn } from "@/lib/utils";

interface PropertyMapProps {
  properties: Property[];
}

function buildMarkers(
  L: typeof import("leaflet"),
  map: import("leaflet").Map,
  properties: Property[],
  showHeatmap: boolean
) {
  // Orange teardrop icon for single properties
  const orangeIcon = L.divIcon({
    className: "",
    html: `<div style="
      width:32px;height:32px;
      background:#F97316;
      border:3px solid #fff;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      box-shadow:0 2px 8px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -36],
  });

  // Group properties by neighborhood
  const grouped = properties.reduce<Record<string, Property[]>>((acc, p) => {
    const key = p.neighborhood;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  Object.entries(grouped).forEach(([neighborhood, group]) => {
    const coords = NEIGHBORHOOD_COORDINATES[neighborhood];
    if (!coords) return;

    if (group.length === 1) {
      // Single marker — existing individual behavior
      const property = group[0];
      const jitter = () => (Math.random() - 0.5) * 0.003;
      const position: [number, number] = [coords[0] + jitter(), coords[1] + jitter()];

      const formattedPrice = new Intl.NumberFormat("fr-GN", {
        style: "currency",
        currency: "GNF",
        maximumFractionDigits: 0,
      }).format(property.price);

      const popup = L.popup({ maxWidth: 240, className: "leaflet-popup-custom" }).setContent(`
        <div style="font-family:system-ui,sans-serif;padding:4px 0;">
          <p style="font-weight:700;font-size:13px;margin:0 0 4px;color:#111;line-height:1.3;">${property.title}</p>
          <p style="font-size:12px;color:#F97316;font-weight:600;margin:0 0 8px;">${formattedPrice}${property.price_period === "month" ? "/mois" : ""}</p>
          <a href="/annonces/${property.id}" style="display:inline-block;background:#F97316;color:#fff;font-size:12px;font-weight:600;padding:5px 12px;border-radius:8px;text-decoration:none;">Voir →</a>
        </div>
      `);

      L.marker(position, { icon: orangeIcon }).addTo(map).bindPopup(popup);
    } else {
      // Cluster marker
      const count = group.length;
      const clusterIcon = L.divIcon({
        html: `<div style="background:#F97316;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${count}</div>`,
        iconSize: [36, 36],
        className: "",
      });

      const listItems = group
        .map(
          (p) =>
            `<li style="margin:0 0 6px;"><a href="/annonces/${p.id}" style="color:#F97316;font-weight:600;font-size:13px;text-decoration:none;">${p.title}</a></li>`
        )
        .join("");

      const clusterPopup = L.popup({ maxWidth: 260 }).setContent(`
        <div style="font-family:system-ui,sans-serif;padding:4px 0;">
          <p style="font-weight:700;font-size:13px;margin:0 0 8px;color:#111;">${count} annonces — ${neighborhood}</p>
          <ul style="list-style:none;margin:0;padding:0;">${listItems}</ul>
        </div>
      `);

      const position: [number, number] = [coords[0], coords[1]];
      L.marker(position, { icon: clusterIcon }).addTo(map).bindPopup(clusterPopup);
    }
  });

  // Heatmap: semi-transparent colored circles per neighborhood based on average price
  if (showHeatmap && properties.length > 0) {
    const neighborhoodPrices: Record<string, number[]> = {};
    properties.forEach((p) => {
      if (!neighborhoodPrices[p.neighborhood]) neighborhoodPrices[p.neighborhood] = [];
      neighborhoodPrices[p.neighborhood].push(p.price);
    });

    const allPrices = properties.map((p) => p.price);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);

    Object.entries(neighborhoodPrices).forEach(([neighborhood, prices]) => {
      const coords = NEIGHBORHOOD_COORDINATES[neighborhood];
      if (!coords) return;
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const ratio = (avgPrice - minPrice) / (maxPrice - minPrice || 1);
      const color = ratio < 0.33 ? "#22c55e" : ratio < 0.66 ? "#F97316" : "#ef4444";

      L.circle(coords as [number, number], {
        radius: 600,
        color: "transparent",
        fillColor: color,
        fillOpacity: 0.3,
      }).addTo(map);
    });
  }
}

export function PropertyMap({ properties }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const [heatmap, setHeatmap] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    let isMounted = true;

    async function initMap() {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (!isMounted || !mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current, {
        center: [9.537, -13.6773],
        zoom: 12,
        zoomControl: true,
      });

      mapInstanceRef.current = map;

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 20,
        }
      ).addTo(map);

      buildMarkers(L, map, properties, heatmap);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reinit when properties list changes identity (filter changes) or heatmap toggle changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const existing = mapInstanceRef.current as { remove: () => void };
    existing.remove();
    mapInstanceRef.current = null;

    async function reinit() {
      const L = (await import("leaflet")).default;
      if (!mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: [9.537, -13.6773],
        zoom: 12,
      });
      mapInstanceRef.current = map;

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 20,
        }
      ).addTo(map);

      buildMarkers(L, map, properties, heatmap);
    }

    reinit();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties, heatmap]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden h-[60vh] md:h-[70vh]">
      <div ref={mapRef} className="w-full h-full" />

      {/* Heatmap toggle button */}
      <div className="absolute top-3 right-3 z-[1000]">
        <button
          onClick={() => setHeatmap((h) => !h)}
          className={cn(
            "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-lg border transition-colors",
            heatmap
              ? "bg-[#F97316] text-white border-[#F97316]"
              : "bg-white dark:bg-[#1e2430] text-slate-700 dark:text-white border-slate-200 dark:border-[#2a3040]"
          )}
        >
          <Flame className="w-3.5 h-3.5" /> Carte des prix
        </button>
      </div>
    </div>
  );
}
