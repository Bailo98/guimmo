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
        background: "#1a2e1e",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "rgba(240,230,204,0.5)",
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
