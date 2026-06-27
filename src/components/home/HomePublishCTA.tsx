"use client";

import Link from "next/link";
import { Home, MessageCircle, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";

export function HomePublishCTA() {
  const { user, profile } = useAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  const account = mounted ? profile?.account_type ?? profile?.role ?? "" : "";
  const isOwner = ["owner", "proprietaire", "agent", "agence", "agency"].includes(account);
  const href = isOwner ? "/publier/rapide" : mounted && user ? "/compte" : "/connexion?redirect=/compte";

  return (
    <section className="py-5 md:py-8" style={{ background: "var(--bg-secondary)" }}>
      <div className="content-fluid max-w-[1240px]">
        <div
          className="app-card relative overflow-hidden p-5 md:p-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr_auto] gap-5 md:gap-7 items-center">
            <div
              className="mx-auto flex h-32 w-32 md:h-40 md:w-40 items-center justify-center rounded-[32px]"
              style={{ background: "linear-gradient(135deg, rgba(185,138,46,0.22), rgba(31,86,61,0.14))", border: "1px solid rgba(185,138,46,0.22)" }}
              aria-hidden="true"
            >
              <div className="relative flex h-20 w-20 md:h-24 md:w-24 items-center justify-center rounded-[26px]" style={{ background: "var(--accent-gold)", color: "var(--bg-primary)", boxShadow: "0 18px 38px rgba(185,138,46,0.28)" }}>
                {isOwner ? <Plus className="h-11 w-11" strokeWidth={2.6} /> : <Home className="h-11 w-11" strokeWidth={2.6} />}
              </div>
            </div>

            <div className="text-center md:text-left">
              <p className="mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-base font-black" style={{ background: "var(--surface-soft)", color: "var(--accent-gold)", border: "1px solid var(--border)" }}>
                <MessageCircle className="h-4 w-4" strokeWidth={2.4} />
                Contacts directs
              </p>
              <h2
                className="text-[30px] md:text-[44px] font-bold leading-tight"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-display), sans-serif" }}
              >
                {isOwner ? "Publier un logement" : "Vous louez un logement ?"}
              </h2>
              <p className="mt-2 text-base md:text-lg font-bold leading-snug" style={{ color: "var(--text-secondary)" }}>
                {isOwner ? "Ajoutez une annonce et recevez les contacts directement." : "Publiez gratuitement et recevez des contacts directement."}
              </p>
            </div>

            <Link
              href={href}
                className="app-button-primary inline-flex w-full md:w-auto items-center justify-center gap-2 px-8 text-base font-black"
              style={{ background: "var(--accent-gold)", color: "var(--bg-primary)", boxShadow: "0 14px 34px rgba(185,138,46,0.24)" }}
            >
              <Plus className="h-5 w-5" strokeWidth={2.6} />
              Publier maintenant
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
