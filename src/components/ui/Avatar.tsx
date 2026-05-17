import Image from "next/image";

const SIZES = { sm: 32, md: 48, lg: 80, xl: 120 } as const;
type Size = keyof typeof SIZES;

const PALETTE = ["#E9E900", "#E9E900", "#60a5fa", "#a78bfa", "#2dd4bf"];

function nameColor(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return PALETTE[h % PALETTE.length];
}

function initials(name: string): string {
  if (!name.trim()) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface AvatarProps {
  url?: string | null;
  name?: string | null;
  size?: Size;
  className?: string;
  style?: React.CSSProperties;
}

export function Avatar({ url, name, size = "md", className, style }: AvatarProps) {
  const px = SIZES[size];
  const displayName = name ?? "";
  const ini = initials(displayName);
  const bg = nameColor(displayName || "?");
  const fontSize = px <= 32 ? 11 : px <= 48 ? 14 : px <= 80 ? 22 : 34;

  const base: React.CSSProperties = {
    width: px,
    height: px,
    borderRadius: "50%",
    flexShrink: 0,
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    ...style,
  };

  if (url) {
    return (
      <div style={base} className={className}>
        <Image
          src={url}
          alt={displayName || "avatar"}
          width={px}
          height={px}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          unoptimized
        />
      </div>
    );
  }

  return (
    <div style={{ ...base, background: bg }} className={className}>
      <span style={{ color: "#fff", fontWeight: 800, fontSize, lineHeight: 1, fontFamily: "inherit" }}>
        {ini}
      </span>
    </div>
  );
}
