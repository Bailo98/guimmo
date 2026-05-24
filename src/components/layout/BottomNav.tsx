"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Heart, Home, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

// 4 items fixes : Découvrir | Favoris | Annonces | Profil
// Messages accessibles uniquement depuis /compte (dashboard)

interface NavItemDef {
  href: string;
  icon: React.ElementType;
  label: string;
  authRequired: boolean;
  unauthHref?: string;
}

const NAV_ITEMS: NavItemDef[] = [
  { href: "/decouvrir", icon: Compass, label: "Découvrir", authRequired: false },
  { href: "/favoris",   icon: Heart,   label: "Favoris",   authRequired: true  },
  { href: "/annonces",  icon: Home,    label: "Annonces",  authRequired: false },
  { href: "/compte",    icon: User,    label: "Profil",    authRequired: false, unauthHref: "/connexion" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (pathname.startsWith("/admin") || pathname.startsWith("/auth")) return null;

  function isActive(href: string) {
    if (href === "/decouvrir") return pathname === "/decouvrir";
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const GOLD  = "var(--accent-gold, #C8A97E)";
  const MUTED = "var(--text-secondary-new, rgba(138,143,168,0.90))";

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "var(--bg-card, rgba(22,27,38,0.97))",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderTop: "1px solid var(--border-subtle, rgba(255,255,255,0.06))",
        // Inline style bypasses Tailwind's arbitrary-value parser so env() is
        // passed verbatim to the browser — critical for iOS safe-area support.
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label, authRequired, unauthHref }) => {
          // Résolution de la destination selon l'état auth
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
              className="flex flex-col items-center justify-center"
              style={{ gap: 2, minWidth: 52, height: 56, textDecoration: "none" }}
            >
              <Icon
                style={{
                  width: 22,
                  height: 22,
                  color: active ? GOLD : MUTED,
                  transition: "color 0.2s ease",
                  strokeWidth: active ? 2.2 : 1.8,
                }}
              />
              {active ? (
                <span style={{ fontSize: 10, fontWeight: 700, color: GOLD, lineHeight: 1 }}>
                  {label}
                </span>
              ) : (
                <span style={{ fontSize: 10, fontWeight: 400, color: "transparent", lineHeight: 1 }}>
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
