"use client";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const QUARTIERS_COORDS: Record<string, [number, number]> = {
  kipe:        [9.5370, -13.6140],
  kipé:        [9.5370, -13.6140],
  hamdallaye:  [9.5480, -13.6770],
  ratoma:      [9.5600, -13.6300],
  dixinn:      [9.5230, -13.6710],
  matam:       [9.5150, -13.6850],
  kaloum:      [9.5090, -13.7130],
  taouyah:     [9.5720, -13.6530],
  cosa:        [9.5300, -13.6200],
  matoto:      [9.4980, -13.6480],
  nongo:       [9.5850, -13.5870],
  lambanyi:    [9.5420, -13.6600],
  sonfonia:    [9.6100, -13.5800],
  kobaya:      [9.5950, -13.6100],
  madina:      [9.5280, -13.6560],
  conakry:     [9.5370, -13.6771],
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

  const coords: [number, number] =
    lat && lng
      ? [lat, lng]
      : QUARTIERS_COORDS[neighborhood?.toLowerCase()] ?? [9.5370, -13.6771];

  return (
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
        zoom={15}
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
      </MapContainer>
    </div>
  );
}
