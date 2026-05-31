export function StatCard({ label, value, sub, borderColor = "var(--accent-gold)" }: {
  label: string;
  value: string | number;
  sub?: React.ReactNode;
  borderColor?: string;
}) {
  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderLeft: `3px solid ${borderColor}`,
      borderRadius: "0 12px 12px 0",
      padding: "14px 16px",
    }}>
      <span style={{
        fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase" as const,
        fontWeight: 500, marginBottom: 4, display: "block",
        color: "var(--text-secondary)",
      }}>{label}</span>
      <span style={{
        color: "var(--text-primary)",
        fontSize: "clamp(22px, 5vw, 28px)",
        fontWeight: 700, lineHeight: 1, display: "block",
      }}>{value}</span>
      {sub && (
        <span style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4, display: "block", opacity: 0.7 }}>
          {sub}
        </span>
      )}
    </div>
  );
}
