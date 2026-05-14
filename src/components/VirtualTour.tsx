"use client";

import { useState, useRef, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

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
  const [open,       setOpen]       = useState(false);
  const [current,   setCurrent]    = useState(0);
  const [imgLoaded, setImgLoaded]  = useState(false);

  const touchStartX = useRef(0);

  const goTo = useCallback((idx: number) => {
    setCurrent(((idx % rooms.length) + rooms.length) % rooms.length);
    setImgLoaded(false);
  }, [rooms.length]);

  const goNext = useCallback(() => goTo(current + 1), [current, goTo]);
  const goPrev = useCallback(() => goTo(current - 1), [current, goTo]);

  if (!rooms.length) return null;

  const room = rooms[current];

  return (
    <>
      {/* ── Trigger card ── */}
      <div style={{
        background: "linear-gradient(135deg, #1a2e1e 0%, #0d1610 100%)",
        border: "1px solid #c8901e",
        borderRadius: 14,
        padding: "18px 20px",
        marginBottom: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "rgba(200,144,30,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, flexShrink: 0,
          }}>
            🏠
          </div>
          <div>
            <p style={{ color: "#f7f2e6", fontWeight: 700, fontSize: 15, marginBottom: 2 }}>
              Visite virtuelle
            </p>
            <p style={{ color: "rgba(240,230,204,0.55)", fontSize: 12 }}>
              {rooms.length} pièce{rooms.length > 1 ? "s" : ""} à explorer · Naviguez au doigt
            </p>
          </div>
        </div>

        {/* Thumbnail preview strip */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14, overflowX: "auto" }}>
          {rooms.slice(0, 5).map((r, i) => (
            <div key={r.id} style={{
              width: 56, height: 56, borderRadius: 8, overflow: "hidden",
              flexShrink: 0, background: "#0d1610",
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={r.url}
                alt={r.room_name}
                loading="lazy"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          ))}
          {rooms.length > 5 && (
            <div style={{
              width: 56, height: 56, borderRadius: 8, flexShrink: 0,
              background: "rgba(200,144,30,0.12)", border: "1px solid rgba(200,144,30,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#daa84a", fontSize: 11, fontWeight: 700,
            }}>
              +{rooms.length - 5}
            </div>
          )}
        </div>

        <button
          onClick={() => { setOpen(true); setCurrent(0); setImgLoaded(false); }}
          style={{
            width: "100%", background: "#c8901e", color: "#fff", border: "none",
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
          position: "fixed", inset: 0, zIndex: 9999,
          background: "#000", display: "flex", flexDirection: "column",
        }}>
          {/* Header */}
          <div style={{
            background: "rgba(0,0,0,0.85)",
            padding: "12px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <button
              onClick={() => setOpen(false)}
              style={{
                width: 44, height: 44, borderRadius: 22,
                background: "rgba(255,255,255,0.12)", border: "none",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <X style={{ width: 20, height: 20, color: "#fff" }} />
            </button>

            <div style={{ textAlign: "center" }}>
              <p style={{ color: "#f7f2e6", fontWeight: 700, fontSize: 14, marginBottom: 2 }}>
                {room.room_name}
              </p>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
                {current + 1} / {rooms.length}
              </p>
            </div>

            {/* spacer */}
            <div style={{ width: 44 }} />
          </div>

          {/* Main image */}
          <div
            style={{ flex: 1, position: "relative", overflow: "hidden" }}
            onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              const delta = touchStartX.current - e.changedTouches[0].clientX;
              if (Math.abs(delta) > 50) delta > 0 ? goNext() : goPrev();
            }}
          >
            {/* Skeleton */}
            {!imgLoaded && (
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "#0a0a0a",
              }}>
                <div className="w-10 h-10 border-2 border-white/20 border-t-[#c8901e] rounded-full animate-spin" />
              </div>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={room.id}
              src={room.url}
              alt={room.room_name}
              onLoad={() => setImgLoaded(true)}
              style={{
                width: "100%", height: "100%", objectFit: "contain",
                opacity: imgLoaded ? 1 : 0, transition: "opacity 0.2s",
              }}
            />

            {/* Arrow buttons */}
            {rooms.length > 1 && (
              <>
                <button
                  onClick={goPrev}
                  style={{
                    position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                    width: 44, height: 44, borderRadius: 22,
                    background: "rgba(0,0,0,0.55)", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <ChevronLeft style={{ width: 24, height: 24, color: "#fff" }} />
                </button>
                <button
                  onClick={goNext}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    width: 44, height: 44, borderRadius: 22,
                    background: "rgba(0,0,0,0.55)", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <ChevronRight style={{ width: 24, height: 24, color: "#fff" }} />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {rooms.length > 1 && (
            <div style={{
              background: "rgba(0,0,0,0.88)", padding: "10px 16px",
              overflowX: "auto", flexShrink: 0,
            }}>
              <div style={{ display: "flex", gap: 10, width: "max-content" }}>
                {rooms.map((r, i) => (
                  <button
                    key={r.id}
                    onClick={() => goTo(i)}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                      background: "transparent", border: "none", cursor: "pointer", padding: 0,
                    }}
                  >
                    <div style={{
                      width: 60, height: 60, borderRadius: 8, overflow: "hidden",
                      border: i === current ? "2px solid #c8901e" : "2px solid transparent",
                      opacity: i === current ? 1 : 0.55,
                      transition: "all 0.15s",
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
                      color: i === current ? "#c8901e" : "rgba(255,255,255,0.45)",
                      fontSize: 10, maxWidth: 64,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {r.room_name}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
