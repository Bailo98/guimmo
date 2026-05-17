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
        background: "#0f2210",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "rgba(134,239,172,0.5)",
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
