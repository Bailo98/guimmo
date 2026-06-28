"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Home, Maximize2, X } from "lucide-react";

interface Props {
  images: { url: string; alt: string }[];
  title: string;
}

function isValidImageUrl(url?: string | null): url is string {
  if (!url) return false;
  const value = url.trim();
  if (!value || value === "null" || value === "undefined") return false;
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/");
}

export function PhotoGallery({ images, title }: Props) {
  const [current, setCurrent] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const touchStartX = useRef(0);
  const safeImages = images.filter((image) => isValidImageUrl(image.url));

  if (!safeImages.length) {
    return (
      <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-700 rounded-2xl flex items-center justify-center">
        <Home className="h-10 w-10 text-slate-500 dark:text-slate-300" strokeWidth={1.8} />
      </div>
    );
  }

  function prev() {
    setCurrent((c) => (c === 0 ? safeImages.length - 1 : c - 1));
  }

  function next() {
    setCurrent((c) => (c === safeImages.length - 1 ? 0 : c + 1));
  }

  const activeIndex = Math.min(current, safeImages.length - 1);
  const activeImage = safeImages[activeIndex];
  const nextImage = safeImages[(activeIndex + 1) % safeImages.length];
  const prevImage = safeImages[(activeIndex - 1 + safeImages.length) % safeImages.length];
  const visibleThumbs = safeImages.slice(0, 4);
  const remaining = Math.max(0, safeImages.length - visibleThumbs.length);
  const fullscreenOverlay = (
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/95 p-3 md:p-8">
      <button
        type="button"
        onClick={() => setFullscreen(false)}
        className="absolute right-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
        aria-label="Fermer"
      >
        <X className="h-6 w-6" strokeWidth={2.6} />
      </button>
      {safeImages.length > 1 && (
        <button type="button" onClick={prev} className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20" aria-label="Photo précédente">
          <ChevronLeft className="h-7 w-7" />
        </button>
      )}
      <div className="relative h-[82vh] w-full max-w-6xl touch-pan-x touch-pan-y" style={{ touchAction: "pinch-zoom pan-x pan-y" }}>
        <Image src={activeImage.url} alt={activeImage.alt || title} fill className="object-contain" sizes="100vw" quality={90} />
      </div>
      {safeImages.length > 1 && (
        <button type="button" onClick={next} className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20" aria-label="Photo suivante">
          <ChevronRight className="h-7 w-7" />
        </button>
      )}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white backdrop-blur">
        {activeIndex + 1} / {safeImages.length}
      </div>
    </div>
  );

  return (
    <>
    <div className="relative overflow-hidden rounded-b-[30px] bg-slate-200 shadow-[0_22px_60px_rgba(24,21,16,0.16)] md:rounded-[30px] dark:bg-slate-800 select-none">
      <div
        className="relative h-[68svh] min-h-[430px] max-h-[720px] md:h-[560px] md:max-h-[620px] xl:h-[620px]"
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
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 64vw, 980px"
          quality={82}
          priority
        />
        {safeImages.length > 1 && (
          <div className="hidden" aria-hidden="true">
            <Image src={nextImage.url} alt="" width={32} height={32} quality={50} loading="lazy" />
            <Image src={prevImage.url} alt="" width={32} height={32} quality={50} loading="lazy" />
          </div>
        )}

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-black/20 pointer-events-none" />

        {/* Counter */}
        <div className="absolute bottom-3 right-3 bg-black/55 text-white text-sm font-black px-3 py-1.5 rounded-full pointer-events-none">
          {activeIndex + 1} / {safeImages.length}
        </div>

        <button
          type="button"
          onClick={() => setFullscreen(true)}
          className="absolute bottom-3 left-3 flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition-colors hover:bg-black/65"
          aria-label="Voir la photo en grand"
        >
          <Maximize2 className="h-5 w-5" strokeWidth={2.4} />
        </button>

        {/* Dot indicators — inside image overlay */}
        {safeImages.length > 1 && (
          <div className="absolute bottom-10 left-0 right-0 flex gap-1.5 justify-center pointer-events-none">
            {safeImages.map((_, i) => (
              <span
                key={i}
                className={`rounded-full transition-all ${
                  i === activeIndex
                    ? "w-5 h-2 bg-white"
                    : "w-2 h-2 bg-white/40"
                }`}
              />
            ))}
          </div>
        )}

        {/* Desktop arrows */}
        {safeImages.length > 1 && (
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
      {safeImages.length > 1 && (
        <div className="hidden gap-2 px-3 py-3 overflow-x-auto scrollbar-hide md:flex">
          {visibleThumbs.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`relative flex-none h-16 w-20 overflow-hidden rounded-xl border-2 transition-colors ${
                i === activeIndex ? "border-[var(--accent-gold)]" : "border-transparent opacity-60 hover:opacity-100"
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
    {fullscreen && typeof document !== "undefined" ? createPortal(fullscreenOverlay, document.body) : null}
    </>
  );
}
