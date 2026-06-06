"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Heart, Home, List, MessageCircle, Plus, Search, User } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth-context";

interface NavItemDef {
  href: string;
  icon: React.ElementType;
  label: string;
  authRequired: boolean;
  unauthHref?: string;
}

const GOLD = "var(--accent-gold)";

export function BottomNav() {
  const pathname = usePathname();
  const { user, profile }  = useAuth();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 1200);
    return () => window.clearTimeout(id);
  }, []);

  const isLight = mounted && resolvedTheme === "light";
  const MUTED   = isLight ? "#5A4A2A" : "#8A8FA8";
  const pillBg  = isLight ? "rgba(245,235,215,0.95)" : "rgba(22,27,38,0.96)";
  const pillBorder = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";

  // Hidden on /decouvrir (full-screen swipe), /admin and /auth routes
  if (pathname === "/decouvrir") return null;
  if (pathname.startsWith("/admin") || pathname.startsWith("/auth")) return null;

  function isActive(href: string) {
    if (href === "/decouvrir") return pathname === "/decouvrir";
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const accountType = profile?.account_type ?? profile?.role ?? "";
  const isOwner = ["owner", "proprietaire", "agent", "agence", "agency", "admin"].includes(accountType);
  const navItems: NavItemDef[] = user
    ? isOwner
      ? [
          { href: "/compte/annonces", icon: List, label: "Mes biens", authRequired: true },
          { href: "/publier/rapide", icon: Plus, label: "Publier", authRequired: true },
          { href: "/annonces?recent=1", icon: Home, label: "Récentes", authRequired: false },
          { href: "/messages", icon: MessageCircle, label: "Contacts", authRequired: true },
          { href: "/compte", icon: User, label: "Profil", authRequired: true },
        ]
      : [
          { href: "/annonces", icon: Search, label: "Chercher", authRequired: false },
          { href: "/decouvrir", icon: Compass, label: "Voir", authRequired: true },
          { href: "/annonces?recent=1", icon: Home, label: "Récentes", authRequired: false },
          { href: "/favoris", icon: Heart, label: "Favoris", authRequired: true },
          { href: "/compte", icon: User, label: "Profil", authRequired: true },
        ]
    : [
        { href: "/annonces", icon: Home, label: "Annonces", authRequired: false },
        { href: "/connexion", icon: User, label: "Profil", authRequired: false },
      ];

  return (
    <nav
      className="md:hidden"
      style={{
        position: "fixed",
        bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,

        /* Pill geometry */
        height: 60,
        maxWidth: 360,
        width: "auto",
        padding: "0 8px",
        borderRadius: 40,

        /* Glass surface */
        background: pillBg,
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        border: `1px solid ${pillBorder}`,
        boxShadow: isLight
          ? "0 4px 20px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)"
          : "0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.20)",

        /* Layout */
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      {navItems.filter((item) => !item.authRequired || !!user).map(({ href, icon: Icon, label, authRequired, unauthHref }) => {
        const dest =
          !user && authRequired
            ? `/connexion?redirect=${href}`
            : !user && unauthHref
            ? unauthHref
            : href;

        const active = isActive(href);

        return (
          <Link
            key={href}
            href={dest}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              padding: navItems.length >= 5 ? "6px 10px" : "6px 14px",
              borderRadius: 30,
              textDecoration: "none",
              background: active ? "rgba(212,175,55,0.15)" : "transparent",
              transition: "all 0.2s ease",
              minHeight: "auto",
            }}
          >
            <Icon
              style={{
                width: 22,
                height: 22,
                color: active ? GOLD : MUTED,
                strokeWidth: active ? 2.2 : 1.8,
                transition: "color 0.2s ease",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: active ? GOLD : MUTED,
                lineHeight: 1,
                whiteSpace: "nowrap",
                transition: "color 0.2s ease",
              }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
