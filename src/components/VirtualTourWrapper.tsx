"use client";
import dynamic from "next/dynamic";
import type { VTRoom } from "@/components/VirtualTour";

const VirtualTour = dynamic(
  () => import("@/components/VirtualTour").then((m) => m.VirtualTour),
  {
    ssr: false,
    loading: () => (
      <div style={{
        height: "200px",
        background: "var(--bg-card)",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#1e2a30",
        fontSize: "14px",
      }}>
        Chargement de la visite...
      </div>
    ),
  }
);

interface Props {
  rooms: VTRoom[];
}

export default function VirtualTourWrapper({ rooms }: Props) {
  return <VirtualTour rooms={rooms} />;
}
