"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import StatTile from "@/components/admin/StatTile";
import RevenueTrendChart from "@/components/admin/RevenueTrendChart";
import HourlySalesChart from "@/components/admin/HourlySalesChart";
import TrafficSourcesChart from "@/components/admin/TrafficSourcesChart";
import DateRangePicker, { DateRangeValue, DEFAULT_RANGE } from "@/components/admin/DateRangePicker";
import { AovIcon, ConversionIcon, CustomersIcon, OrdersIcon, RevenueIcon } from "@/components/admin/icons";

interface DashboardData {
  orderCount: number;
  revenue: number;
  orderCountChangePct: number | null;
  revenueChangePct: number | null;
  totalCustomers: number;
  lowStock: { productName: string; size: string; color: string; stockQty: number }[];
  statusBreakdown: { status: string; count: number }[];
  recentOrders: { id: string; orderNumber: string; customerName: string; total: string; status: string; createdAt: string }[];
  topProducts: { name: string; slug: string | null; qtySold: number }[];
  revenueTrend: { date: string; revenue: number; orders: number }[];
  hourlySales: { hour: number; revenue: number; orders: number }[] | { date: string; revenue: number; orders: number }[];
  hourlySalesGranularity: "hour" | "day";
  visitors: { totalVisitors: number; visitsPerDay: number; bounceRate: number };
  trafficByChannel: { channel: "DIRECT" | "ORGANIC" | "SOCIAL" | "REFERRAL" | "EMAIL"; sessions: number }[];
  avgOrderValue: number;
  conversionRate: number;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-ink/10 text-ink-soft",
  CONFIRMED: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  SHIPPED: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400",
  DELIVERED: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  RETURNED: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400",
};

