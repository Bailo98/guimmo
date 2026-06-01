"use client";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  href?: string;
}

const CONFIG = {
  sm: { box: 32, icon: 17, text: 17 },
  md: { box: 36, icon: 20, text: 18 },
  lg: { box: 44, icon: 24, text: 22 },
};

function HouseIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

export function Logo({ size = "md", className, href = "/" }: LogoProps) {
  const { box, icon, text } = CONFIG[size];
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)}>
      <div style={{
        width: box, height: box, background: "var(--accent-gold-dark)", borderRadius: 8,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <HouseIcon size={icon} />
      </div>
      <span style={{
        fontFamily: '"Playfair Display", var(--font-playfair), Georgia, serif',
        fontSize: text, fontWeight: 800, color: "var(--logo-text)",
        letterSpacing: "0.02em",
      }}>
        LogerBien
      </span>
    </Link>
  );
}
