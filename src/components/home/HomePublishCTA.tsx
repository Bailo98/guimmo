"use client";

import Link from "next/link";
import { Home, Plus } from "lucide-react";
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
    <section className="pt-5 pb-4 md:pt-6 md:pb-5" style={{ background: "var(--bg-secondary)" }}>
      <div className="content-fluid max-w-[1240px]">
        <div
          className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center rounded-[24px] p-5 md:p-6"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-soft)" }}
        >
          <div>
            <h2
              className="text-[30px] md:text-[42px] font-black leading-tight mb-2"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-display), sans-serif" }}
            >
              <span className="inline-flex items-center gap-3">
                {isOwner ? <Plus className="h-8 w-8" strokeWidth={2.4} /> : <Home className="h-8 w-8" strokeWidth={2.4} />}
                {isOwner ? "Publier un logement" : "Tu as un logement ?"}
              </span>
            </h2>
            <p className="text-base md:text-lg font-bold" style={{ color: "var(--text-secondary)" }}>
              {isOwner ? "Ajoute une annonce. Reçois les contacts sur WhatsApp." : "Passe propriétaire et publie simplement."}
            </p>
          </div>
          <Link
            href={href}
            className="inline-flex min-h-14 items-center justify-center rounded-2xl px-7 text-base font-black transition-opacity hover:opacity-90"
            style={{ background: "var(--accent-gold)", color: "var(--bg-primary)" }}
          >
            {isOwner ? "Publier" : "Passer propriétaire"}
          </Link>
        </div>
      </div>
    </section>
  );
}
