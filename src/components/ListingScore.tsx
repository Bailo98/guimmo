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
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: 999,
      padding: "8px 12px",
    }}>
      <p style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 900, margin: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <span>Score confiance</span>
        <span style={{ color, fontSize: 15, flexShrink: 0 }}>{score}<span style={{ fontSize: 11, color: "var(--text-primary-faint)" }}>/100</span></span>
      </p>
    </div>
  );
}
