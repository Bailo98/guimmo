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
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: 16,
      padding: "10px 12px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
        <p style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 900, margin: 0 }}>
          Fiabilité {scoreLabel(score).toLowerCase()}
        </p>
        <p style={{ fontWeight: 900, fontSize: 18, color, margin: 0, fontFamily: "var(--font-display), sans-serif" }}>
          {score}<span style={{ fontSize: 11, color: "var(--text-primary-faint)" }}>/100</span>
        </p>
      </div>

      <div style={{ height: 6, background: "var(--border)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 999, transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}
