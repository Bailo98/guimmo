export function SkeletonCard() {
  return (
    <div
      style={{
        position: "relative",
        height: "min(72vw, 420px)",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        background: "#161B26",
        flexShrink: 0,
      }}
    >
      {/* Photo zone — full card */}
      <div className="skeleton" style={{ position: "absolute", inset: 0 }} />

      {/* Simulated bottom gradient */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(transparent 40%, rgba(10,18,22,0.85) 70%, rgba(10,18,22,0.95) 100%)",
        pointerEvents: "none",
      }} />

      {/* Simulated favourite button top-right */}
      <div className="skeleton" style={{
        position: "absolute", top: 12, right: 12,
        width: 38, height: 38, borderRadius: "50%",
        background: "rgba(255,255,255,0.08)",
      }} />

      {/* Simulated badge top-left */}
      <div className="skeleton" style={{
        position: "absolute", top: 12, left: 12,
        width: 72, height: 22, borderRadius: 20,
        background: "rgba(255,255,255,0.08)",
      }} />

      {/* Info overlay bottom */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "16px 76px 16px 16px",
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        {/* Prix + badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="skeleton" style={{ height: 22, width: "42%", borderRadius: 6, background: "rgba(255,255,255,0.10)" }} />
          <div className="skeleton" style={{ height: 20, width: 64, borderRadius: 20, background: "rgba(255,255,255,0.08)" }} />
        </div>
        {/* Titre */}
        <div className="skeleton" style={{ height: 16, width: "78%", borderRadius: 5, background: "rgba(255,255,255,0.10)" }} />
        {/* Quartier */}
        <div className="skeleton" style={{ height: 13, width: "55%", borderRadius: 5, background: "rgba(255,255,255,0.07)" }} />
        {/* Score bar */}
        <div className="skeleton" style={{ height: 3, width: "100%", borderRadius: 4, background: "rgba(200,169,126,0.20)" }} />
      </div>

      {/* Simulated contact button bottom-right */}
      <div className="skeleton" style={{
        position: "absolute", bottom: 16, right: 16,
        height: 38, width: 110, borderRadius: 50,
        background: "rgba(37,211,102,0.15)",
      }} />
    </div>
  );
}