function rangeFromSearchParams(searchParams: URLSearchParams): DateRangeValue {
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!from || !to) return DEFAULT_RANGE;
  return { from, to, label: from === to ? from : `${from} – ${to}` };
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const { token } = useAdminAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [range, setRange] = useState<DateRangeValue>(DEFAULT_RANGE);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    setRange(rangeFromSearchParams(searchParams));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleRangeChange(next: DateRangeValue) {
    setRange(next);
    router.replace(`/admin/dashboard?from=${next.from}&to=${next.to}`);
  }

  useEffect(() => {
    if (!token) return;
    setData(null);
    apiFetch<DashboardData>(`/admin/dashboard?from=${range.from}&to=${range.to}`, { token }).then(setData);
  }, [token, range.from, range.to]);

  const maxTopSold = Math.max(1, ...(data?.topProducts.map((p) => p.qtySold) ?? [1]));
  const isDaily = data?.hourlySalesGranularity === "day";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <DateRangePicker value={range} onChange={handleRangeChange} />
      </div>

      {/* KPI row — flex-wrap instead of a rigid grid so a 5th tile never leaves an
          orphaned empty cell at in-between viewport widths; each tile grows/shrinks
          to fill the row evenly no matter how many fit per line. */}
      <div className="flex flex-wrap gap-4">
        <StatTile
          icon={<OrdersIcon />}
          label="Orders"
          value={data ? String(data.orderCount) : "—"}
          deltaPct={data?.orderCountChangePct}
          deltaLabel="vs prior period"
        />
        <StatTile
          icon={<RevenueIcon />}
          label="Revenue"
          value={data ? `Rs. ${data.revenue.toLocaleString()}` : "—"}
          deltaPct={data?.revenueChangePct}
          deltaLabel="vs prior period"
        />
        <StatTile icon={<CustomersIcon />} label="Total Customers" value={data ? String(data.totalCustomers) : "—"} />
        <StatTile
          icon={<AovIcon />}
          label="Avg Order Value"
          value={data ? `Rs. ${data.avgOrderValue.toLocaleString()}` : "—"}
        />
        <StatTile
          icon={<ConversionIcon />}
          label="Conversion Rate"
          value={data ? `${data.conversionRate}%` : "—"}
        />
      </div>

      {/* Revenue trend + real-time sales — flex-col cards with a flex-1 chart area so
          both charts dynamically fill whatever height the row ends up (set by the
          taller sibling), instead of each having its own independent fixed height. */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col rang-card p-5 lg:col-span-2">
          <h2 className="font-semibold">Revenue Trend</h2>
          <p className="text-xs text-ink-soft">Daily revenue, {range.label.toLowerCase()}</p>
          <div className="mt-4 min-h-0 flex-1">{data ? <RevenueTrendChart data={data.revenueTrend} /> : <ChartSkeleton />}</div>
        </div>
        <div className="flex min-w-0 flex-col rang-card p-5">
          <h2 className="font-semibold">{isDaily ? "Sales by Day" : "Real-Time Sales"}</h2>
          <p className="text-xs text-ink-soft">{isDaily ? range.label : "Today, by hour"}</p>
          <div className="mt-4 min-h-0 flex-1">
            {data ? <HourlySalesChart data={data.hourlySales} daily={isDaily} /> : <ChartSkeleton />}
          </div>
        </div>
      </div>

      {/* Traffic sources */}
      <div className="mt-6 rang-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold">Traffic Sources</h2>
            <p className="text-xs text-ink-soft">Unique visitor sessions, {range.label.toLowerCase()}</p>
          </div>
          {data && (
            <div className="flex gap-6 text-right">
              <div>
                <p className="text-lg font-semibold">{data.visitors.totalVisitors.toLocaleString()}</p>
                <p className="text-xs text-ink-soft">Total Visitors</p>
              </div>
              <div>
                <p className="text-lg font-semibold">{data.visitors.visitsPerDay}</p>
                <p className="text-xs text-ink-soft">Visits / Day</p>
              </div>
              <div>
                <p className="text-lg font-semibold">{data.visitors.bounceRate}%</p>
                <p className="text-xs text-ink-soft">Bounce Rate</p>
              </div>
            </div>
          )}
        </div>
        <div className="mt-4">{data ? <TrafficSourcesChart data={data.trafficByChannel} /> : <ChartSkeleton />}</div>
      </div>

      {data && data.statusBreakdown.length > 0 && (
        <div className="mt-6 rang-card p-5">
          <h2 className="mb-3 font-semibold">Orders by Status</h2>
          <div className="flex flex-wrap gap-2">
            {data.statusBreakdown.map((s) => (
              <span
                key={s.status}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${STATUS_STYLES[s.status] ?? "bg-ink/10 text-ink-soft"}`}
              >
                {s.status}: {s.count}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="min-w-0 rang-card p-5">
          <h2 className="mb-3 font-semibold">Recent Orders</h2>
          {!data || data.recentOrders.length === 0 ? (
            <p className="text-sm text-ink-soft">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-ink-soft">
                <tr>
                  <th className="pb-2">Order #</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Total</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((o) => (
                  <tr key={o.id} className="border-t border-ink/10">
                    <td className="py-2">
                      <Link href="/admin/orders" className="text-brand hover:underline">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="py-2">{o.customerName}</td>
                    <td className="py-2">Rs. {o.total}</td>
                    <td className="py-2">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[o.status] ?? ""}`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>

        <div className="min-w-0 rang-card p-5">
          <h2 className="mb-3 font-semibold">Top Selling Products</h2>
          {!data || data.topProducts.length === 0 ? (
            <p className="text-sm text-ink-soft">No sales yet.</p>
          ) : (
            <div className="space-y-3">
              {data.topProducts.map((p, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between text-sm">
                    {p.slug ? (
                      <Link href={`/product/${p.slug}`} target="_blank" className="hover:underline">
                        {p.name}
                      </Link>
                    ) : (
                      <span>{p.name}</span>
                    )}
                    <span className="font-semibold">{p.qtySold}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${Math.max(4, (p.qtySold / maxTopSold) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rang-card p-5">
        <h2 className="mb-3 font-semibold">Low Stock Alerts</h2>
        {data?.lowStock.length === 0 || !data ? (
          <p className="text-sm text-ink-soft">Nothing low on stock right now.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-ink-soft">
              <tr>
                <th className="pb-2">Product</th>
                <th className="pb-2">Size/Color</th>
                <th className="pb-2">Stock Left</th>
              </tr>
            </thead>
            <tbody>
              {data.lowStock.map((item, i) => (
                <tr key={i} className="border-t border-ink/10">
                  <td className="py-2">{item.productName}</td>
                  <td className="py-2">
                    {item.size} / {item.color}
                  </td>
                  <td className="py-2 font-semibold text-orange-600 dark:text-orange-400">{item.stockQty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return <div className="h-full min-h-[220px] w-full animate-pulse rounded bg-ink/10" />;
}
