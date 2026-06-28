"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Heart, Home, List, LogIn, MessageCircle, Plus, Search, User } from "lucide-react";
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
  const { user, profile, loading }  = useAuth();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 1200);
    return () => window.clearTimeout(id);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const MUTED = isDark ? "rgba(255,255,255,0.66)" : "#4f4535";
  const pillBg = isDark ? "rgba(15,15,15,0.72)" : "rgba(250,246,237,0.94)";
  const pillBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(185,138,46,0.22)";

  // Hidden on /decouvrir (full-screen swipe), /admin and /auth routes
  if (pathname === "/decouvrir") return null;
  if (pathname.startsWith("/admin") || pathname.startsWith("/auth")) return null;
  if (loading) return null;

  function isActive(href: string) {
    if (href === "/decouvrir") return pathname === "/decouvrir";
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const accountType = String(profile?.account_type ?? "");
  const role = String(profile?.role ?? "");
  const isOwner =
    ["owner", "proprietaire", "agent", "agence", "agency", "admin"].includes(accountType)
    || ["owner", "proprietaire", "agent", "agence", "agency", "admin"].includes(role);

  let navItems: NavItemDef[];
  if (!user) {
    navItems = [
      { href: "/annonces", icon: Search, label: "Chercher", authRequired: false },
      { href: "/", icon: Home, label: "Accueil", authRequired: false },
      { href: "/connexion", icon: LogIn, label: "Connexion", authRequired: false },
      { href: "/inscription", icon: User, label: "S'inscrire", authRequired: false },
    ];
  } else if (isOwner) {
    navItems = [
      { href: "/compte/annonces", icon: List, label: "Mes biens", authRequired: true },
      { href: "/", icon: Home, label: "Accueil", authRequired: false },
      { href: "/publier/rapide", icon: Plus, label: "Publier", authRequired: true },
      { href: "/messages", icon: MessageCircle, label: "Contacts", authRequired: true },
      { href: "/compte", icon: User, label: "Profil", authRequired: true },
    ];
  } else {
    navItems = [
      { href: "/annonces", icon: Search, label: "Chercher", authRequired: false },
      { href: "/", icon: Home, label: "Accueil", authRequired: false },
      { href: "/decouvrir", icon: Compass, label: "Voir", authRequired: true },
      { href: "/favoris", icon: Heart, label: "Favoris", authRequired: true },
      { href: "/compte", icon: User, label: "Profil", authRequired: true },
    ];
  }

  return (
    <nav
      className="mobile-bottom-nav flex md:hidden"
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,

        /* Pill geometry */
        height: "calc(64px + env(safe-area-inset-bottom, 0px))",
        width: "min(92vw, 420px)",
        padding: "6px 8px max(6px, env(safe-area-inset-bottom, 0px))",
        borderRadius: 999,

        /* Glass surface */
        background: pillBg,
        backdropFilter: "blur(18px) saturate(150%)",
        WebkitBackdropFilter: "blur(18px) saturate(150%)",
        border: `1px solid ${pillBorder}`,
        boxShadow: isDark
          ? "0 18px 40px rgba(0,0,0,0.35)"
          : "0 18px 40px rgba(0,0,0,0.18)",

        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
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
              justifyContent: "center",
              gap: 3,
              height: 50,
              flex: "1 1 0",
              padding: "5px 6px",
              borderRadius: 999,
              textDecoration: "none",
              background: active ? "rgba(191,141,38,0.16)" : "transparent",
              boxShadow: active ? "inset 0 0 0 1px rgba(191,141,38,0.12)" : "none",
              transition: "background 0.2s ease, color 0.2s ease, transform 0.2s ease",
              minHeight: "auto",
              overflow: "hidden",
            }}
          >
            <Icon
              style={{
                width: 20,
                height: 20,
                color: active ? GOLD : MUTED,
                strokeWidth: active ? 2.45 : 2,
                transition: "color 0.2s ease",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 10.5,
                fontWeight: active ? 800 : 700,
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
