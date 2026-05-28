import { cn } from "@/lib/utils";
import { CheckCircle, Shield, UserCheck, Building, Camera, Zap, Star, MapPin, ShieldCheck } from "lucide-react";
import type { Badge as BadgeType } from "@/types";

const ICONS = {
  phone_verified: CheckCircle,
  listing_verified: Shield,
  owner_verified: UserCheck,
  agency_verified: Building,
  real_photos: Camera,
  quick_response: Zap,
  top_agent: Star,
  visit_confirmed: MapPin,
  verified_onsite: ShieldCheck,
};

const COLORS = {
  green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-[#D4AF37]",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  gold: "bg-[#D4AF37]/10 text-[#8B6914] dark:bg-[#D4AF37]/15 dark:text-[#D4AF37] border border-[#D4AF37]/30 dark:border-[#D4AF37]/40",
};

interface BadgeProps {
  badge: BadgeType;
  showLabel?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function TrustBadge({ badge, showLabel = true, size = "sm", className }: BadgeProps) {
  const Icon = ICONS[badge.type] ?? CheckCircle;
  const colorClass = COLORS[badge.color] ?? COLORS.green;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold",
        size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1",
        colorClass,
        className
      )}
    >
      <Icon className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
      {showLabel && badge.label}
    </span>
  );
}
