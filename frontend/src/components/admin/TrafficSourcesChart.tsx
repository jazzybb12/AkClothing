"use client";

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";

interface Point {
  channel: "DIRECT" | "ORGANIC" | "SOCIAL" | "REFERRAL" | "EMAIL";
  sessions: number;
}

// Validated categorical palette, slots 1-5 (see dataviz skill references/palette.md) —
// distinct from the site's brand/accent colors on purpose, matching how analytics
// dashboards conventionally separate "chart series" from "brand" color.
const CHANNEL_META: Record<Point["channel"], { label: string; color: string }> = {
  DIRECT: { label: "Direct", color: "#2a78d6" },
  ORGANIC: { label: "Organic Search", color: "#eb6834" },
  SOCIAL: { label: "Social", color: "#1baf7a" },
  REFERRAL: { label: "Referral", color: "#eda100" },
  EMAIL: { label: "Email", color: "#e87ba4" },
};

export default function TrafficSourcesChart({ data }: { data: Point[] }) {
  const chartData = data.map((d) => ({ ...d, label: CHANNEL_META[d.channel].label, color: CHANNEL_META[d.channel].color }));
  const allZero = data.every((d) => d.sessions === 0);

  if (allZero) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-ink-soft">
        No traffic recorded yet — this fills in as visitors browse the store.
      </div>
    );
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 24, left: 4, bottom: 4 }} barCategoryGap="30%">
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            width={90}
            tick={{ fontSize: 12, fill: "var(--chart-category-tick)" }}
            axisLine={false}
            tickLine={false}
          />
          <Bar dataKey="sessions" radius={[0, 3, 3, 0]} maxBarSize={16}>
            {chartData.map((entry) => (
              <Cell key={entry.channel} fill={entry.color} />
            ))}
            <LabelList dataKey="sessions" position="right" style={{ fill: "var(--chart-label)", fontSize: 12, fontWeight: 500 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
