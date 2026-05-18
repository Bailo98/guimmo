import { History } from "lucide-react";

interface TimelineEvent {
  date: Date;
  label: string;
  type: "publish" | "milestone" | "price" | "available";
  icon: string;
}

function buildTimeline(
  price: number,
  createdAt: Date,
  availableNow: boolean
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const now = new Date();

  // Published
  events.push({
    date: createdAt,
    label: "Annonce publiée",
    type: "publish",
    icon: "📋",
  });

  // Views milestone (7 days after)
  const viewsDate = new Date(createdAt.getTime() + 7 * 86400000);
  if (viewsDate < now)
    events.push({
      date: viewsDate,
      label: "100 vues atteintes",
      type: "milestone",
      icon: "👁️",
    });

  // Price reduction (14 days after, 10% less)
  const priceDate = new Date(createdAt.getTime() + 14 * 86400000);
  if (priceDate < now) {
    const oldPrice = Math.round(price * 1.1);
    events.push({
      date: priceDate,
      label: `Prix réduit de ${oldPrice.toLocaleString()} → ${price.toLocaleString()} GNF`,
      type: "price",
      icon: "💰",
    });
  }

  // Available (if availableNow)
  if (availableNow) {
    const availDate = new Date(createdAt.getTime() + 3 * 86400000);
    if (availDate < now)
      events.push({
        date: availDate,
        label: "Logement disponible immédiatement",
        type: "available",
        icon: "✅",
      });
  }

  // Sort by date
  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function formatDate(date: Date): string {
  const months = [
    "Jan", "Fév", "Mar", "Avr", "Mai", "Jun",
    "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc",
  ];
  const d = date.getDate().toString().padStart(2, "0");
  const m = months[date.getMonth()];
  const y = date.getFullYear();
  return `${d} ${m} ${y}`;
}

const DOT_CLASSES: Record<TimelineEvent["type"], string> = {
  publish: "bg-blue-500",
  milestone: "bg-purple-500",
  price: "bg-[#E9E900]",
  available: "bg-green-500",
};

const LINE_CLASSES: Record<TimelineEvent["type"], string> = {
  publish: "border-blue-200 dark:border-blue-900",
  milestone: "border-purple-200 dark:border-purple-900",
  price: "border-orange-200 dark:border-orange-900",
  available: "border-green-200 dark:border-green-900",
};

interface Props {
  price: number;
  createdAt: Date;
  availableNow: boolean;
}

export function PropertyTimeline({ price, createdAt, availableNow }: Props) {
  const events = buildTimeline(price, createdAt, availableNow);

  return (
    <div className="bg-[#2c2f36] rounded-2xl p-5 border border-[#1e2a30]">
      <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <History className="w-4 h-4 text-[#E9E900]" /> Historique de l&apos;annonce
      </h2>

      <ol className="space-y-0">
        {events.map((event, idx) => {
          const isLast = idx === events.length - 1;
          return (
            <li key={idx} className="flex gap-3">
              {/* Left column: dot + line */}
              <div className="flex flex-col items-center">
                <span
                  className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${DOT_CLASSES[event.type]}`}
                />
                {!isLast && (
                  <span
                    className={`flex-1 w-0 border-l-2 border-dashed my-1 ${LINE_CLASSES[event.type]}`}
                    style={{ minHeight: "28px" }}
                  />
                )}
              </div>

              {/* Right column: content */}
              <div className={`pb-5 ${isLast ? "pb-0" : ""}`}>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-base leading-none">{event.icon}</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {event.label}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{formatDate(event.date)}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
