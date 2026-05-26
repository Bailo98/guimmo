"use client";
import { useState, useEffect } from "react";
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
  /** When false, the WhatsApp share button is hidden (contact buttons already have their own auth wall) */
  isLoggedIn?: boolean;
}

export function PropertyShareButton({ title, neighborhood, price, rooms, bathrooms, surface, shortRef, propertyId, isLoggedIn = false }: Props) {
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(
      window.innerWidth < 768 ||
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    );
  }, []);

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

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

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

      {/* WhatsApp share — only visible to logged-in users */}
      {isLoggedIn && <a
        href={whatsappUrl}
        target={isMobile ? "_self" : "_blank"}
        rel="noopener noreferrer"
        title="Partager sur WhatsApp"
        className="flex items-center gap-1.5 px-3 rounded-xl font-semibold text-sm transition-all no-underline"
        style={{
          minHeight: 44,
          background: "#25D366",
          color: "#ffffff",
          display: "inline-flex",
          alignItems: "center",
          borderRadius: 12,
        }}
      >
        {/* WhatsApp SVG icon */}
        <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: "currentColor", flexShrink: 0 }}>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span className="hidden sm:inline">WhatsApp</span>
      </a>}

      {/* Copy link */}
      <button
        type="button"
        onClick={copyLink}
        title="Copier le lien court"
        className="flex items-center gap-1.5 px-3 rounded-xl font-semibold text-sm transition-all"
        style={{
          minHeight: 44,
          background: copied ? "rgba(233,233,0,0.12)" : "rgba(255,255,255,0.08)",
          border: copied ? "1px solid rgba(233,233,0,0.30)" : "1px solid rgba(255,255,255,0.12)",
          color: copied ? "#E9E900" : "rgba(255,255,255,0.70)",
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
