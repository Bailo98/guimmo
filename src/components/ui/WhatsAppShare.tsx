"use client";
import { MessageCircle } from "lucide-react";

interface WhatsAppShareProps {
  title: string;
  neighborhood: string;
  price: string;
  url: string;
  size?: "sm" | "md";
  className?: string;
}

export function WhatsAppShare({ title, neighborhood, price, url, size = "md", className = "" }: WhatsAppShareProps) {
  function share(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const msg =
      `🏠 *${title}*\n` +
      `📍 ${neighborhood}\n` +
      `💰 ${price}\n` +
      `🔗 ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  }

  const isSmall = size === "sm";

  return (
    <button
      type="button"
      onClick={share}
      title="Partager sur WhatsApp"
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: isSmall ? 4 : 6,
        minHeight: isSmall ? 36 : 52,
        padding: isSmall ? "0 10px" : "0 16px",
        borderRadius: 12,
        background: "rgba(37,211,102,0.12)",
        border: "1px solid rgba(37,211,102,0.30)",
        color: "#25D366",
        fontWeight: 700,
        fontSize: isSmall ? 11 : 13,
        whiteSpace: "nowrap",
        flexShrink: 0,
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(37,211,102,0.22)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(37,211,102,0.12)"; }}
    >
      <MessageCircle className={isSmall ? "w-3.5 h-3.5" : "w-4 h-4"} />
      {isSmall ? "WA" : "Partager"}
    </button>
  );
}
