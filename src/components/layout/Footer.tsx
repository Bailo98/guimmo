import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { MessageCircle } from "lucide-react";

export function Footer({ whatsappNumber }: { whatsappNumber: string }) {
  return (
    <footer style={{ background: "var(--bg-secondary)", borderTop: "1px solid var(--border)" }} className="mt-8">
      <div className="content-fluid py-6 md:py-7 pb-[calc(96px+env(safe-area-inset-bottom,0px))] md:pb-7">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6 mb-5">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Logo size="md" />
            <p className="text-base mt-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              La plateforme immobilière de confiance en Guinée.
            </p>
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 text-[#25D366] text-base font-black px-4 py-3 rounded-2xl transition-colors hover:bg-[rgba(37,211,102,0.18)]"
              style={{ background: "rgba(37,211,102,0.10)", border: "1px solid rgba(37,211,102,0.25)" }}
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
          </div>

          {/* Annonces */}
          <div>
            <h3 className="font-black text-[22px] mb-3" style={{ color: "var(--accent-gold)" }}>Annonces</h3>
            <ul className="space-y-2">
              {[
                { label: "Toutes les annonces", href: "/annonces" },
                { label: "Appartements", href: "/annonces?type=apartment" },
                { label: "Maisons", href: "/annonces?type=house" },
                { label: "Villas", href: "/annonces?type=villa" },
                { label: "Je cherche 🔍", href: "/je-cherche" },
                { label: "Publication rapide", href: "/publier/rapide" },
                { label: "Agents LogerBien", href: "/agents" },
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
            <h3 className="font-black text-[22px] mb-3" style={{ color: "var(--accent-gold)" }}>Quartiers</h3>
            <ul className="space-y-2">
              {[
                { label: "Kipé", href: "/annonces?neighborhood=kipe" },
                { label: "Hamdallaye", href: "/annonces?neighborhood=hamdallaye" },
                { label: "Dixinn", href: "/annonces?neighborhood=dixinn" },
                { label: "Ratoma", href: "/annonces?neighborhood=ratoma" },
                { label: "Taouyah", href: "/annonces?neighborhood=taouyah" },
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
            <h3 className="font-black text-[22px] mb-3" style={{ color: "var(--accent-gold)" }}>Informations</h3>
            <ul className="space-y-2">
              {[
                { label: "À propos", href: "/a-propos" },
                { label: "Tarifs", href: "/tarifs" },
                { label: "Contact", href: "/contact" },
                { label: "CGU", href: "/cgv" },
                { label: "Confidentialité", href: "/confidentialite" },
                { label: "Mentions légales", href: "/mentions-legales" },
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

        <div className="pt-4 text-center" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-base" style={{ color: "var(--text-secondary)" }}>
            🏠 LogerBien — Conakry, Guinée &nbsp;|&nbsp; © 2025 Tous droits réservés
          </p>
        </div>
      </div>
    </footer>
  );
}
