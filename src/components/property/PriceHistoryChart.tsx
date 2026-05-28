"use client";

import { TrendingUp } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  price: number;
  transactionType: string;
}


function generatePriceData(currentPrice: number) {
  const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"];
  // Seed a deterministic-ish variation trending toward currentPrice
  const variations = [0.88, 0.91, 0.94, 0.97, 0.99, 1.0];
  const noise = [0.03, -0.02, 0.04, -0.01, 0.02, 0];

  return months.map((month, i) => ({
    month,
    price: Math.round(currentPrice * (variations[i] + noise[i])),
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1e2430] border border-[var(--color-border)] rounded-lg px-3 py-2 shadow-xl">
        <p className="text-slate-400 text-xs mb-0.5">{label}</p>
        <p className="text-white font-bold text-sm">{formatPrice(payload[0].value)}</p>
      </div>
    );
  }
  return null;
}

export function PriceHistoryChart({ price }: Props) {
  const data = generatePriceData(price);

  return (
    <div className="bg-[var(--bg-card-light)] rounded-2xl p-5 border border-[var(--color-border)]">
      <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
        Historique des prix
      </h2>

      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#D4AF37"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#D4AF37", strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <p className="text-xs text-slate-400 mt-2">
        Prix estimé sur les 6 derniers mois
      </p>
    </div>
  );
}
