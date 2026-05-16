import { CheckCircle, XCircle, PauseCircle } from "lucide-react";

type Status = "active" | "paused" | "sold" | "pro";

const MAP: Record<Status, { cls: string; label: string; Icon: React.ElementType }> = {
  active: { cls: "bl-badge-active", label: "Actif",    Icon: CheckCircle },
  paused: { cls: "bl-badge-paused", label: "En pause", Icon: PauseCircle },
  sold:   { cls: "bl-badge-rented", label: "Loué",     Icon: XCircle },
  pro:    { cls: "bl-badge-pro",    label: "Pro",      Icon: CheckCircle },
};

export function StatusBadge({ status }: { status: Status }) {
  const { cls, label, Icon } = MAP[status];
  return (
    <span className={`${cls} inline-flex items-center gap-1`}>
      <Icon className="w-2.5 h-2.5" />
      {label}
    </span>
  );
}
