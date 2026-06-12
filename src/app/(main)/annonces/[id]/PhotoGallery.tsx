"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Home, Maximize2, X } from "lucide-react";

interface Props {
  images: { url: string; alt: string }[];
  title: string;
}

export function PhotoGallery({ images, title }: Props) {
  const [current, setCurrent] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const touchStartX = useRef(0);

  if (!images.length) {
    return (
      <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-700 rounded-2xl flex items-center justify-center">
        <Home className="h-10 w-10 text-slate-500 dark:text-slate-300" strokeWidth={1.8} />
      </div>
    );
  }

  function prev() {
    setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));
  }

  function next() {
    setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));
  }

  const activeImage = images[current];
  const visibleThumbs = images.slice(0, 4);
  const remaining = Math.max(0, images.length - visibleThumbs.length);

  return (
    <>
    <div className="relative overflow-hidden rounded-[28px] bg-slate-200 shadow-[0_22px_60px_rgba(24,21,16,0.16)] dark:bg-slate-800 select-none">
      <div
        className="relative aspect-[4/3] md:aspect-auto md:h-[500px] xl:h-[540px]"
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const diff = touchStartX.current - e.changedTouches[0].clientX;
          if (diff > 50) next();
          else if (diff < -50) prev();
        }}
      >
        <Image
          src={activeImage.url}
          alt={activeImage.alt || title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 66vw"
          quality={75}
          priority
        />

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

        {/* Counter */}
        <div className="absolute bottom-3 right-3 bg-black/55 text-white text-sm font-black px-3 py-1.5 rounded-full pointer-events-none">
          {current + 1} / {images.length}
        </div>

        <button
          type="button"
          onClick={() => setFullscreen(true)}
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition-colors hover:bg-black/65"
          aria-label="Voir la photo en grand"
        >
          <Maximize2 className="h-5 w-5" strokeWidth={2.4} />
        </button>

        {/* Dot indicators — inside image overlay */}
        {images.length > 1 && (
          <div className="absolute bottom-10 left-0 right-0 flex gap-1.5 justify-center pointer-events-none">
            {images.map((_, i) => (
              <span
                key={i}
                className={`rounded-full transition-all ${
                  i === current
                    ? "w-5 h-2 bg-white"
                    : "w-2 h-2 bg-white/40"
                }`}
              />
            ))}
          </div>
        )}

        {/* Desktop arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full items-center justify-center transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip — desktop only */}
      {images.length > 1 && (
        <div className="flex gap-2 px-3 py-3 overflow-x-auto scrollbar-hide">
          {visibleThumbs.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`relative flex-none h-16 w-20 overflow-hidden rounded-xl border-2 transition-colors ${
                i === current ? "border-[var(--accent-gold)]" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <Image src={img.url} alt={img.alt || `Photo ${i + 1}`} fill className="object-cover" sizes="64px" quality={50} loading="lazy" />
              {remaining > 0 && i === visibleThumbs.length - 1 && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-lg font-black text-white">
                  +{remaining}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
    {fullscreen && (
      <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/95 p-3 md:p-8">
        <button
          type="button"
          onClick={() => setFullscreen(false)}
          className="absolute right-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
          aria-label="Fermer"
        >
          <X className="h-6 w-6" strokeWidth={2.6} />
        </button>
        {images.length > 1 && (
          <button type="button" onClick={prev} className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20" aria-label="Photo précédente">
            <ChevronLeft className="h-7 w-7" />
          </button>
        )}
        <div className="relative h-[82vh] w-full max-w-6xl">
          <Image src={activeImage.url} alt={activeImage.alt || title} fill className="object-contain" sizes="100vw" quality={90} />
        </div>
        {images.length > 1 && (
          <button type="button" onClick={next} className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20" aria-label="Photo suivante">
            <ChevronRight className="h-7 w-7" />
          </button>
        )}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white backdrop-blur">
          {current + 1} / {images.length}
        </div>
      </div>
    )}
    </>
  );
}
