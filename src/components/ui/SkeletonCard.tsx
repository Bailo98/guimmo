export function SkeletonCard() {
  return (
    <div
      style={{
        background: "var(--bg-card, #161B26)",
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid var(--border-subtle, rgba(255,255,255,0.06))",
        boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
      }}
    >
      {/* Photo zone */}
      <div className="skeleton" style={{ height: 220 }} />

      {/* Card body */}
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Ligne 1 : prix + badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="skeleton" style={{ height: 22, width: "45%", borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 20, width: 68, borderRadius: 20 }} />
        </div>

        {/* Ligne 2 : titre */}
        <div className="skeleton" style={{ height: 18, width: "80%", borderRadius: 6 }} />

        {/* Ligne 3 : localisation */}
        <div className="skeleton" style={{ height: 14, width: "55%", borderRadius: 6 }} />

        {/* Ligne 4 : specs */}
        <div style={{ display: "flex", gap: 10 }}>
          <div className="skeleton" style={{ height: 12, width: 52, borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 12, width: 52, borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 12, width: 40, borderRadius: 6 }} />
        </div>

        {/* Ligne 5 : barre score */}
        <div className="skeleton" style={{ height: 4, width: "100%", borderRadius: 4 }} />

        {/* Bouton WhatsApp */}
        <div className="skeleton" style={{ height: 44, width: "100%", borderRadius: 12, marginTop: 4 }} />
      </div>
    </div>
  );
}
