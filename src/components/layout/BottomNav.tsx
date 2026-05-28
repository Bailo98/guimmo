"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Heart, Home, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

// 4 items fixes : Découvrir | Favoris | Annonces | Profil
interface NavItemDef {
  href: string;
  icon: React.ElementType;
  label: string;
  authRequired: boolean;
  unauthHref?: string;
}

const NAV_ITEMS: NavItemDef[] = [
  // authRequired:true → item hidden entirely when user is not logged in
  { href: "/decouvrir", icon: Compass, label: "Découvrir", authRequired: true  },
  { href: "/favoris",   icon: Heart,   label: "Favoris",   authRequired: true  },
  { href: "/annonces",  icon: Home,    label: "Annonces",  authRequired: false },
  // Profil always visible; unauthHref sends guests to /connexion
  { href: "/compte",    icon: User,    label: "Profil",    authRequired: false, unauthHref: "/connexion" },
];

const GOLD  = "#D4AF37";
const MUTED = "#8A8FA8";

export function BottomNav() {
  const pathname = usePathname();
  const { user }  = useAuth();

  // Hidden on /decouvrir (full-screen swipe), /admin and /auth routes
  if (pathname === "/decouvrir") return null;
  if (pathname.startsWith("/admin") || pathname.startsWith("/auth")) return null;

  function isActive(href: string) {
    if (href === "/decouvrir") return pathname === "/decouvrir";
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

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
        maxWidth: 320,
        width: "auto",
        padding: "0 8px",
        borderRadius: 40,

        /* Glass surface */
        background: "rgba(22,27,38,0.96)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.20)",

        /* Layout */
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      {NAV_ITEMS.filter((item) => !item.authRequired || !!user).map(({ href, icon: Icon, label, authRequired, unauthHref }) => {
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
              padding: "6px 14px",
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
