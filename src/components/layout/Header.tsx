"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Moon, Sun, Menu, X, Plus, LogOut, User, ChevronDown, Shield } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

export function Header() {
  const { theme, toggleTheme } = useAppStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleSignOut() {
    await signOut();
    setUserMenuOpen(false);
    router.push("/");
  }

  const displayName = profile?.full_name ?? user?.email?.split("@")[0] ?? "Mon compte";
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const role = profile?.role ?? "buyer";
  const isAdmin = role === "admin";
  const isProprietaire = ["proprietaire", "owner", "agent", "agence", "admin"].includes(role);

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#111418]/90 backdrop-blur-xl border-b border-slate-100 dark:border-[#2a3040]">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Logo />

        <nav className="hidden md:flex items-center gap-1">
          <Link href="/annonces" className="px-3 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#F97316] transition-colors">
            Annonces
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Changer le thème"
          >
            {(!mounted || theme === "dark") ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {isProprietaire && (
            <Link
              href="/publier"
              className="hidden md:flex items-center gap-1.5 bg-[#F97316] hover:bg-[#EA6C0A] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-[0_4px_20px_rgba(249,115,22,0.3)]"
            >
              <Plus className="w-4 h-4" />
              Publier
            </Link>
          )}

          {user ? (
            <div ref={userMenuRef} className="relative hidden md:block">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-[#F97316] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {initials || <User className="w-3.5 h-3.5" />}
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[100px] truncate">
                  {displayName.split(" ")[0]}
                </span>
                <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", userMenuOpen && "rotate-180")} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1e2430] rounded-2xl shadow-xl border border-slate-100 dark:border-[#2a3040] overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-[#2a3040]">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{displayName}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                  {isAdmin ? (
                    <Link
                      href="/admin"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-[#F97316] font-semibold hover:bg-slate-50 dark:hover:bg-[#2a3040] transition-colors"
                    >
                      <Shield className="w-4 h-4" />
                      Administration
                    </Link>
                  ) : (
                    <Link
                      href="/compte"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2a3040] transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Mon compte
                    </Link>
                  )}
                  {isProprietaire && !isAdmin && (
                    <Link
                      href="/publier"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2a3040] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Publier une annonce
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-slate-100 dark:border-[#2a3040]"
                  >
                    <LogOut className="w-4 h-4" />
                    Se déconnecter
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/connexion"
              className="hidden md:flex text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-[#F97316] dark:hover:text-[#F97316] transition-colors px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Connexion
            </Link>
          )}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-slate-100 dark:border-[#2a3040] bg-white dark:bg-[#111418] px-4 pb-4 space-y-1 animate-[slideDown_0.2s_ease-out]">
          <Link href="/annonces" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
            Annonces
          </Link>
          {user ? (
            <>
              {isAdmin ? (
                <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-3 rounded-xl text-[#F97316] font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">
                  <Shield className="w-4 h-4" /> Administration
                </Link>
              ) : (
                <Link href="/compte" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <User className="w-4 h-4" /> Mon compte
                </Link>
              )}
              <button
                onClick={() => { handleSignOut(); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut className="w-4 h-4" /> Se déconnecter
              </button>
            </>
          ) : (
            <>
              <Link href="/connexion" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                Connexion
              </Link>
              <Link href="/inscription" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                S&apos;inscrire
              </Link>
            </>
          )}
          {isProprietaire && (
            <Link
              href="/publier"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center gap-2 bg-[#F97316] text-white font-bold py-3 rounded-xl mt-2"
            >
              <Plus className="w-4 h-4" />
              Publier une annonce
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
