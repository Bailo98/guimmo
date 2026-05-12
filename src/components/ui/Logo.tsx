import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const heights = { sm: 32, md: 40, lg: 48 };

export function Logo({ size = "md", className }: LogoProps) {
  const h = heights[size];
  const w = Math.round(h * 3);

  return (
    <Link href="/" className={cn("flex items-center", className)}>
      <Image src="/logo.png" alt="GuImmo" width={w} height={h} style={{ height: h, width: "auto" }} priority />
    </Link>
  );
}
