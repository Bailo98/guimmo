"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Heart, Plus, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

const NAV_ITEMS = [
  { href: "/", icon: Home, labelKey: "home" as const },
  { href: "/annonces", icon: Search, labelKey: "search" as const },
  { href: "/publier", icon: Plus, labelKey: "publish" as const, isAction: true },
  { href: "/favoris", icon: Heart, labelKey: "favorites" as const },
  { href: "/messages", icon: MessageSquare, labelKey: "messages" as const, showUnreadMessages: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const favorites = useAppStore((s) => s.favorites);
  const unreadMessages = useAppStore((s) => s.unreadMessages);
  const t = useT();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#111418]/95 backdrop-blur-xl border-t border-slate-100 dark:border-[#2a3040] pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const label = t(item.labelKey);

          if (item.isAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center"
              >
                <span className="w-12 h-12 bg-[#F97316] rounded-2xl flex items-center justify-center shadow-[0_4px_20px_rgba(249,115,22,0.4)] -mt-4">
                  <Icon className="w-6 h-6 text-white" />
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-2xl transition-colors",
                isActive ? "text-[#F97316]" : "text-slate-400 dark:text-slate-500"
              )}
            >
              <div className="relative">
                <Icon className={cn("w-5 h-5", isActive && "fill-current opacity-20")} />
                <Icon className="w-5 h-5 absolute inset-0" />
                {item.href === "/favoris" && favorites.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#F97316] text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                    {favorites.length > 9 ? "9+" : favorites.length}
                  </span>
                )}
                {item.href === "/messages" && unreadMessages() > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#F97316] text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                    {unreadMessages() > 9 ? "9+" : unreadMessages()}
                  </span>
                )}
              </div>
              <span className={cn("text-[10px] font-medium", isActive ? "text-[#F97316]" : "text-slate-400 dark:text-slate-500")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
