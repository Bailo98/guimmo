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
      <path d="M2 10.2 12 2.4l10 7.8" />
      <path d="M4.2 9.6V20a2 2 0 0 0 2 2h11.6a2 2 0 0 0 2-2V9.6" />
      <polyline points="9 22 9 13 15 13 15 22" />
    </svg>
  );
}

export function Logo({ size = "md", className, href = "/" }: LogoProps) {
  const { box, icon, text } = CONFIG[size];
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)}>
      <div style={{
        width: box, height: box,
        background: "linear-gradient(135deg, var(--accent-gold), var(--accent-gold-dark))",
        borderRadius: 8,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <HouseIcon size={icon} />
      </div>
      <span style={{
        fontFamily: '"Playfair Display", serif',
        fontSize: text, fontWeight: 800, color: "var(--logo-text)",
        letterSpacing: "0.02em",
      }}>
        LogerBien
      </span>
    </Link>
  );
}
