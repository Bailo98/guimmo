"use client";
import { useState, useRef, useCallback, type ReactNode } from "react";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => void;
}

const THRESHOLD = 80;
const SIMULATE_MS = 300;

export function PullToRefresh({ children, onRefresh }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const isPulling = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY !== 0) return;
    startY.current = e.touches[0].clientY;
    isPulling.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current || startY.current === null) return;
    if (window.scrollY !== 0) {
      startY.current = null;
      isPulling.current = false;
      setPullDistance(0);
      return;
    }
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      setPullDistance(Math.min(delta, THRESHOLD + 40));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(THRESHOLD);
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
        onRefresh();
      }, SIMULATE_MS);
    } else {
      setPullDistance(0);
    }
    startY.current = null;
  }, [pullDistance, onRefresh]);

  const showIndicator = pullDistance > 10 || isRefreshing;
  const isReady = pullDistance >= THRESHOLD;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ position: "relative" }}
    >
      {/* Pull indicator */}
      {showIndicator && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: "12px",
            paddingBottom: "12px",
            background: "rgba(255,255,255,0.95)",
            borderBottom: "1px solid #f1f5f9",
            transform: `translateY(${isRefreshing ? 0 : Math.min(pullDistance - THRESHOLD, 0)}px)`,
            transition: isRefreshing ? "transform 0.2s ease" : "none",
          }}
        >
          {isRefreshing ? (
            <>
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  border: "3px solid #f1f5f9",
                  borderTopColor: "var(--accent-gold)",
                  animation: "spin 0.7s linear infinite",
                }}
              />
              <span style={{ fontSize: "12px", color: "#64748b", marginTop: "6px", fontWeight: 600 }}>
                Chargez...
              </span>
            </>
          ) : (
            <>
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  border: "3px solid #f1f5f9",
                  borderTopColor: "var(--accent-gold)",
                  transform: `rotate(${(pullDistance / THRESHOLD) * 360}deg)`,
                  transition: "transform 0.1s",
                }}
              />
              <span style={{ fontSize: "12px", color: "#64748b", marginTop: "6px", fontWeight: 600 }}>
                {isReady ? "Relâchez pour rafraîchir" : "Tirez pour rafraîchir"}
              </span>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div
        style={{
          transform: isRefreshing || pullDistance > 0
            ? `translateY(${isRefreshing ? THRESHOLD : pullDistance}px)`
            : "none",
          transition: isRefreshing || pullDistance === 0 ? "transform 0.2s ease" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
