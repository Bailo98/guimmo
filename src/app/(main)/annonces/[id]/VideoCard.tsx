"use client";

import { useState } from "react";
import Image from "next/image";
import { Play, Video, X } from "lucide-react";

interface VideoCardProps {
  videoUrl: string;
  poster?: string | null;
}

export function VideoCard({ videoUrl, poster }: VideoCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-black" style={{ color: "var(--text-primary)" }}>
          <Video className="h-4 w-4 text-[var(--accent-gold)]" strokeWidth={2.4} />
          Vidéo du logement
        </h2>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative flex h-[136px] w-full items-center justify-center overflow-hidden rounded-2xl md:h-[200px]"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
          aria-label="Voir la vidéo du logement"
        >
          {poster && (
            <Image
              src={poster}
              alt="Aperçu vidéo du logement"
              fill
              className="object-cover opacity-70 transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 680px"
            />
          )}
          <span className="relative z-10 inline-flex min-h-12 items-center gap-2 rounded-full px-5 text-sm font-black shadow-lg" style={{ background: "var(--accent-gold)", color: "var(--bg-primary)" }}>
            <Play className="h-4 w-4 fill-current" strokeWidth={2.6} />
            Voir la vidéo
          </span>
        </button>
        <p className="mt-2 text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
          Les vidéos LogerBien doivent durer 1 minute maximum.
        </p>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/95 p-3 md:p-8"
          style={{
            paddingTop: "max(12px, env(safe-area-inset-top, 0px))",
            paddingBottom: "max(12px, env(safe-area-inset-bottom, 0px))",
            paddingLeft: "max(12px, env(safe-area-inset-left, 0px))",
            paddingRight: "max(12px, env(safe-area-inset-right, 0px))",
          }}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25"
            aria-label="Fermer la vidéo"
          >
            <X className="h-6 w-6" strokeWidth={2.6} />
          </button>
          <video
            src={videoUrl}
            controls
            autoPlay
            playsInline
            preload="metadata"
            poster={poster ?? undefined}
            className="max-h-[82vh] w-full max-w-5xl rounded-2xl bg-black"
          />
        </div>
      )}
    </>
  );
}
