"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  images: { url: string; alt: string }[];
  title: string;
}

export function PhotoGallery({ images, title }: Props) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(0);

  if (!images.length) {
    return (
      <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-700 rounded-2xl flex items-center justify-center">
        <span className="text-4xl">🏠</span>
      </div>
    );
  }

  function prev() {
    setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));
  }

  function next() {
    setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));
  }

  return (
    <div className="relative rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 select-none">
      <div
        className="relative aspect-[4/3]"
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const diff = touchStartX.current - e.changedTouches[0].clientX;
          if (diff > 50) next();
          else if (diff < -50) prev();
        }}
      >
        <Image
          src={images[current].url}
          alt={images[current].alt || title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 66vw"
          quality={75}
          priority
        />

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

        {/* Counter */}
        <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs font-semibold px-2 py-1 rounded-full pointer-events-none">
          {current + 1} / {images.length}
        </div>

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
        <div className="hidden md:flex gap-2 px-3 pb-3 overflow-x-auto scrollbar-hide">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`relative flex-none w-16 h-12 rounded-lg overflow-hidden border-2 transition-colors ${
                i === current ? "border-[#E9E900]" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <Image src={img.url} alt={img.alt || `Photo ${i + 1}`} fill className="object-cover" sizes="64px" quality={50} loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
