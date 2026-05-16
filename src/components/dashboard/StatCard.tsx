export function StatCard({ label, value, sub, borderColor = "var(--bl-amber)" }: {
  label: string;
  value: string | number;
  sub?: React.ReactNode;
  borderColor?: string;
}) {
  return (
    <div style={{
      background: "var(--bl-surface)",
      borderLeft: `3px solid ${borderColor}`,
      borderRadius: "0 12px 12px 0",
      padding: "14px 16px",
    }}>
      <span className="bl-stat-label">{label}</span>
      <span className="bl-stat-value">{value}</span>
      {sub && (
        <span style={{ fontSize: 11, color: "var(--bl-cream-faint)", marginTop: 4, display: "block" }}>
          {sub}
        </span>
      )}
    </div>
  );
}
