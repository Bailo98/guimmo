import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { MessageCircle } from "lucide-react";

export function Footer({ whatsappNumber }: { whatsappNumber: string }) {
  return (
    <footer style={{ background: "var(--guimmo-bg-alt)", borderTop: "1px solid var(--guimmo-border)" }} className="mt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Logo size="md" />
            <p className="text-sm mt-3 leading-relaxed" style={{ color: "var(--guimmo-cream-dim)" }}>
              La plateforme immobilière de confiance en Guinée.
            </p>
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 text-[#25D366] text-sm font-semibold px-4 py-2 rounded-xl transition-colors hover:bg-[rgba(37,211,102,0.18)]"
              style={{ background: "rgba(37,211,102,0.10)", border: "1px solid rgba(37,211,102,0.25)" }}
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
          </div>

          {/* Annonces */}
          <div>
            <h3 className="font-semibold text-sm mb-4" style={{ color: "var(--guimmo-cream)" }}>Annonces</h3>
            <ul className="space-y-2">
              {[
                { label: "Toutes les annonces", href: "/annonces" },
                { label: "Appartements", href: "/annonces?type=apartment" },
                { label: "Maisons", href: "/annonces?type=house" },
                { label: "Villas", href: "/annonces?type=villa" },
                { label: "Publier une annonce", href: "/publier" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm transition-colors hover:text-[#f7f2e6]" style={{ color: "var(--guimmo-cream-dim)" }}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quartiers */}
          <div>
            <h3 className="font-semibold text-sm mb-4" style={{ color: "var(--guimmo-cream)" }}>Quartiers</h3>
            <ul className="space-y-2">
              {[
                { label: "Kipé", href: "/annonces?neighborhood=kipe" },
                { label: "Hamdallaye", href: "/annonces?neighborhood=hamdallaye" },
                { label: "Dixinn", href: "/annonces?neighborhood=dixinn" },
                { label: "Ratoma", href: "/annonces?neighborhood=ratoma" },
                { label: "Taouyah", href: "/annonces?neighborhood=taouyah" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm transition-colors hover:text-[#f7f2e6]" style={{ color: "var(--guimmo-cream-dim)" }}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h3 className="font-semibold text-sm mb-4" style={{ color: "var(--guimmo-cream)" }}>Informations</h3>
            <ul className="space-y-2">
              {[
                { label: "À propos", href: "/a-propos" },
                { label: "Contact", href: "/contact" },
                { label: "CGU", href: "/cgv" },
                { label: "Confidentialité", href: "/confidentialite" },
                { label: "Mentions légales", href: "/mentions-legales" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm transition-colors hover:text-[#f7f2e6]" style={{ color: "var(--guimmo-cream-dim)" }}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 text-center" style={{ borderTop: "1px solid var(--guimmo-border)" }}>
          <p className="text-xs" style={{ color: "rgba(240,230,204,0.40)" }}>
            🏠 GuImmo — Conakry, Guinée &nbsp;|&nbsp; © 2025 Tous droits réservés
          </p>
        </div>
      </div>
    </footer>
  );
}
