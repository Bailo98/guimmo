"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Property } from "@/types";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { LocateFixed, X } from "lucide-react";

// Verified Conakry neighbourhood centroids
const QUARTIERS_COORDS: Record<string, [number, number]> = {
  kaloum:     [9.5370, -13.7130],
  dixinn:     [9.5480, -13.6890],
  matam:      [9.5180, -13.6780],
  ratoma:     [9.5750, -13.6380],
  matoto:     [9.4920, -13.6520],
  kipe:       [9.5820, -13.6140],
  hamdallaye: [9.5650, -13.6450],
  taouyah:    [9.5700, -13.6320],
  nongo:      [9.6020, -13.5950],
  cosa:       [9.5280, -13.6580],
  coleah:     [9.5350, -13.6720],
  sonfonia:   [9.5100, -13.6180],
  lambanyi:   [9.5050, -13.6350],
  conakry:    [9.5370, -13.6771],
};

const NEIGHBORHOOD_LABELS: Record<string, string> = {
  kipe: "Kipé", lambanyi: "Lambanyi", ratoma: "Ratoma", sonfonia: "Sonfonia",
  cosa: "Cosa", hamdallaye: "Hamdallaye", nongo: "Nongo", taouyah: "Taouyah",
  dixinn: "Dixinn", matam: "Matam", madina: "Madina", kaloum: "Kaloum",
};

interface AnnoncesMapProps {
  properties: Property[];
}

function getCoords(p: Property): [number, number] | null {
  if (p.lat && p.lng) return [p.lat, p.lng];
  if (p.latitude && p.longitude) return [p.latitude, p.longitude];
  const c = QUARTIERS_COORDS[p.neighborhood?.toLowerCase() ?? ""];
  return c ?? null;
}

/** Helper: fly to user position from inside MapContainer */
function FlyToPos({ pos }: { pos: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.flyTo(pos, 15, { duration: 1.2 });
  }, [map, pos]);
  return null;
}

export default function AnnoncesMap({ properties }: AnnoncesMapProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [L, setL] = useState<any>(null);
  const [selected, setSelected] = useState<Property | null>(null);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const markersRef = useRef<Map<string, unknown>>(new Map());

  // Load Leaflet client-side only
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
    const leaflet = require("leaflet") as any;
    delete leaflet.Icon.Default.prototype._getIconUrl;
    setL(leaflet);
  }, []);

  const createPriceIcon = useCallback(
    (price: number, period?: string) => {
      if (!L) return undefined;
      const millions = price >= 1_000_000
        ? `${(price / 1_000_000).toFixed(price % 1_000_000 === 0 ? 0 : 1)}M`
        : `${Math.round(price / 1000)}k`;
      const suffix = period === "month" ? "/m" : "";
      return L.divIcon({
        className: "",
        html: `<div style="color:#A07820;font-size:11px;font-weight:800;white-space:nowrap;cursor:pointer;text-shadow:0 1px 3px rgba(255,255,255,0.9);">${millions}${suffix} GNF</div>`,
        iconAnchor: [0, 0],
        iconSize: [0, 0],
      });
    },
    [L]
  );

  function handleLocateMe() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  }

  const mappable = properties.filter((p) => getCoords(p) !== null);
  const neighbourhoodLabel = (n: string) =>
    NEIGHBORHOOD_LABELS[n] ?? n?.charAt(0).toUpperCase() + n?.slice(1);

  return (
    <div style={{ position: "relative" }}>
      <MapContainer
        center={[9.5370, -13.6771]}
        zoom={13}
        style={{ height: "calc(100vh - 180px)", width: "100%" }}
        scrollWheelZoom
        zoomControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {L &&
          mappable.map((p) => {
            const coords = getCoords(p)!;
            const icon = createPriceIcon(p.price, p.price_period);
            return (
              <Marker
                key={p.id}
                position={coords}
                icon={icon}
                ref={(ref) => { if (ref) markersRef.current.set(p.id, ref); }}
                eventHandlers={{ click: () => setSelected(p) }}
              />
            );
          })}
        <FlyToPos pos={userPos} />
      </MapContainer>

      {/* "📍 Ma position" button */}
      <button
        onClick={handleLocateMe}
        disabled={locating}
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 1000,
          background: "rgba(26,37,43,0.96)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 12,
          padding: "9px 14px",
          color: userPos ? "#D4AF37" : "rgba(255,255,255,0.80)",
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 2px 12px rgba(0,0,0,0.35)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          minHeight: "auto",
          letterSpacing: 0,
          textTransform: "none",
        }}
      >
        {locating ? (
          <span
            style={{
              width: 14,
              height: 14,
              border: "2px solid rgba(255,255,255,0.3)",
              borderTopColor: "#D4AF37",
              borderRadius: "50%",
              display: "inline-block",
              animation: "spin 0.7s linear infinite",
            }}
          />
        ) : (
          <LocateFixed size={14} />
        )}
        Ma position
      </button>

      {/* Mini card panel */}
      {selected && (
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: 16,
            right: 16,
            zIndex: 1000,
            background: "rgba(17,26,31,0.98)",
            borderRadius: 20,
            padding: "12px 12px 12px 12px",
            display: "flex",
            gap: 12,
            alignItems: "center",
            boxShadow: "0 8px 32px rgba(0,0,0,0.60)",
            border: "1px solid rgba(255,255,255,0.10)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          {/* Thumb */}
          {(selected.property_images ?? []).length > 0 && (
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 14,
                overflow: "hidden",
                flexShrink: 0,
                position: "relative",
              }}
            >
              <Image
                src={selected.property_images![0].url}
                alt={selected.title}
                fill
                style={{ objectFit: "cover" }}
                sizes="80px"
              />
            </div>
          )}

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                color: "#D4AF37",
                fontWeight: 800,
                fontSize: 15,
                lineHeight: 1.2,
              }}
            >
              {formatPrice(selected.price)}
              {selected.price_period === "month" && (
                <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.75 }}>/mois</span>
              )}
            </p>
            <p
              style={{
                color: "var(--text-primary)",
                fontWeight: 600,
                fontSize: 13,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                margin: "2px 0",
              }}
            >
              {selected.title}
            </p>
            <p style={{ color: "var(--text-primary-faint)", fontSize: 11 }}>
              📍 {neighbourhoodLabel(selected.neighborhood)}
            </p>
          </div>

          {/* Actions */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <Link
              href={`/annonces/${selected.id}`}
              style={{
                background: "#D4AF37",
                color: "var(--bg-primary)",
                fontWeight: 800,
                fontSize: 13,
                padding: "8px 16px",
                borderRadius: 10,
                textDecoration: "none",
                whiteSpace: "nowrap",
                display: "block",
                textAlign: "center",
              }}
            >
              Voir →
            </Link>
            <button
              onClick={() => setSelected(null)}
              style={{
                background: "var(--border-subtle)",
                border: "none",
                borderRadius: 10,
                padding: "6px 10px",
                color: "rgba(255,255,255,0.50)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "auto",
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
