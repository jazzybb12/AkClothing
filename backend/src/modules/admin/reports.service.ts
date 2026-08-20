import { prisma } from "@/config/prisma";
import { DateRange } from "./dashboard.service";

export interface ProductPerformanceRow {
  productId: string;
  name: string;
  slug: string | null;
  qtySold: number;
  revenue: number;
}

export async function getProductPerformance(
  range: DateRange,
  page: number,
  pageSize: number
): Promise<{ items: ProductPerformanceRow[]; total: number }> {
  const where = { order: { createdAt: { gte: range.from, lt: range.to } } };

  const [groups, distinctProducts] = await Promise.all([
    prisma.orderItem.groupBy({
      by: ["productId"],
      where,
      _sum: { qty: true, lineTotal: true },
      orderBy: { _sum: { lineTotal: "desc" } },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.orderItem.groupBy({ by: ["productId"], where }),
  ]);

  const productIds = groups.map((g) => g.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, slug: true },
  });
  const productById = new Map(products.map((p) => [p.id, p]));

  const items = groups.map((g) => {
    const product = productById.get(g.productId);
    return {
      productId: g.productId,
      name: product?.name ?? "Deleted product",
      slug: product?.slug ?? null,
      qtySold: g._sum.qty ?? 0,
      revenue: Number(g._sum.lineTotal ?? 0),
    };
  });

  return { items, total: distinctProducts.length };
}

// Unpaginated version for CSV export — the full range, not just the current page.
export async function getAllProductPerformance(range: DateRange): Promise<ProductPerformanceRow[]> {
  const groups = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: { order: { createdAt: { gte: range.from, lt: range.to } } },
    _sum: { qty: true, lineTotal: true },
    orderBy: { _sum: { lineTotal: "desc" } },
  });
  const productIds = groups.map((g) => g.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, slug: true },
  });
  const productById = new Map(products.map((p) => [p.id, p]));

  return groups.map((g) => {
    const product = productById.get(g.productId);
    return {
      productId: g.productId,
      name: product?.name ?? "Deleted product",
      slug: product?.slug ?? null,
      qtySold: g._sum.qty ?? 0,
      revenue: Number(g._sum.lineTotal ?? 0),
    };
  });
}

export interface CustomerReportRow {
  userId: string;
  name: string;
  email: string;
  orderCount: number;
  totalSpent: number;
}

async function buildCustomerRows(range: DateRange, skip?: number, take?: number) {
  const where = { createdAt: { gte: range.from, lt: range.to }, userId: { not: null } };

  const groups = await prisma.order.groupBy({
    by: ["userId"],
    where,
    _count: { _all: true },
    _sum: { total: true },
    orderBy: { _sum: { total: "desc" } },
    ...(skip !== undefined ? { skip, take } : {}),
  });

  const userIds = groups.map((g) => g.userId).filter((id): id is string => id !== null);
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } });
  const userById = new Map(users.map((u) => [u.id, u]));

  return groups.map((g) => {
    const user = g.userId ? userById.get(g.userId) : undefined;
    return {
      userId: g.userId ?? "",
      name: user?.name ?? "Deleted customer",
      email: user?.email ?? "",
      orderCount: g._count._all,
      totalSpent: Number(g._sum.total ?? 0),
    };
  });
}

export async function getCustomerReport(
  range: DateRange,
  page: number,
  pageSize: number
): Promise<{ items: CustomerReportRow[]; total: number; repeatPurchaseRate: number }> {
  const [items, allGroups] = await Promise.all([
    buildCustomerRows(range, (page - 1) * pageSize, pageSize),
    buildCustomerRows(range),
  ]);

  const customersWithOrders = allGroups.length;
  const repeatCustomers = allGroups.filter((g) => g.orderCount > 1).length;
  const repeatPurchaseRate = customersWithOrders > 0 ? Math.round((repeatCustomers / customersWithOrders) * 1000) / 10 : 0;

  return { items, total: customersWithOrders, repeatPurchaseRate };
}

export async function getAllCustomerReport(range: DateRange): Promise<CustomerReportRow[]> {
  return buildCustomerRows(range);
}
