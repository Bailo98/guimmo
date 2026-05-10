"use client";
import Link from "next/link";
import { Moon, Sun, Menu, X, Plus, Search, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { useT } from "@/lib/i18n";

export function Header() {
  const { theme, toggleTheme } = useAppStore();
  const lang = useAppStore((s) => s.lang);
  const setLang = useAppStore((s) => s.setLang);
  const t = useT();
  const unreadMessages = useAppStore((s) => s.unreadMessages);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#111418]/90 backdrop-blur-xl border-b border-slate-100 dark:border-[#2a3040]">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Logo />

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/annonces"
            className="px-3 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#F97316] transition-colors"
          >
            {t("listings")}
          </Link>
          <Link
            href="/annonces?type=apartment"
            className="px-3 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#F97316] transition-colors"
          >
            Appartements
          </Link>
          <Link
            href="/annonces?type=house"
            className="px-3 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#F97316] transition-colors"
          >
            Maisons
          </Link>
          <Link
            href="/tarifs"
            className="px-3 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#F97316] transition-colors"
          >
            Tarifs
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/annonces"
            className="hidden md:flex items-center gap-1.5 w-9 h-9 md:w-auto md:px-3 md:py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Search className="w-4 h-4" />
          </Link>

          <NotificationBell />

          <button
            onClick={() => setLang(lang === "fr" ? "en" : "fr")}
            title={lang === "fr" ? "Switch to English" : "Passer en Français"}
            className="hidden md:flex items-center text-xs font-bold px-2 py-1 rounded-lg border border-slate-200 dark:border-[#2a3040] text-slate-600 dark:text-slate-300 hover:border-[#009460] hover:text-[#009460] transition-colors gap-1"
          >
            {lang === "fr" ? "🌍 EN" : "🌍 FR"}
          </button>

          <Link
            href="/messages"
            className="hidden md:flex relative w-9 h-9 rounded-xl items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Messages"
          >
            <MessageSquare className="w-4 h-4" />
            {unreadMessages() > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-[#F97316] text-white text-[10px] font-bold flex items-center justify-center px-0.5">
                {unreadMessages() > 9 ? "9+" : unreadMessages()}
              </span>
            )}
          </Link>

          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Changer le thème"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <Link
            href="/publier"
            className="hidden md:flex items-center gap-1.5 bg-[#F97316] hover:bg-[#EA6C0A] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-[0_4px_20px_rgba(249,115,22,0.3)]"
          >
            <Plus className="w-4 h-4" />
            {t("publish")}
          </Link>

          <Link
            href="/connexion"
            className="hidden md:flex text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-[#F97316] dark:hover:text-[#F97316] transition-colors px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {t("login")}
          </Link>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-100 dark:border-[#2a3040] bg-white dark:bg-[#111418] px-4 pb-4 space-y-1 animate-[slideDown_0.2s_ease-out]">
          <Link
            href="/annonces"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {t("listings")}
          </Link>
          <Link
            href="/tarifs"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Tarifs
          </Link>
          <Link
            href="/connexion"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {t("login")}
          </Link>
          <Link
            href="/inscription"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {t("signup")}
          </Link>
          <Link
            href="/publier"
            onClick={() => setMenuOpen(false)}
            className="flex items-center justify-center gap-2 bg-[#F97316] text-white font-bold py-3 rounded-xl mt-2"
          >
            <Plus className="w-4 h-4" />
            {t("publish_action")}
          </Link>
        </div>
      )}
    </header>
  );
}
