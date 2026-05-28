"use client";
import { useState } from "react";
import { VisitRequestModal } from "./VisitRequestModal";

interface Props {
  propertyId: string;
  ownerId: string;
  propertyTitle: string;
}

export function VisitButton({ propertyId, ownerId, propertyTitle }: Props) {
  const [open, setOpen] = useState(false);

  function openModal() {
    setOpen(true);
    document.body.style.overflow = "hidden";
  }

  return (
    <>
      <button
        onClick={openModal}
        className="flex-1 flex items-center justify-center gap-1.5 text-white font-semibold rounded-xl text-sm"
        style={{ background: "var(--color-border)", border: "1px solid rgba(255,255,255,0.20)", minHeight: "48px" }}
      >
        🏠 Je veux visiter
      </button>
      {open && (
        <VisitRequestModal
          propertyId={propertyId}
          ownerId={ownerId}
          propertyTitle={propertyTitle}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
