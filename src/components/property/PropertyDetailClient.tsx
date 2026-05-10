"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import { Heart, ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { Property } from "@/types";

interface Props {
  property: Property;
}

export function PropertyDetailClient({ property }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { toggleFavorite, isFavorite, _hasHydrated } = useAppStore();
  const fav = _hasHydrated && isFavorite(property.id);
  const images = property.images;
  const touchStartX = useRef<number | null>(null);

  function prev() {
    setActiveIndex((i) => (i - 1 + images.length) % images.length);
  }
  function next() {
    setActiveIndex((i) => (i + 1) % images.length);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) delta < 0 ? next() : prev();
    touchStartX.current = null;
  }

  if (images.length === 0) {
    return (
      <div className="aspect-[16/9] bg-slate-200 dark:bg-[#1e2430] rounded-2xl flex items-center justify-center">
        <p className="text-slate-400">Pas d&apos;image</p>
      </div>
    );
  }

  return (
    <>
      {/* Main gallery */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-[#1e2430]">
        {/* Main image */}
        <div
          className="relative aspect-[16/9]"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <Image
            src={images[activeIndex].url}
            alt={images[activeIndex].alt}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 66vw"
            priority
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

          {/* Nav buttons */}
          {images.length > 1 && (
            <>
              <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Actions */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              onClick={() => setLightboxOpen(true)}
              className="w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                toggleFavorite(property.id);
                toast(fav ? "Retiré des favoris" : "Ajouté aux favoris ❤️", fav ? "info" : "success");
              }}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center backdrop-blur transition-colors",
                fav ? "bg-red-500 text-white" : "bg-black/40 hover:bg-black/60 text-white"
              )}
            >
              <Heart className={cn("w-4 h-4", fav && "fill-white")} />
            </button>
          </div>

          {/* Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs font-medium px-2 py-1 rounded-full backdrop-blur">
              {activeIndex + 1} / {images.length}
            </div>
          )}

          {/* Boosted badge */}
          {property.isBoosted && (
            <div className="absolute top-3 left-3 bg-[#F97316] text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              ⚡ Annonce boostée
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 p-2 bg-black/20 overflow-x-auto scrollbar-none">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActiveIndex(i)}
                className={cn(
                  "relative w-16 h-12 flex-shrink-0 rounded-lg overflow-hidden transition-all",
                  i === activeIndex ? "ring-2 ring-[#F97316] opacity-100" : "opacity-60 hover:opacity-80"
                )}
              >
                <Image src={img.url} alt={img.alt} fill className="object-cover" sizes="64px" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center">
          <button onClick={() => setLightboxOpen(false)} className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
          {images.length > 1 && (
            <>
              <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center">
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
          <div className="relative w-full max-w-4xl mx-8 aspect-[16/9]">
            <Image src={images[activeIndex].url} alt={images[activeIndex].alt} fill className="object-contain" sizes="100vw" />
          </div>
          <div className="absolute bottom-4 text-white/60 text-sm">{activeIndex + 1} / {images.length}</div>
        </div>
      )}
    </>
  );
}
