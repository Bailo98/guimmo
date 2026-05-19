"use client";
import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { toast } from "@/lib/toast";

interface ShareButtonProps {
  title: string;
  className?: string;
}

export function ShareButton({ title, className = "flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: `Découvrez "${title}" sur GuImmo`, url });
      } catch {
        // user cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast("Lien copié dans le presse-papier !", "success");
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast("Impossible de copier le lien", "error");
      }
    }
  }

  return (
    <button onClick={handleShare} className={className} aria-label="Partager">
      {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
      {copied ? "Copié !" : "Partager"}
    </button>
  );
}
