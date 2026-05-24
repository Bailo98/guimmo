"use client";

export type BadgeType = "verified" | "new" | "premium" | "diaspora";

interface PropertyBadgeProps {
  type: BadgeType;
}

const BADGE_CONFIG: Record<
  BadgeType,
  { label: string; bg: string; color: string; border: string }
> = {
  verified: {
    label: "✅ Vérifié",
    bg: "rgba(76,175,80,0.20)",
    color: "#4CAF50",
    border: "1px solid rgba(76,175,80,0.40)",
  },
  new: {
    label: "🔥 Nouveau",
    bg: "rgba(255,107,53,0.20)",
    color: "#FF6B35",
    border: "1px solid rgba(255,107,53,0.40)",
  },
  premium: {
    label: "⭐ Premium",
    bg: "rgba(200,169,126,0.20)",
    color: "#C8A97E",
    border: "1px solid rgba(200,169,126,0.40)",
  },
  diaspora: {
    label: "✈️ Diaspora",
    bg: "rgba(74,158,255,0.20)",
    color: "#4A9EFF",
    border: "1px solid rgba(74,158,255,0.40)",
  },
};

export function PropertyBadge({ type }: PropertyBadgeProps) {
  const cfg = BADGE_CONFIG[type];
  return (
    <span
      style={{
        background: cfg.bg,
        color: cfg.color,
        border: cfg.border,
        borderRadius: 20,
        padding: "3px 10px",
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: "nowrap",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "inline-flex",
        alignItems: "center",
        lineHeight: 1.6,
      }}
    >
      {cfg.label}
    </span>
  );
}
