import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Flag, MessageCircle, ShieldAlert } from "lucide-react";

const footerLinkStyle = {
  color: "var(--text-secondary)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
} as const;

export function Footer({ whatsappNumber }: { whatsappNumber: string }) {
  return (
    <footer style={{ background: "var(--bg-secondary)", borderTop: "1px solid var(--border)" }} className="mt-0">
      <div className="content-fluid max-w-[1240px] py-3 md:py-4 pb-[calc(82px+env(safe-area-inset-bottom,0px))] md:pb-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Logo size="md" />

          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl px-4 text-base font-black text-[#15803d] transition-colors hover:bg-[rgba(37,211,102,0.18)]"
              style={{ background: "rgba(37,211,102,0.10)", border: "1px solid rgba(37,211,102,0.25)" }}
            >
              <MessageCircle className="w-4 h-4" strokeWidth={2.4} />
              WhatsApp
            </a>
            <Link href="/cgv" className="inline-flex min-h-11 items-center rounded-2xl px-4 text-base font-black transition-colors hover:text-[var(--accent-gold)]" style={footerLinkStyle}>
              Conditions
            </Link>
            <Link href="/confidentialite" className="inline-flex min-h-11 items-center rounded-2xl px-4 text-base font-black transition-colors hover:text-[var(--accent-gold)]" style={footerLinkStyle}>
              Confidentialite
            </Link>
            <Link href="/guide" className="inline-flex min-h-11 items-center gap-2 rounded-2xl px-4 text-base font-black transition-colors hover:text-[var(--accent-gold)]" style={footerLinkStyle}>
              <ShieldAlert className="w-4 h-4" strokeWidth={2.4} />
              Anti-arnaque
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl px-4 text-base font-black transition-colors hover:text-red-600"
              style={{ color: "#dc2626", border: "1px solid rgba(220,38,38,0.24)", background: "rgba(220,38,38,0.08)" }}
            >
              <Flag className="w-4 h-4" strokeWidth={2.4} />
              Signalement
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
