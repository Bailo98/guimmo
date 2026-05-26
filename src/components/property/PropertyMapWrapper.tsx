"use client";
/**
 * Thin client-side wrapper around PropertyMap.
 * next/dynamic with ssr:false must live in a Client Component.
 */
import dynamic from "next/dynamic";

const PropertyMap = dynamic(() => import("./PropertyMap"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 200,
        borderRadius: 16,
        background: "#1a252b",
        border: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ color: "rgba(255,255,255,0.30)", fontSize: 13 }}>
        Chargement de la carte…
      </span>
    </div>
  ),
});

export interface PropertyMapWrapperProps {
  neighborhood: string;
  lat?: number | null;
  lng?: number | null;
  title: string;
}

export default function PropertyMapWrapper(props: PropertyMapWrapperProps) {
  return <PropertyMap {...props} />;
}
