"use client";
import { useEffect, useRef } from "react";

const NEIGHBORHOOD_COORDS: Record<string, [number, number]> = {
  kipe: [9.5370, -13.6729],
  lambanyi: [9.5200, -13.6600],
  ratoma: [9.5500, -13.6800],
  sonfonia: [9.6000, -13.6500],
  cosa: [9.5100, -13.6400],
  hamdallaye: [9.5600, -13.6900],
  nongo: [9.6200, -13.7100],
  taouyah: [9.5450, -13.6750],
  dixinn: [9.5250, -13.6550],
  matam: [9.5150, -13.6850],
  madina: [9.5300, -13.7000],
  kaloum: [9.5095, -13.7122],
};

interface PropertyDetailMapProps {
  neighborhood: string;
}

export function PropertyDetailMap({ neighborhood }: PropertyDetailMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const coords = NEIGHBORHOOD_COORDS[neighborhood] ?? [9.537, -13.677];
    // Read dark mode from DOM at mount time (safe: this runs only in browser)
    const isDark = document.documentElement.classList.contains("dark");

    let isMounted = true;

    async function initMap() {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (!isMounted || !mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current, {
        center: coords,
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      mapInstanceRef.current = map;

      const tileUrl = isDark
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

      L.tileLayer(tileUrl, {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }).addTo(map);

      const orangeIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:28px;height:28px;
          background:var(--accent-gold);
          border:3px solid #fff;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          box-shadow:0 2px 8px rgba(0,0,0,0.4);
        "></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });

      L.marker(coords, { icon: orangeIcon }).addTo(map);
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
  }, [neighborhood]);

  return <div ref={mapRef} className="w-full h-full" />;
}
