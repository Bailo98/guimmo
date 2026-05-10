"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

interface Props {
  title: string;
}

export function ShareButton({ title }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled or not supported, fall through to clipboard
      }
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-[#F97316] transition-colors"
      title="Partager cet article"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-green-500" />
          <span className="text-green-500 text-xs font-semibold">Lien copié !</span>
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          <span className="text-xs font-semibold">Partager</span>
        </>
      )}
    </button>
  );
}
