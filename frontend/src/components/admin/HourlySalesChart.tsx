"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

interface HourPoint {
  hour: number;
  revenue: number;
  orders: number;
}

interface DayPoint {
  date: string;
  revenue: number;
  orders: number;
}

const BRAND = "#C4276B";

function formatHour(h: number) {
  const period = h < 12 ? "am" : "pm";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}${period}`;
}

function formatShortDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CustomTooltip({
  active,
  payload,
  label,
  daily,
}: {
  active?: boolean;
  payload?: { payload: HourPoint | DayPoint }[];
  label?: number | string;
  daily?: boolean;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded border-2 border-ink/15 bg-surface px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-ink">{daily ? formatShortDate(String(label)) : formatHour(Number(label ?? 0))}</p>
      <p className="mt-0.5 text-ink-soft">
        Rs. {point.revenue.toLocaleString()} · {point.orders} order{point.orders === 1 ? "" : "s"}
      </p>
    </div>
  );
}

// Renders hour-bucketed bars for a single-day range, or day-bucketed bars (reusing the
// same revenue-trend shape as RevenueTrendChart) when a wider range is selected —
// hourly bars stop making visual sense once the range spans multiple days.
export default function HourlySalesChart({ data, daily }: { data: (HourPoint | DayPoint)[]; daily?: boolean }) {
  const tickInterval = daily ? Math.max(0, Math.floor(data.length / 6) - 1) : 2;

  return (
    <div className="h-full min-h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }} barCategoryGap="20%">
          <XAxis
            dataKey={daily ? "date" : "hour"}
            tickFormatter={daily ? formatShortDate : (h: number) => formatHour(h)}
            interval={tickInterval}
            tick={{ fontSize: 10, fill: "var(--chart-tick)" }}
            axisLine={{ stroke: "var(--chart-axis-line)" }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip daily={daily} />} cursor={{ fill: BRAND, opacity: 0.06 }} />
          <Bar dataKey="revenue" fill={BRAND} radius={[3, 3, 0, 0]} maxBarSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
