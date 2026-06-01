"use client";

import { useState } from "react";
import { CalendarCheck, Play } from "lucide-react";
import type { Property } from "@/types";
import { VisitBookingModal } from "./VisitBookingModal";

interface Props {
  property: Property;
}

export function PropertyActionButtons({ property }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<"physical" | "virtual">("physical");

  function openPhysical() {
    setInitialTab("physical");
    setModalOpen(true);
  }

  function openVirtual() {
    setInitialTab("virtual");
    setModalOpen(true);
  }

  return (
    <>
      {/* Bouton réserver une visite */}
      <button
        onClick={openPhysical}
        className="w-full bg-[var(--accent-gold)] hover:bg-[#B8963A] active:scale-95 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm transition-all shadow-[0_4px_20px_rgba(212,175,55,0.25)]"
      >
        <CalendarCheck className="w-4 h-4" />
        Réserver une visite
      </button>

      {/* Bouton visite 360° (si disponible) */}
      {property.has_virtual_tour && (
        <button
          onClick={openVirtual}
          className="w-full border border-[var(--accent-gold)] text-[var(--accent-gold)] hover:bg-orange-50 dark:hover:bg-orange-900/10 active:scale-95 font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-all"
        >
          <Play className="w-4 h-4" />
          Visite virtuelle 360°
        </button>
      )}

      {/* Modal */}
      {modalOpen && (
        <VisitBookingModal
          property={property}
          initialTab={initialTab}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
