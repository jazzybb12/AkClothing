import { Router } from "express";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { asyncHandler } from "@/utils/asyncHandler";
import { authenticate, requirePermission } from "@/middleware/auth";
import { AppError } from "@/utils/AppError";

const router = Router();

const listQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

// GET /api/admin/customers — paginated registered-customer list with lifetime order
// stats. Guest orders (Order.userId null) aren't attributable to any customer here.
router.get(
  "/",
  authenticate,
  requirePermission("CUSTOMERS"),
  asyncHandler(async (req, res) => {
    const query = listQuerySchema.parse(req.query);
    const where = {
      role: Role.CUSTOMER,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search } },
              { email: { contains: query.search } },
              { phone: { contains: query.search } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, phone: true, createdAt: true },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    // Aggregate order stats only for the userIds on this page — cheaper and correct
    // regardless of search/pagination, unlike a single unscoped groupBy over all orders.
    const userIds = items.map((u) => u.id);
    const orderStats = await prisma.order.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds } },
      _count: { _all: true },
      _sum: { total: true },
    });
    const statsByUserId = new Map(orderStats.map((s) => [s.userId, s]));

    const customers = items.map((u) => ({
      ...u,
      orderCount: statsByUserId.get(u.id)?._count._all ?? 0,
      totalSpent: Number(statsByUserId.get(u.id)?._sum.total ?? 0),
    }));

    res.json({ items: customers, total, page: query.page, pageSize: query.pageSize });
  })
);

// GET /api/admin/customers/:id — profile + full order history
router.get(
  "/:id",
  authenticate,
  requirePermission("CUSTOMERS"),
  asyncHandler(async (req, res) => {
    const customer = await prisma.user.findFirst({
      where: { id: req.params.id, role: Role.CUSTOMER },
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
    });
    if (!customer) throw new AppError(404, "Customer not found");

    const orders = await prisma.order.findMany({
      where: { userId: customer.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    res.json({ customer, orders });
  })
);

export default router;
