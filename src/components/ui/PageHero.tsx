interface PageHeroProps {
  title: string;
  subtitle?: string;
  badge?: string;
  align?: "center" | "left";
}

export function PageHero({ title, subtitle, badge, align = "left" }: PageHeroProps) {
  const isCenter = align === "center";
  return (
    <div
      className={`py-12 md:py-16 px-6 md:px-12 ${isCenter ? "text-center" : ""}`}
      style={{
        background:
          "radial-gradient(ellipse 70% 90% at 100% 0%, rgba(200,144,30,0.18) 0%, transparent 60%), var(--LogerBien-surface)",
        borderBottom: "1px solid var(--LogerBien-border)",
      }}
    >
      <div className={`max-w-4xl ${isCenter ? "mx-auto" : ""}`}>
        {badge && (
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
            style={{
              background: "rgba(233,233,0,0.15)",
              border: "1px solid rgba(200,144,30,0.30)",
              color: "var(--LogerBien-amber-light)",
            }}
          >
            {badge}
          </div>
        )}
        <h1
          className="text-3xl md:text-5xl font-black leading-tight mb-3"
          style={{
            fontFamily: "var(--font-display), sans-serif",
            color: "var(--LogerBien-cream)",
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="text-base md:text-lg max-w-2xl"
            style={{
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontWeight: 300,
              color: "var(--LogerBien-cream-dim)",
              ...(isCenter ? { marginLeft: "auto", marginRight: "auto" } : {}),
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
