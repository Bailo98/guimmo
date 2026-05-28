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
        className="flex items-center gap-2 px-4 rounded-xl font-bold text-white text-sm transition-all"
        style={{ minHeight: 44, background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)" }}
      >
        <Share2 className="w-4 h-4 flex-shrink-0" />
        Partager
      </button>

      {/* Copy link */}
      <button
        type="button"
        onClick={copyLink}
        title="Copier le lien court"
        className="flex items-center gap-1.5 px-3 rounded-xl font-semibold text-sm transition-all"
        style={{
          minHeight: 44,
          background: copied ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.08)",
          border: copied ? "1px solid rgba(212,175,55,0.30)" : "1px solid rgba(255,255,255,0.12)",
          color: copied ? "#D4AF37" : "rgba(255,255,255,0.70)",
        }}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? "Copié !" : "Copier le lien"}
      </button>
    </div>
  );
}

export function ShareIcon() {
  return <Share2 className="w-4 h-4" />;
}
