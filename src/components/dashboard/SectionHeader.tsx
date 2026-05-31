export function SectionHeader({ title, subtitle, action }: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h2 className="bl-section-title">{title}</h2>
        {subtitle && (
          <p className="text-sm mt-0.5" style={{ color: "var(--text-primary-faint)" }}>{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0 ml-3">{action}</div>}
    </div>
  );
}
