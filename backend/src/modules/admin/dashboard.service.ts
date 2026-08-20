import { prisma } from "@/config/prisma";

export interface DateRange {
  from: Date;
  /** Exclusive upper bound (start of the day after the selected end date). */
  to: Date;
}

const DEFAULT_RANGE_DAYS = 30;

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

// Parses `?from=YYYY-MM-DD&to=YYYY-MM-DD` into a validated range, falling back to the
// last 30 days (the app's original fixed behavior) when params are missing or invalid —
// so existing bookmarks/links to the dashboard keep working unchanged.
export function resolveRange(fromQ?: string, toQ?: string): DateRange {
  const parsedFrom = fromQ ? new Date(fromQ) : null;
  const parsedTo = toQ ? new Date(toQ) : null;
  const valid =
    parsedFrom && parsedTo && !isNaN(parsedFrom.getTime()) && !isNaN(parsedTo.getTime()) && parsedFrom <= parsedTo;

  if (!valid) {
    const to = startOfDay(new Date());
    to.setDate(to.getDate() + 1);
    const from = new Date(to);
    from.setDate(from.getDate() - DEFAULT_RANGE_DAYS);
    return { from, to };
  }

  const from = startOfDay(parsedFrom!);
  const to = startOfDay(parsedTo!);
  to.setDate(to.getDate() + 1); // make inclusive of the whole "to" day
  return { from, to };
}

export function spanDays(range: DateRange): number {
  return Math.max(1, Math.round((range.to.getTime() - range.from.getTime()) / 86_400_000));
}

// The period immediately preceding `range`, of equal length — generalizes "today vs
// yesterday" to "selected N days vs preceding N days" for any preset or custom range.
export function previousRange(range: DateRange): DateRange {
  const spanMs = range.to.getTime() - range.from.getTime();
  return { from: new Date(range.from.getTime() - spanMs), to: new Date(range.from) };
}

// Order count + revenue total for a given range — used for both the selected period and
// the preceding period it's compared against.
export async function getPeriodTotals(range: DateRange) {
  const orders = await prisma.order.findMany({ where: { createdAt: { gte: range.from, lt: range.to } } });
  return {
    orderCount: orders.length,
    revenue: orders.reduce((sum, o) => sum + Number(o.total), 0),
  };
}

// Daily revenue across the selected range — real order data, zero-filled for days with
// no orders so the chart doesn't silently skip gaps.
export async function getRevenueTrend(range: DateRange) {
  const rows = await prisma.$queryRaw<{ day: Date; revenue: number; orders: number }[]>`
    SELECT DATE(\`createdAt\`) AS day, CAST(SUM(\`total\`) AS DOUBLE) AS revenue, CAST(COUNT(*) AS SIGNED) AS orders
    FROM \`Order\`
    WHERE \`createdAt\` >= ${range.from} AND \`createdAt\` < ${range.to}
    GROUP BY day
    ORDER BY day ASC
  `;
  const byDay = new Map(rows.map((r) => [r.day.toISOString().slice(0, 10), r]));

  const result: { date: string; revenue: number; orders: number }[] = [];
  for (let d = new Date(range.from); d < range.to; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    const row = byDay.get(key);
    result.push({ date: key, revenue: Number(row?.revenue ?? 0), orders: Number(row?.orders ?? 0) });
  }
  return result;
}

// Orders within the range bucketed by hour — zero-filled 0-23 so the chart has a stable
// x-axis. Only meaningful when the range spans a single day (caller decides that).
export async function getHourlySales(range: DateRange) {
  const rows = await prisma.$queryRaw<{ hour: Date; revenue: number; orders: number }[]>`
    SELECT CAST(DATE_FORMAT(\`createdAt\`, '%Y-%m-%d %H:00:00') AS DATETIME) AS hour,
      CAST(SUM(\`total\`) AS DOUBLE) AS revenue, CAST(COUNT(*) AS SIGNED) AS orders
    FROM \`Order\`
    WHERE \`createdAt\` >= ${range.from} AND \`createdAt\` < ${range.to}
    GROUP BY hour
    ORDER BY hour ASC
  `;
  const byHour = new Map(rows.map((r) => [r.hour.getHours(), r]));

  const result: { hour: number; revenue: number; orders: number }[] = [];
  for (let h = 0; h < 24; h++) {
    const row = byHour.get(h);
    result.push({ hour: h, revenue: Number(row?.revenue ?? 0), orders: Number(row?.orders ?? 0) });
  }
  return result;
}

