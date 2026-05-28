"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X } from "lucide-react";

export interface VTRoom {
  id: string;
  url: string;
  room_name: string;
  sort_order: number;
}

interface Props {
  rooms: VTRoom[];
}

export function VirtualTour({ rooms }: Props) {
  const [open,     setOpen]     = useState(false);
  const [current,  setCurrent]  = useState(0);
  const [imgLoaded,setImgLoaded]= useState(false);
  const [slideDir, setSlideDir] = useState<"left" | "right" | null>(null);
  const [scale,    setScale]    = useState(1);
  const [pinching, setPinching] = useState(false);

  const pinchStartDist  = useRef<number | null>(null);
  const pinchStartScale = useRef(1);
  const touchStartX     = useRef(0);
  const touchStartY     = useRef(0);
  const touchCount      = useRef(0);
  const thumbsRef       = useRef<HTMLDivElement>(null);

  const goTo = useCallback((idx: number, dir: "left" | "right") => {
    const next = ((idx % rooms.length) + rooms.length) % rooms.length;
    setSlideDir(dir);
    setCurrent(next);
    setImgLoaded(false);
    setScale(1);
    setPinching(false);
  }, [rooms.length]);

  const goNext = useCallback(() => goTo(current + 1, "right"), [current, goTo]);
  const goPrev = useCallback(() => goTo(current - 1, "left"),  [current, goTo]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (!open || !thumbsRef.current) return;
    const el = thumbsRef.current.children[current] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [current, open]);

  if (!rooms.length) return null;
  const room = rooms[current];

  function pinchDist(touches: React.TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchCount.current = e.touches.length;
    if (e.touches.length === 2) {
      pinchStartDist.current  = pinchDist(e.touches);
      pinchStartScale.current = scale;
      setPinching(true);
    } else {
      touchStartX.current    = e.touches[0].clientX;
      touchStartY.current    = e.touches[0].clientY;
      pinchStartDist.current = null;
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2 && pinchStartDist.current !== null) {
      const dist     = pinchDist(e.touches);
      const newScale = Math.min(3, Math.max(1, pinchStartScale.current * (dist / pinchStartDist.current)));
      setScale(newScale);
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (e.touches.length === 0) setPinching(false);
    // Only swipe on single-finger gesture when not zoomed
    if (touchCount.current !== 1 || scale > 1.05) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (Math.abs(dx) > 60 && Math.abs(dx) > dy) {
      dx > 0 ? goNext() : goPrev();
    }
  }

  const animClass = slideDir === "right"
    ? "vt-slide-right"
    : slideDir === "left"
      ? "vt-slide-left"
      : "";

  function openTour() {
    setOpen(true);
    setCurrent(0);
    setImgLoaded(false);
    setScale(1);
    setSlideDir(null);
  }

  function closeTour() {
    setOpen(false);
    setScale(1);
    setSlideDir(null);
  }

  return (
    <>
      {/* ── Keyframes ── */}
      <style>{`
        @keyframes vtSlideRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes vtSlideLeft {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
        .vt-slide-right { animation: vtSlideRight 0.28s cubic-bezier(0.25,0.46,0.45,0.94) forwards; }
        .vt-slide-left  { animation: vtSlideLeft  0.28s cubic-bezier(0.25,0.46,0.45,0.94) forwards; }
      `}</style>

      {/* ── Trigger card ── */}
      <div style={{
        background: "linear-gradient(135deg, #111a1f 0%, #0A1216 100%)",
        border: "1px solid #D4AF37", borderRadius: 14, padding: "18px 20px", marginBottom: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "rgba(212,175,55,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, flexShrink: 0,
          }}>
            🏠
          </div>
          <div>
            <p style={{ color: "var(--bl-cream)", fontWeight: 700, fontSize: 15, marginBottom: 2 }}>
              Visite virtuelle
            </p>
            <p style={{ color: "var(--bl-cream-dim)", fontSize: 12 }}>
              {rooms.length} pièce{rooms.length > 1 ? "s" : ""} · Swipe &amp; pinch pour zoomer
            </p>
          </div>
        </div>

        {/* Preview thumbnails */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14, overflowX: "auto" }}>
          {rooms.slice(0, 5).map((r) => (
            <div key={r.id} style={{
              width: 56, height: 56, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "var(--bg-primary)",
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.url} alt={r.room_name} loading="lazy"
                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ))}
          {rooms.length > 5 && (
            <div style={{
              width: 56, height: 56, borderRadius: 8, flexShrink: 0,
              background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#D4AF37", fontSize: 11, fontWeight: 700,
            }}>
              +{rooms.length - 5}
            </div>
          )}
        </div>

        <button
          onClick={openTour}
          style={{
            width: "100%", background: "#D4AF37", color: "var(--bl-cream)", border: "none",
            borderRadius: 12, padding: "13px 16px", fontWeight: 700, fontSize: 14,
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", gap: 8, minHeight: 48,
          }}
        >
          🚪 Commencer la visite →
        </button>
      </div>

      {/* ── Full-screen overlay ── */}
      {open && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "#000", display: "flex", flexDirection: "column",
        }}>

          {/* Header */}
          <div style={{
            background: "rgba(0,0,0,0.6)",
            padding: "12px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0,
            userSelect: "none",
          }}>
            <button
              onClick={closeTour}
              style={{
                width: 44, height: 44, borderRadius: 22,
                background: "rgba(255,255,255,0.12)", border: "none",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <X style={{ width: 20, height: 20, color: "var(--bl-cream)" }} />
            </button>

            <div style={{ textAlign: "center" }}>
              <p style={{ color: "var(--bl-cream)", fontWeight: 700, fontSize: 14, margin: 0 }}>
                {room.room_name}
              </p>
              <p style={{ color: "var(--bl-cream-faint)", fontSize: 12, margin: 0 }}>
                {current + 1} / {rooms.length}
              </p>
            </div>

            {/* spacer */}
            <div style={{ width: 44 }} />
          </div>

          {/* Main image area */}
          <div
            style={{
              flex: 1,
              position: "relative",
              overflow: "hidden",
              touchAction: "none",
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Loading spinner */}
            {!imgLoaded && (
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "#0a0a0a", zIndex: 1,
              }}>
                <div className="w-10 h-10 border-2 border-white/20 border-t-[#D4AF37] rounded-full animate-spin" />
              </div>
            )}

            {/* Animated wrapper — keyed per room for slide-in */}
            <div
              key={room.id}
              className={animClass}
              onAnimationEnd={() => setSlideDir(null)}
              style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={room.url}
                alt={room.room_name}
                onLoad={() => setImgLoaded(true)}
                draggable={false}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  transform: `scale(${scale})`,
                  transformOrigin: "center center",
                  transition: pinching ? "none" : "transform 0.18s ease-out, opacity 0.2s ease",
                  opacity: imgLoaded ? 1 : 0,
                  userSelect: "none",
                  WebkitUserSelect: "none",
                }}
              />
            </div>

            {/* Zoom level indicator (visible when zoomed) */}
            {scale > 1.05 && (
              <div style={{
                position: "absolute", bottom: 16, right: 16,
                background: "rgba(0,0,0,0.55)", borderRadius: 20,
                padding: "4px 10px", fontSize: 11, fontWeight: 700, color: "var(--bl-cream)",
                pointerEvents: "none",
              }}>
                {Math.round(scale * 10) / 10}×
              </div>
            )}
          </div>

          {/* Footer thumbnails */}
          <div style={{
            background: "rgba(0,0,0,0.8)",
            padding: "10px 16px",
            overflowX: "auto",
            flexShrink: 0,
          }}>
            <div
              ref={thumbsRef}
              style={{ display: "flex", gap: 8, width: "max-content" }}
            >
              {rooms.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => goTo(i, i >= current ? "right" : "left")}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    background: "transparent", border: "none", cursor: "pointer", padding: 0,
                  }}
                >
                  <div style={{
                    width: 64, height: 64, borderRadius: 8, overflow: "hidden", flexShrink: 0,
                    border: i === current ? "2px solid #D4AF37" : "2px solid rgba(255,255,255,0.12)",
                    opacity: i === current ? 1 : 0.55,
                    transition: "border-color 0.15s, opacity 0.15s",
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r.url}
                      alt={r.room_name}
                      loading="lazy"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <p style={{
                    color: i === current ? "#D4AF37" : "rgba(255,255,255,0.45)",
                    fontSize: 10, maxWidth: 64,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    margin: 0, transition: "color 0.15s",
                  }}>
                    {r.room_name}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
