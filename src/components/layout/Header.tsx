"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Moon, Sun, Menu, X, Plus, LogOut, User, ChevronDown, Shield } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

export function Header() {
  const { theme, toggleTheme } = useAppStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const pathname = usePathname();

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
  const role = profile?.role ?? "buyer";
  const accountType = profile?.account_type ?? null;
  const isAdmin = role === "admin";
  // Chercheur accounts never see Publier, even if role is misconfigured
  const isChercheur = accountType === "chercheur" || role === "chercheur";
  const isProprietaire = !isChercheur && (
    ["proprietaire", "owner", "agent", "agence", "admin"].includes(role)
    || ["proprietaire", "agent", "agence"].includes(accountType ?? "")
  );

  const NO_HEADER = ["/inscription", "/connexion", "/mot-de-passe-oublie"];
  if (NO_HEADER.includes(pathname)) return null;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300"
      style={{ background: "var(--nav-bg)", backdropFilter: "blur(16px) saturate(180%)", WebkitBackdropFilter: "blur(16px) saturate(180%)", borderBottom: "1px solid var(--nav-border)" }}
    >
      <div className="max-w-7xl mx-auto px-4 h-[72px] flex items-center justify-between gap-4">
        <Logo />

        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/annonces"
            className="px-3 py-2 rounded-xl transition-colors hover:bg-black/5"
            style={{ fontSize: 13, fontWeight: 300, letterSpacing: "0.12em", textTransform: "uppercase", color: pathname.startsWith("/annonces") ? "var(--nav-text-active)" : "var(--nav-text)" }}
          >
            Annonces
          </Link>
          <Link
            href="/agents"
            className="px-3 py-2 rounded-xl transition-colors hover:bg-black/5"
            style={{ fontSize: 13, fontWeight: 300, letterSpacing: "0.12em", textTransform: "uppercase", color: pathname === "/agents" ? "var(--nav-text-active)" : "var(--nav-text)" }}
          >
            Agents
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-black/5"
            style={{ color: "var(--nav-text)" }}
            aria-label="Changer le thème"
          >
            {(!mounted || theme === "dark") ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {isProprietaire && (
            <Link
              href="/publier"
              className="hidden md:flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl"
              style={{ background: "var(--accent-gold, #C8A97E)", color: "#0B0F19", transition: "opacity 0.2s ease" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.85"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; }}
            >
              <Plus className="w-4 h-4" />
              Publier
            </Link>
          )}

          {/* ── Boutons Auth desktop ── */}
          {user ? (
            <div ref={userMenuRef} className="relative hidden md:block">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors hover:bg-black/5"
                style={{ color: "var(--nav-text)" }}
              >
                <Avatar url={profile?.avatar_url} name={displayName} size="sm" />
                <span className="text-sm font-medium max-w-[100px] truncate" style={{ color: "var(--nav-text-active)" }}>
                  {displayName.split(" ")[0]}
                </span>
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", userMenuOpen && "rotate-180")} style={{ color: "var(--nav-text)" }} />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-48 rounded-2xl overflow-hidden z-50 border"
                  style={{ background: "var(--nav-dropdown-bg)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderColor: "var(--nav-border)" }}
                >
                  <div className="px-4 py-3 border-b" style={{ borderColor: "var(--nav-border)" }}>
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--nav-text-active)" }}>{displayName}</p>
                    <p className="text-xs truncate" style={{ color: "var(--nav-text)" }}>{user.email}</p>
                  </div>
                  {isAdmin ? (
                    <Link href="/admin" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm font-semibold hover:bg-black/5 transition-colors"
                      style={{ color: "var(--nav-text)" }}>
                      <Shield className="w-4 h-4" /> Administration
                    </Link>
                  ) : (
                    <Link href="/compte" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-black/5 transition-colors"
                      style={{ color: "var(--nav-text)" }}>
                      <User className="w-4 h-4" /> Mon compte
                    </Link>
                  )}
                  {isProprietaire && !isAdmin && (
                    <Link href="/publier" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-black/5 transition-colors"
                      style={{ color: "var(--nav-text)" }}>
                      <Plus className="w-4 h-4" /> Publier une annonce
                    </Link>
                  )}
                  <button onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors border-t"
                    style={{ borderColor: "var(--nav-border)" }}>
                    <LogOut className="w-4 h-4" /> Se déconnecter
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/connexion"
                className="text-sm font-medium px-4 py-2 rounded-xl"
                style={{
                  color: "var(--accent-gold, #C8A97E)",
                  border: "1px solid var(--accent-gold, #C8A97E)",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "rgba(200,169,126,0.10)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                }}
              >
                Connexion
              </Link>
              <Link
                href="/inscription"
                className="text-sm font-bold px-4 py-2 rounded-xl"
                style={{
                  background: "var(--accent-gold, #C8A97E)",
                  color: "#0B0F19",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.opacity = "0.88";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
                }}
              >
                S&apos;inscrire
              </Link>
            </div>
          )}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-black/5"
            style={{ color: "var(--nav-text)" }}
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          className="md:hidden border-t px-4 pb-4 space-y-1 animate-[slideDown_0.2s_ease-out]"
          style={{ background: "var(--nav-dropdown-bg)", borderColor: "var(--nav-border)" }}
        >
          <Link href="/annonces" onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-3 rounded-xl hover:bg-black/5"
            style={{ color: "var(--nav-text)" }}>
            Annonces
          </Link>
          <Link href="/agents" onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-3 rounded-xl hover:bg-black/5"
            style={{ color: "var(--nav-text)" }}>
            Agents
          </Link>
          {user ? (
            <>
              {isAdmin ? (
                <Link href="/admin" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-3 rounded-xl font-semibold hover:bg-black/5"
                  style={{ color: "var(--nav-text)" }}>
                  <Shield className="w-4 h-4" /> Administration
                </Link>
              ) : (
                <Link href="/compte" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-3 rounded-xl hover:bg-black/5"
                  style={{ color: "var(--nav-text)" }}>
                  <User className="w-4 h-4" /> Mon compte
                </Link>
              )}
              <button onClick={() => { handleSignOut(); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-3 rounded-xl text-red-500 hover:bg-red-500/10">
                <LogOut className="w-4 h-4" /> Se déconnecter
              </button>
            </>
          ) : (
            <>
              <Link href="/connexion" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-3 rounded-xl hover:bg-black/5"
                style={{ color: "var(--nav-text)" }}>
                Connexion
              </Link>
              <Link href="/inscription" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-3 rounded-xl hover:bg-black/5"
                style={{ color: "var(--nav-text)" }}>
                S&apos;inscrire
              </Link>
            </>
          )}
          {isProprietaire && (
            <Link href="/publier" onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center gap-2 bg-[#E9E900] hover:bg-[#c4c400] text-white font-bold py-3 rounded-xl mt-2">
              <Plus className="w-4 h-4" /> Publier une annonce
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
