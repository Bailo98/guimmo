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
        <span
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
          style={{ background: "#f7f2e6", color: "#111a14" }}
        >
          BL
        </span>
        <span
          style={{
            color: "#f7f2e6",
            fontFamily: "var(--font-nunito), sans-serif",
            fontWeight: 800,
            fontSize: "1.15rem",
            letterSpacing: "-0.01em",
          }}
        >
          BienLoger
        </span>
      </Link>

      {/* Nav links — desktop only */}
      <div className="hidden md:flex items-center gap-7">
        {NAV_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-sm font-medium transition-opacity hover:opacity-100"
            style={{ color: "rgba(247,242,230,0.70)" }}
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
            className="text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:bg-white/10"
            style={{ color: "#f7f2e6", border: "1px solid rgba(247,242,230,0.28)" }}
          >
            Mon compte
          </Link>
        ) : (
          <>
            <Link
              href="/connexion"
              className="hidden md:block text-sm font-medium px-4 py-2 rounded-xl transition-all hover:bg-white/10"
              style={{ color: "#f7f2e6", border: "1px solid rgba(247,242,230,0.28)" }}
            >
              Connexion
            </Link>
            <Link
              href="/inscription"
              className="text-sm font-bold px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
              style={{ background: "#f7f2e6", color: "#111a14" }}
            >
              S&apos;inscrire
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
