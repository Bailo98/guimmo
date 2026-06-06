import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Home, MessageCircle } from "lucide-react";

export function Footer({ whatsappNumber }: { whatsappNumber: string }) {
  return (
    <footer style={{ background: "var(--bg-secondary)", borderTop: "1px solid var(--border)" }} className="mt-0">
      <div className="content-fluid max-w-[1240px] py-4 md:py-5 pb-[calc(78px+env(safe-area-inset-bottom,0px))] md:pb-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Logo size="md" />
            <p className="text-base mt-1.5 leading-snug" style={{ color: "var(--text-secondary)" }}>
              Logement direct à Conakry.
            </p>
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-2 text-[#25D366] text-base font-black px-4 py-2 rounded-2xl transition-colors hover:bg-[rgba(37,211,102,0.18)]"
              style={{ background: "rgba(37,211,102,0.10)", border: "1px solid rgba(37,211,102,0.25)" }}
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
          </div>

          {/* Annonces */}
          <div>
            <h3 className="font-black text-lg mb-2" style={{ color: "var(--accent-gold)" }}>Annonces</h3>
            <ul className="space-y-1.5">
              {[
                { label: "Toutes les annonces", href: "/annonces" },
                { label: "Je cherche", href: "/je-cherche" },
                { label: "Publication rapide", href: "/publier/rapide" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-base transition-colors hover:text-[var(--accent-gold)]" style={{ color: "var(--text-secondary)" }}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quartiers */}
          <div>
            <h3 className="font-black text-lg mb-2" style={{ color: "var(--accent-gold)" }}>Quartiers</h3>
            <ul className="space-y-1.5">
              {[
                { label: "Kipé", href: "/annonces?neighborhood=kipe" },
                { label: "Ratoma", href: "/annonces?neighborhood=ratoma" },
                { label: "Sonfonia", href: "/annonces?neighborhood=sonfonia" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-base transition-colors hover:text-[var(--accent-gold)]" style={{ color: "var(--text-secondary)" }}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h3 className="font-black text-lg mb-2" style={{ color: "var(--accent-gold)" }}>Infos</h3>
            <ul className="space-y-1.5">
              {[
                { label: "Contact", href: "/contact" },
                { label: "Tarifs", href: "/tarifs" },
                { label: "Confidentialité", href: "/confidentialite" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-base transition-colors hover:text-[var(--accent-gold)]" style={{ color: "var(--text-secondary)" }}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-2.5 text-center" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-base" style={{ color: "var(--text-secondary)" }}>
            <span className="inline-flex items-center justify-center gap-2">
              <Home className="h-4 w-4" strokeWidth={2.4} />
              LogerBien — Conakry © 2025
            </span>
          </p>
          <p className="mt-1 text-xs font-semibold tracking-wide" style={{ color: "var(--text-secondary)" }}>
            Build 7622681
          </p>
        </div>
      </div>
    </footer>
  );
}
