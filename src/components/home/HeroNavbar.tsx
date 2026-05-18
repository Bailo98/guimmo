"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const NAV_LINKS = [
  { href: "/annonces",              label: "Annonces" },
  { href: "/annonces?type=apartment", label: "Appartements" },
  { href: "/annonces?type=house",     label: "Maisons" },
  { href: "/tarifs",                  label: "Tarifs" },
];

export function HeroNavbar() {
  const { user } = useAuth();

  return (
    <nav className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-5 flex items-center justify-between">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5">
        <div style={{
          width: 32, height: 32, background: "#E9E900", borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <span style={{
          fontFamily: "var(--font-display), sans-serif",
          fontWeight: 700, fontSize: "1.0625rem", color: "#ffffff", letterSpacing: "-0.3px",
        }}>
          BienLoger
        </span>
      </Link>

      {/* Nav links — desktop only */}
      <div className="hidden md:flex items-center gap-7">
        {NAV_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-sm font-medium transition-colors"
            style={{ color: "#aaaaaa" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#E9E900"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#aaaaaa"; }}
          >
            {l.label}
          </Link>
        ))}
      </div>

      {/* Auth buttons */}
      <div className="flex items-center gap-2.5">
        {user ? (
          <Link
            href="/compte"
            className="text-sm font-semibold px-4 py-2 rounded-xl transition-all"
            style={{ color: "#ffffff", border: "1px solid #1e2a30", background: "#111a1f" }}
          >
            Mon compte
          </Link>
        ) : (
          <>
            <Link
              href="/connexion"
              className="hidden md:block text-sm font-medium px-4 py-2 rounded-xl transition-all"
              style={{ color: "#aaaaaa", border: "1px solid #1e2a30" }}
            >
              Connexion
            </Link>
            <Link
              href="/inscription"
              className="text-sm font-bold px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
              style={{ background: "#E9E900", color: "#0A1216" }}
            >
              S&apos;inscrire
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
