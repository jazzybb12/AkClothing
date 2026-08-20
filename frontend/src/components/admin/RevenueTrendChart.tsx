"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Point {
  date: string;
  revenue: number;
  orders: number;
}

const BRAND = "#C4276B";

function formatShortDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border-2 border-ink/15 bg-surface px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-ink">{label ? formatShortDate(label) : ""}</p>
      <p className="mt-0.5 text-ink-soft">Rs. {payload[0].value.toLocaleString()}</p>
    </div>
  );
}

export default function RevenueTrendChart({ data }: { data: Point[] }) {
  const tickInterval = Math.max(0, Math.floor(data.length / 6) - 1);

  return (
    <div className="h-full min-h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BRAND} stopOpacity={0.12} />
              <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="0" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatShortDate}
            interval={tickInterval}
            tick={{ fontSize: 11, fill: "var(--chart-tick)" }}
            axisLine={{ stroke: "var(--chart-axis-line)" }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`)}
            tick={{ fontSize: 11, fill: "var(--chart-tick)" }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke={BRAND}
            strokeWidth={2}
            fill="url(#revenueFill)"
            activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
