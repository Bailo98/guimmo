"use client";

import { BadgeCheck, Flame, Plane, Star } from "lucide-react";

export type BadgeType = "verified" | "new" | "premium" | "diaspora";

interface PropertyBadgeProps {
  type: BadgeType;
}

const BADGE_CONFIG: Record<
  BadgeType,
  { label: string; bg: string; color: string; border: string; Icon: typeof BadgeCheck }
> = {
  verified: {
    label: "Vérifié",
    bg: "rgba(76,175,80,0.20)",
    color: "#4CAF50",
    border: "1px solid rgba(76,175,80,0.40)",
    Icon: BadgeCheck,
  },
  new: {
    label: "Nouveau",
    bg: "rgba(255,107,53,0.20)",
    color: "#FF6B35",
    border: "1px solid rgba(255,107,53,0.40)",
    Icon: Flame,
  },
  premium: {
    label: "Premium",
    bg: "rgba(212,175,55,0.15)",
    color: "var(--accent-gold)",
    border: "1px solid rgba(212,175,55,0.40)",
    Icon: Star,
  },
  diaspora: {
    label: "Diaspora",
    bg: "rgba(74,158,255,0.20)",
    color: "#4A9EFF",
    border: "1px solid rgba(74,158,255,0.40)",
    Icon: Plane,
  },
};

export function PropertyBadge({ type }: PropertyBadgeProps) {
  const cfg = BADGE_CONFIG[type];
  const Icon = cfg.Icon;
  return (
    <span
      style={{
        background: cfg.bg,
        color: cfg.color,
        border: cfg.border,
        borderRadius: "var(--radius-chip)",
        minHeight: 28,
        padding: "5px 10px",
        fontSize: 12,
        fontWeight: 900,
        whiteSpace: "nowrap",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        lineHeight: 1,
      }}
    >
      <Icon style={{ width: 14, height: 14 }} strokeWidth={2.4} />
      {cfg.label}
    </span>
  );
}

// Type-coloured badge (always visible, specific background per property type)
const TYPE_BADGE_COLORS: Record<string, { bg: string; color: string }> = {
  house:     { bg: "rgba(200,151,58,0.85)",  color: "var(--text-primary)" },
  villa:     { bg: "rgba(200,151,58,0.85)",  color: "var(--text-primary)" },
  apartment: { bg: "rgba(74,158,255,0.85)",  color: "var(--text-primary)" },
  studio:    { bg: "rgba(74,158,255,0.85)",  color: "var(--text-primary)" },
  land:      { bg: "rgba(76,175,80,0.85)",   color: "var(--text-primary)" },
  office:    { bg: "rgba(156,107,255,0.85)", color: "var(--text-primary)" },
  shop:      { bg: "rgba(156,107,255,0.85)", color: "var(--text-primary)" },
  room:      { bg: "rgba(255,107,53,0.85)",  color: "var(--text-primary)" },
};

const TYPE_LABELS_BADGE: Record<string, string> = {
  apartment: "Appartement", house: "Maison", studio: "Studio",
  villa: "Villa", room: "Chambre", office: "Bureau", shop: "Boutique", land: "Terrain",
};

interface TypeBadgeProps {
  propertyType: string;
}

export function TypeBadge({ propertyType }: TypeBadgeProps) {
  const cfg = TYPE_BADGE_COLORS[propertyType] ?? { bg: "rgba(10,18,22,0.70)", color: "rgba(255,255,255,0.85)" };
  const label = TYPE_LABELS_BADGE[propertyType] ?? propertyType;
  return (
    <span
      style={{
        background: cfg.bg,
        color: cfg.color,
        borderRadius: "var(--radius-chip)",
        minHeight: 28,
        padding: "5px 10px",
        fontSize: 12,
        fontWeight: 900,
        whiteSpace: "nowrap",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "inline-flex",
        alignItems: "center",
        lineHeight: 1,
      }}
    >
      {label}
    </span>
  );
}
