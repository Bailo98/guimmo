"use client";
import { useState, useEffect } from "react";

export function LiveCounterBadge({ initial }: { initial: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted || initial === 0) return null;
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
      style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)" }}
    >
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#22c55e" }} />
      <span className="text-sm font-semibold" style={{ color: "#22c55e" }}>
        {initial}&nbsp;nouvelle{initial > 1 ? "s" : ""}&nbsp;annonce{initial > 1 ? "s" : ""}&nbsp;aujourd&apos;hui
      </span>
    </div>
  );
}
