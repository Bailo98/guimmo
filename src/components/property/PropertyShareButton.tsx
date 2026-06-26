"use client";
import { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";

interface Props {
  title: string;
  neighborhood: string;
  price: string;
  rooms?: number;
  bathrooms?: number;
  surface?: number;
  shortRef?: string;
  propertyId: string;
  isLoggedIn?: boolean; // kept for API compatibility, no longer used internally
}

export function PropertyShareButton({ title, neighborhood, price, rooms, bathrooms, surface, shortRef, propertyId }: Props) {
  const [copied, setCopied] = useState(false);

  const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://LogerBien.gn";
  const shortUrl = shortRef ? `${siteUrl}/a/${shortRef}` : `${siteUrl}/annonces/${propertyId}`;

  const specs = [
    rooms && rooms > 0 ? `🛏 ${rooms} ch.` : "",
    bathrooms && bathrooms > 0 ? `🚿 ${bathrooms} sdb` : "",
    surface && surface > 0 ? `📐 ${surface}m²` : "",
  ].filter(Boolean).join(" • ");

  const message =
    `🏠 *${title}*\n` +
    `📍 ${neighborhood}, Conakry\n` +
    `💰 ${price}\n` +
    (specs ? `${specs}\n` : "") +
    `\nVoir l'annonce : ${shortUrl}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* silent */
    }
  }

  async function share() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: message, url: shortUrl });
        return;
      } catch {
        // User cancelled or not supported — fall through to copy
      }
    }
    await copyLink();
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Native share / copy fallback */}
      <button
        type="button"
        onClick={share}
        className="flex items-center justify-center rounded-full font-bold transition-all"
        style={{
          width: 44,
          height: 44,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          color: "var(--text-primary)",
          boxShadow: "var(--shadow-soft)",
        }}
        title="Partager"
        aria-label="Partager"
      >
        <Share2 className="w-4 h-4 flex-shrink-0" />
      </button>

      {/* Copy link */}
      <button
        type="button"
        onClick={copyLink}
        title={copied ? "Lien copié" : "Copier le lien"}
        aria-label={copied ? "Lien copié" : "Copier le lien"}
        className="flex items-center justify-center rounded-full font-semibold transition-all"
        style={{
          width: 44,
          height: 44,
          background: copied ? "rgba(212,175,55,0.16)" : "var(--bg-card)",
          border: copied ? "1px solid rgba(212,175,55,0.38)" : "1px solid var(--border)",
          color: copied ? "var(--accent-gold)" : "var(--text-primary)",
          boxShadow: "var(--shadow-soft)",
        }}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

export function ShareIcon() {
  return <Share2 className="w-4 h-4" />;
}
