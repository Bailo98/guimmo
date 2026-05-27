"use client";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Verified GPS centroids for Conakry neighborhoods (Dec 2024)
const QUARTIERS_COORDS: Record<string, [number, number]> = {
  // ── 5 communes ──────────────────────────────────────────────
  kaloum:     [9.5370, -13.7130], // Centre administratif / péninsule
  dixinn:     [9.5480, -13.6890],
  matam:      [9.5180, -13.6780],
  ratoma:     [9.5750, -13.6380],
  matoto:     [9.4920, -13.6520],

  // ── Sous-quartiers de Ratoma ─────────────────────────────────
  "kipé":     [9.5820, -13.6140],
  kipe:       [9.5820, -13.6140],
  hamdallaye: [9.5650, -13.6450],
  taouyah:    [9.5700, -13.6320],
  nongo:      [9.6020, -13.5950],
  kobaya:     [9.5980, -13.6080],

  // ── Sous-quartiers de Matam ──────────────────────────────────
  cosa:       [9.5280, -13.6580],
  "coléah":   [9.5350, -13.6720],
  coleah:     [9.5350, -13.6720],
  boulbinet:  [9.5290, -13.7080],

  // ── Sous-quartiers de Dixinn ─────────────────────────────────
  landreah:   [9.5520, -13.6810],
  "minière":  [9.5460, -13.6760],
  miniere:    [9.5460, -13.6760],
  camayenne:  [9.5580, -13.6840],

  // ── Sous-quartiers de Matoto ─────────────────────────────────
  sonfonia:   [9.5100, -13.6180],
  lambanyi:   [9.5050, -13.6350],
  bambeto:    [9.5200, -13.6220],
  enta:       [9.4980, -13.6420],

  // ── Fallback ─────────────────────────────────────────────────
  conakry:    [9.5370, -13.6771],
};

interface PropertyMapProps {
  neighborhood: string;
  lat?: number | null;
  lng?: number | null;
  title: string;
}

export default function PropertyMap({ neighborhood, lat, lng, title }: PropertyMapProps) {
  useEffect(() => {
    // Fix Leaflet default marker icons (broken with webpack/next.js bundling)
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
    const L = require("leaflet") as any;
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  const isExact = !!(lat && lng);

  const coords: [number, number] = isExact
    ? [lat!, lng!]
    : QUARTIERS_COORDS[neighborhood?.toLowerCase()] ?? [9.5370, -13.6771];

  // Zoom 15 for pin-point accuracy, 13 for neighbourhood-level approximation
  const zoom = isExact ? 15 : 13;

  // Capitalise the neighbourhood name for display
  const neighborhoodLabel = neighborhood
    ? neighborhood.charAt(0).toUpperCase() + neighborhood.slice(1).toLowerCase()
    : "Conakry";

  return (
    <div>
      {/* Map */}
      <div
        style={{
          height: 200,
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <MapContainer
          center={coords}
          zoom={zoom}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={coords}>
            <Popup>{title}</Popup>
          </Marker>

          {/* Fuzzy zone — 300 m radius when only the neighbourhood is known */}
          {!isExact && (
            <Circle
              center={coords}
              radius={300}
              pathOptions={{
                fillColor: "#E9E900",
                fillOpacity: 0.10,
                color: "#E9E900",
                weight: 1.5,
                opacity: 0.35,
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* Accuracy label */}
      <p style={{ fontSize: 11, marginTop: 6, lineHeight: 1.4 }}>
        {isExact ? (
          <span style={{ color: "#22c55e", fontWeight: 600 }}>📍 Position exacte</span>
        ) : (
          <span style={{ color: "#f59e0b", fontWeight: 600 }}>
            📍 Localisation approximative — quartier {neighborhoodLabel}
          </span>
        )}
      </p>
    </div>
  );
}