// Real visitor stats from PageView tracking (no fabricated numbers) — total unique
// sessions, average sessions/day, and bounce rate (share of sessions with exactly one
// pageview) over the selected range.
export async function getVisitorStats(range: DateRange) {
  const [totalVisitorsResult, bounceResult] = await Promise.all([
    prisma.$queryRaw<{ count: number }[]>`
      SELECT CAST(COUNT(DISTINCT \`sessionId\`) AS SIGNED) AS count FROM \`PageView\` WHERE \`createdAt\` >= ${range.from} AND \`createdAt\` < ${range.to}
    `,
    prisma.$queryRaw<{ bounce_rate: number | null }[]>`
      SELECT
        CAST(SUM(CASE WHEN cnt = 1 THEN 1 ELSE 0 END) AS DOUBLE) / NULLIF(COUNT(*), 0) AS bounce_rate
      FROM (
        SELECT \`sessionId\`, COUNT(*) AS cnt FROM \`PageView\` WHERE \`createdAt\` >= ${range.from} AND \`createdAt\` < ${range.to} GROUP BY \`sessionId\`
      ) sessions
    `,
  ]);

  const totalVisitors = Number(totalVisitorsResult[0]?.count ?? 0);
  const bounceRate = Number(bounceResult[0]?.bounce_rate ?? 0);

  return {
    totalVisitors,
    visitsPerDay: Math.round((totalVisitors / spanDays(range)) * 10) / 10,
    bounceRate: Math.round(bounceRate * 1000) / 10, // percentage, 1 decimal
  };
}

const ALL_CHANNELS = ["DIRECT", "ORGANIC", "SOCIAL", "REFERRAL", "EMAIL"] as const;

// Unique sessions per traffic channel over the selected range, zero-filled so every
// channel appears even with no traffic yet.
export async function getTrafficByChannel(range: DateRange) {
  const rows = await prisma.$queryRaw<{ channel: string; sessions: number }[]>`
    SELECT channel, CAST(COUNT(DISTINCT \`sessionId\`) AS SIGNED) AS sessions
    FROM \`PageView\`
    WHERE \`createdAt\` >= ${range.from} AND \`createdAt\` < ${range.to}
    GROUP BY channel
  `;
  const byChannel = new Map(rows.map((r) => [r.channel, Number(r.sessions)]));
  return ALL_CHANNELS.map((channel) => ({ channel, sessions: byChannel.get(channel) ?? 0 }));
}

// Average order value and conversion rate (orders / unique visitor sessions), over the
// selected range.
export async function getConversionStats(range: DateRange) {
  const [orders, visitors] = await Promise.all([
    prisma.order.aggregate({
      where: { createdAt: { gte: range.from, lt: range.to } },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.$queryRaw<{ count: number }[]>`
      SELECT CAST(COUNT(DISTINCT \`sessionId\`) AS SIGNED) AS count FROM \`PageView\` WHERE \`createdAt\` >= ${range.from} AND \`createdAt\` < ${range.to}
    `,
  ]);

  const orderCount = orders._count._all;
  const totalRevenue = Number(orders._sum.total ?? 0);
  const visitorCount = Number(visitors[0]?.count ?? 0);

  return {
    avgOrderValue: orderCount > 0 ? Math.round((totalRevenue / orderCount) * 100) / 100 : 0,
    conversionRate: visitorCount > 0 ? Math.round((orderCount / visitorCount) * 1000) / 10 : 0,
  };
}
