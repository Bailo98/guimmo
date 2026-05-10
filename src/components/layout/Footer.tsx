import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { MessageCircle, Phone, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-50 dark:bg-[#0d1014] border-t border-slate-100 dark:border-[#2a3040] mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Logo size="md" />
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 leading-relaxed">
              La plateforme immobilière de confiance en Guinée. Trouvez rapidement votre logement à Conakry.
            </p>
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <a href="https://wa.me/224620000000" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-[#25D366] flex items-center justify-center text-white hover:opacity-90 transition-opacity">
                <MessageCircle className="w-4 h-4" />
              </a>
              <a href="tel:+224620000000" className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-[#009460] hover:text-white transition-colors">
                <Phone className="w-4 h-4" />
              </a>
              <a href="mailto:contact@guimmo.gn" className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-[#009460] hover:text-white transition-colors">
                <Mail className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-[#E1306C] hover:text-white transition-colors text-xs font-bold">
                IG
              </a>
              <a href="#" className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-[#1877F2] hover:text-white transition-colors text-xs font-bold">
                FB
              </a>
            </div>
          </div>

          {/* Annonces */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-4">Annonces</h3>
            <ul className="space-y-2">
              {[
                { label: "Toutes les annonces", href: "/annonces" },
                { label: "Appartements", href: "/annonces?type=apartment" },
                { label: "Maisons", href: "/annonces?type=house" },
                { label: "Studios", href: "/annonces?type=studio" },
                { label: "Villas", href: "/annonces?type=villa" },
                { label: "Nouvelles annonces", href: "/nouveautes" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-slate-500 dark:text-slate-400 hover:text-[#009460] transition-colors">
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
                { label: "Kipé", href: "/quartiers/kipe" },
                { label: "Hamdallaye", href: "/quartiers/hamdallaye" },
                { label: "Dixinn", href: "/quartiers/dixinn" },
                { label: "Ratoma", href: "/quartiers/ratoma" },
                { label: "Taouyah", href: "/quartiers/taouyah" },
                { label: "Comparer", href: "/quartiers/compare" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-slate-500 dark:text-slate-400 hover:text-[#009460] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* GuImmo */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-4">GuImmo</h3>
            <ul className="space-y-2">
              {[
                { label: "Publier une annonce", href: "/publier" },
                { label: "Tarifs & Abonnements", href: "/tarifs" },
                { label: "Comment ça marche", href: "/comment-ca-marche" },
                { label: "Guide location", href: "/guide" },
                { label: "Estimateur de prix", href: "/estimateur" },
                { label: "Blog immobilier", href: "/blog" },
                { label: "FAQ", href: "/faq" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-slate-500 dark:text-slate-400 hover:text-[#009460] transition-colors">
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
                { label: "À propos de GuImmo", href: "/a-propos" },
                { label: "Conditions d'utilisation", href: "/cgv" },
                { label: "Politique de confidentialité", href: "/confidentialite" },
                { label: "Mentions légales", href: "/mentions-legales" },
                { label: "Contact", href: "/contact" },
                { label: "Témoignages", href: "/temoignages" },
                { label: "Agences partenaires", href: "/agences" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-slate-500 dark:text-slate-400 hover:text-[#009460] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-slate-200 dark:border-[#2a3040] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-xs text-center">
            © 2025 GuImmo — Guinée Immobilier. Tous droits réservés. Made with ♥ in Conakry.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/cgv" className="text-xs text-slate-400 hover:text-[#009460] transition-colors">CGU</Link>
            <Link href="/confidentialite" className="text-xs text-slate-400 hover:text-[#009460] transition-colors">Confidentialité</Link>
            <Link href="/contact" className="text-xs text-slate-400 hover:text-[#009460] transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
