"use client";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const textSizes = { sm: "text-xl", md: "text-2xl", lg: "text-3xl" };
const imgSizes  = { sm: 28, md: 32, lg: 40 };

export function Logo({ size = "md", className }: LogoProps) {
  const px = imgSizes[size];

  return (
    <Link href="/" className={cn("flex items-center gap-2", textSizes[size], className)}>
      <img
        src="/logo.png"
        alt=""
        width={px}
        height={px}
        style={{ borderRadius: "50%", width: px, height: px, objectFit: "cover", flexShrink: 0 }}
      />
      <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, letterSpacing: "-0.01em" }}>
        <span style={{ color: "#CE1126" }}>Gu</span>
        <span style={{ color: "#FCD116" }}>I</span>
        <span style={{ color: "#009460" }}>mmo</span>
      </span>
    </Link>
  );
}
