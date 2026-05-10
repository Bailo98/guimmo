import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Logo({ size = "md", className }: LogoProps) {
  const sizes = { sm: "text-xl", md: "text-2xl", lg: "text-3xl" };

  return (
    <Link href="/" className={cn("flex items-center gap-0 font-black tracking-tight", sizes[size], className)}>
      <span style={{ color: "#CE1126" }}>Gu</span>
      <span style={{ color: "#FCD116" }}>Im</span>
      <span style={{ color: "#009460" }}>mo</span>
    </Link>
  );
}
