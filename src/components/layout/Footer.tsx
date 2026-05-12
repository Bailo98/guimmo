import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { MessageCircle } from "lucide-react";

export function Footer({ whatsappNumber }: { whatsappNumber: string }) {
  return (
    <footer className="bg-slate-50 dark:bg-[#0d1014] border-t border-slate-100 dark:border-[#2a3040] mt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Logo size="md" />
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 leading-relaxed">
              La plateforme immobilière de confiance en Guinée.
            </p>
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] text-sm font-semibold px-4 py-2 rounded-xl border border-[#25D366]/30 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
          </div>

          {/* Annonces */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-4">Annonces</h3>
            <ul className="space-y-2">
              {[
                { label: "Toutes les annonces", href: "/annonces" },
                { label: "Appartements", href: "/annonces?type=apartment" },
                { label: "Maisons", href: "/annonces?type=house" },
                { label: "Villas", href: "/annonces?type=villa" },
                { label: "Publier une annonce", href: "/publier" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-slate-500 dark:text-slate-400 hover:text-[#F97316] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quartiers */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-4">Quartiers</h3>
            <ul className="space-y-2">
              {[
                { label: "Kipé", href: "/annonces?neighborhood=kipe" },
                { label: "Hamdallaye", href: "/annonces?neighborhood=hamdallaye" },
                { label: "Dixinn", href: "/annonces?neighborhood=dixinn" },
                { label: "Ratoma", href: "/annonces?neighborhood=ratoma" },
                { label: "Taouyah", href: "/annonces?neighborhood=taouyah" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-slate-500 dark:text-slate-400 hover:text-[#F97316] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-4">Informations</h3>
            <ul className="space-y-2">
              {[
                { label: "À propos", href: "/a-propos" },
                { label: "Contact", href: "/contact" },
                { label: "CGU", href: "/cgv" },
                { label: "Confidentialité", href: "/confidentialite" },
                { label: "Mentions légales", href: "/mentions-legales" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-slate-500 dark:text-slate-400 hover:text-[#F97316] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 dark:border-[#2a3040] text-center">
          <p className="text-slate-400 text-xs">
            🏠 GuImmo — Conakry, Guinée &nbsp;|&nbsp; © 2025 Tous droits réservés
          </p>
        </div>
      </div>
    </footer>
  );
}
