import type { Property } from "@/types";

export type AvailabilityStatus = "available_now" | "available_soon" | "rented" | "paused";

export function getAvailabilityStatus(
  property: Pick<Property, "availability_status" | "available_now" | "status">
): AvailabilityStatus {
  if (property.availability_status) return property.availability_status;
  if (property.status === "rented" || property.status === "sold") return "rented";
  if (property.status === "paused") return "paused";
  if (property.available_now === false) return "rented";
  return "available_now";
}

export function isPubliclyAvailable(
  property: Pick<Property, "availability_status" | "available_now" | "status">
) {
  const status = getAvailabilityStatus(property);
  return status === "available_now" || status === "available_soon";
}

export function availabilitySignal(
  property: Pick<Property, "availability_status" | "available_now" | "status" | "available_date">
) {
  const status = getAvailabilityStatus(property);

  if (status === "available_soon") {
    return {
      label: "Bientot dispo",
      color: "#ca8a04",
      bg: "rgba(250,204,21,0.16)",
      border: "rgba(250,204,21,0.38)",
    };
  }

  if (status === "rented") {
    return {
      label: "Deja loue",
      color: "#ef4444",
      bg: "rgba(239,68,68,0.16)",
      border: "rgba(239,68,68,0.38)",
    };
  }

  if (status === "paused") {
    return {
      label: "Indisponible",
      color: "#94a3b8",
      bg: "rgba(148,163,184,0.16)",
      border: "rgba(148,163,184,0.32)",
    };
  }

  return {
    label: "Disponible",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.16)",
    border: "rgba(34,197,94,0.38)",
  };
}

export function publishedSignal(createdAt?: string) {
  if (!createdAt) return null;
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return null;
  const days = Math.max(0, Math.floor((Date.now() - created) / 86_400_000));
  if (days === 0) return { label: "Aujourd'hui", color: "#22c55e" };
  if (days === 1) return { label: "Hier", color: "#ca8a04" };
  return { label: `Il y a ${days} jours`, color: "#e5e7eb" };
}

export function advanceSignal(property: Pick<Property, "advance_required" | "advance_months">) {
  if (!property.advance_required) return "Sans avance";
  return "Avance demandee";
}
