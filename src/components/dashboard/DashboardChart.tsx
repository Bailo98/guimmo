"use client";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

interface Series {
  dataKey: string;
  name: string;
  color: string;
}

interface DashboardChartProps {
  type: "bar" | "line";
  data: Array<Record<string, unknown>>;
  title: string;
  height?: number;
  series: Series[];
  xAxisKey?: string;
  ticks?: string[];
  showDots?: boolean;
}

const TICK = { fill: "rgba(240,230,204,0.35)", fontSize: 10 };
const TOOLTIP_STYLE = {
  contentStyle: {
    background: "#0d1a10",
    border: "1px solid rgba(134,239,172,0.15)",
    borderRadius: 8,
    color: "#f0fdf4",
    fontSize: 12,
  },
  cursor: { fill: "rgba(200,144,30,0.08)" },
};

export default function DashboardChart({
  type,
  data,
  title,
  height = 160,
  series,
  xAxisKey = "label",
  ticks,
  showDots = false,
}: DashboardChartProps) {
  return (
    <div
      className="p-4 mb-6"
      style={{
        background: "var(--bl-surface)",
        borderLeft: "3px solid var(--bl-amber)",
        borderRadius: "0 16px 16px 0",
      }}
    >
      <p className="bl-section-label mb-3">{title}</p>
      <ResponsiveContainer width="100%" height={height}>
        {type === "bar" ? (
          <BarChart data={data} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
            <XAxis
              dataKey={xAxisKey}
              tick={TICK}
              axisLine={false}
              tickLine={false}
              ticks={ticks}
            />
            <YAxis tick={TICK} axisLine={false} tickLine={false} />
            <Tooltip {...TOOLTIP_STYLE} />
            {series.map((s) => (
              <Bar
                key={s.dataKey}
                dataKey={s.dataKey}
                name={s.name}
                fill={s.color}
                activeBar={{ fill: "#f97316" }}
                radius={[3, 3, 0, 0]}
              />
            ))}
          </BarChart>
        ) : (
          <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis
              dataKey={xAxisKey}
              tick={TICK}
              axisLine={false}
              tickLine={false}
              ticks={ticks}
            />
            <YAxis tick={TICK} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip {...TOOLTIP_STYLE} />
            {series.map((s, i) => (
              <Line
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                dot={showDots && i === 0 ? { fill: "#f97316", r: 3, strokeWidth: 0 } : false}
                activeDot={showDots && i === 0 ? { r: 5, fill: "#f97316" } : { r: 4 }}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
