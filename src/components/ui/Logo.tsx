import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const heights = { sm: 28, md: 36, lg: 44 };

export function Logo({ size = "md", className }: LogoProps) {
  const h = heights[size];
  const w = Math.round(h * (160 / 48));

  return (
    <Link href="/" className={cn("flex items-center", className)}>
      <img src="/logo-text.svg" alt="GuImmo" height={h} width={w} style={{ height: h, width: w }} />
    </Link>
  );
}
