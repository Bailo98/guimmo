"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Heart, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

const LEFT_NAV = [
  { href: "/", icon: Home, label: "Accueil" },
  { href: "/annonces", icon: Search, label: "Explorer" },
];

const RIGHT_NAV = [
  { href: "/favoris", icon: Heart, label: "Favoris", showFavBadge: true },
  { href: "/compte", icon: User, label: "Profil" },
];

export function BottomNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname.startsWith("/auth")) return null;

  const favorites = useAppStore((s) => s.favorites);
  const _hasHydrated = useAppStore((s) => s._hasHydrated);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  function NavItem({ href, icon: Icon, label, showFavBadge }: {
    href: string; icon: React.ElementType; label: string; showFavBadge?: boolean;
  }) {
    const active = isActive(href);
    const hasBadge = showFavBadge && _hasHydrated && favorites.length > 0;
    return (
      <Link href={href} className="flex flex-col items-center justify-center gap-0.5 w-14 h-14">
        <div className="relative">
          <Icon className={cn("w-[22px] h-[22px]", active ? "text-white" : "text-white/40")} />
          {hasBadge && (
            <span className="absolute -top-1 -right-1.5 w-4 h-4 text-white text-[8px] font-bold rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.25)" }}>
              {favorites.length > 9 ? "9+" : favorites.length}
            </span>
          )}
        </div>
        <span className={cn("text-[10px] font-semibold", active ? "text-white" : "text-white/40")}>
          {label}
        </span>
      </Link>
    );
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom,0px)]"
      style={{ background: "rgba(15,15,15,0.90)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", borderTop: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {LEFT_NAV.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}

        {/* FAB */}
        <Link href="/publier" className="flex flex-col items-center justify-center -mt-6">
          <span className="w-14 h-14 rounded-full flex items-center justify-center active:scale-95 transition-transform" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.20)" }}>
            <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
          </span>
        </Link>

        {RIGHT_NAV.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </div>
    </nav>
  );
}
