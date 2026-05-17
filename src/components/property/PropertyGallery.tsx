"use client";
import { useState } from "react";
import Image from "next/image";
import { Camera, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageLightbox } from "@/components/ui/ImageLightbox";

interface GalleryImage {
  id: string;
  url: string;
  alt: string;
  isPrimary?: boolean;
}

export function PropertyGallery({ images }: { images: GalleryImage[] }) {
  const primaryIndex = images.findIndex((img) => img.isPrimary);
  const [current, setCurrent] = useState(primaryIndex >= 0 ? primaryIndex : 0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) {
    return (
      <div className="aspect-[16/9] bg-slate-200 dark:bg-[#1e2430] rounded-2xl flex items-center justify-center">
        <p className="text-slate-400">Pas d&apos;image</p>
      </div>
    );
  }

  function prev(e: React.MouseEvent) {
    e.stopPropagation();
    setCurrent((i) => (i - 1 + images.length) % images.length);
  }
  function next(e: React.MouseEvent) {
    e.stopPropagation();
    setCurrent((i) => (i + 1) % images.length);
  }

  return (
    <>
      <div className="rounded-2xl overflow-hidden bg-slate-100 dark:bg-[#1e2430]">
        {/* Primary image with arrows */}
        <div
          className="relative aspect-[16/9] cursor-pointer group"
          onClick={() => setLightboxIndex(current)}
        >
          <Image
            src={images[current].url}
            alt={images[current].alt}
            fill
            className="object-cover transition-opacity duration-200"
            sizes="(max-width: 1024px) 100vw, 66vw"
            quality={75}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

          {/* Prev arrow */}
          {images.length > 1 && (
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-10"
              aria-label="Image précédente"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Next arrow */}
          {images.length > 1 && (
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-10"
              aria-label="Image suivante"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Counter badge */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
            <Camera className="w-3.5 h-3.5" />
            {current + 1} / {images.length}
          </div>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 p-2 bg-black/20 overflow-x-auto scrollbar-none">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setCurrent(i)}
                className={cn(
                  "relative w-16 h-12 flex-shrink-0 rounded-lg overflow-hidden transition-all",
                  i === current
                    ? "ring-2 ring-[#E9E900] opacity-100"
                    : "opacity-60 hover:opacity-80"
                )}
                aria-label={`Voir photo ${i + 1}`}
              >
                <Image src={img.url} alt={img.alt} fill className="object-cover" sizes="64px" quality={50} loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={images.map((img) => ({ url: img.url, alt: img.alt }))}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
