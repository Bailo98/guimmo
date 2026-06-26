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
  variant?: "surface" | "glass";
}

export function PropertyShareButton({ title, neighborhood, price, rooms, bathrooms, surface, shortRef, propertyId, variant = "surface" }: Props) {
  const [copied, setCopied] = useState(false);
  const isGlass = variant === "glass";
  const buttonBase: React.CSSProperties = {
    width: 44,
    height: 44,
    background: isGlass ? "rgba(255,255,255,0.88)" : "var(--bg-card)",
    border: isGlass ? "1px solid rgba(255,255,255,0.45)" : "1px solid var(--border)",
    color: isGlass ? "#17120a" : "var(--text-primary)",
    boxShadow: isGlass ? "0 14px 34px rgba(0,0,0,0.22)" : "var(--shadow-soft)",
    backdropFilter: isGlass ? "blur(14px)" : undefined,
  };

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
        style={buttonBase}
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
          ...buttonBase,
          background: copied ? "rgba(212,175,55,0.16)" : buttonBase.background,
          border: copied ? "1px solid rgba(212,175,55,0.38)" : buttonBase.border,
          color: copied ? "var(--accent-gold)" : buttonBase.color,
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
