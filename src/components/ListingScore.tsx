interface Props {
  images: number;
  description?: string | null;
  phone?: string | null;
  surface?: number | null;
  rooms?: number | null;
  compact?: boolean;
}

function calcScore(p: Props): number {
  let s = 0;
  if (p.images >= 1) s += 10;
  if (p.images >= 2) s += 30;
  if ((p.description?.length ?? 0) >= 50) s += 20;
  if ((p.phone?.replace(/\D/g, "").length ?? 0) >= 8) s += 20;
  if ((p.surface ?? 0) > 0) s += 10;
  if ((p.rooms ?? 0) > 0) s += 10;
  return s;
}

function scoreColor(score: number): string {
  if (score >= 71) return "var(--accent-gold)";
  if (score >= 41) return "var(--accent-gold)";
  return "#f87171";
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Bon";
  if (score >= 40) return "Moyen";
  return "Incomplet";
}

export function ListingScore(props: Props) {
  const score = calcScore(props);
  const color = scoreColor(score);

  if (props.compact) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ flex: 1, height: 4, background: "var(--border)", borderRadius: 999, overflow: "hidden" }}>
          <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 999, transition: "width 0.4s" }} />
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color, flexShrink: 0 }}>{score}%</span>
      </div>
    );
  }

  return (
    <div style={{
      background: "rgba(134,239,172,0.04)",
      border: "1px solid var(--border)",
      borderRadius: 14,
      padding: "14px 16px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <p style={{ color: "var(--text-primary-dim)", fontSize: 11, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", margin: 0 }}>
          Score de confiance
        </p>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ fontWeight: 800, fontSize: 22, color, fontFamily: "var(--font-display), sans-serif" }}>
            {score}
          </span>
          <span style={{ fontSize: 12, color: "var(--text-primary-faint)" }}>/100</span>
          <span style={{ fontSize: 11, fontWeight: 700, color, marginLeft: 4 }}>— {scoreLabel(score)}</span>
        </div>
      </div>

      {/* Bar */}
      <div style={{ height: 8, background: "var(--border)", borderRadius: 999, overflow: "hidden", marginBottom: 12 }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 999, transition: "width 0.5s ease" }} />
      </div>

      {/* Criteria */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px" }}>
        {[
          { label: "Photos (2+)", ok: props.images >= 2, pts: "+30" },
          { label: "Photo (1)", ok: props.images >= 1 && props.images < 2, pts: "+10", skip: props.images >= 2 },
          { label: "Description", ok: (props.description?.length ?? 0) >= 50, pts: "+20" },
          { label: "Téléphone", ok: (props.phone?.replace(/\D/g, "").length ?? 0) >= 8, pts: "+20" },
          { label: "Surface", ok: (props.surface ?? 0) > 0, pts: "+10" },
          { label: "Chambres", ok: (props.rooms ?? 0) > 0, pts: "+10" },
        ]
          .filter((c) => !c.skip)
          .map((c) => (
            <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 11, color: c.ok ? "var(--accent-gold)" : "var(--text-primary-faint)" }}>
                {c.ok ? "✓" : "○"}
              </span>
              <span style={{ fontSize: 11, color: c.ok ? "var(--text-primary-dim)" : "var(--text-primary-faint)" }}>
                {c.label}
              </span>
              <span style={{ fontSize: 10, color: c.ok ? color : "var(--text-primary-faint)", fontWeight: 700 }}>
                {c.pts}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
