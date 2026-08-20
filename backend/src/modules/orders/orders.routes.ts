import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { asyncHandler } from "@/utils/asyncHandler";
import { authenticate, optionalAuthenticate, requirePermission } from "@/middleware/auth";
import { AppError } from "@/utils/AppError";
import { cancelOrder, createOrder, trackOrder, updateOrderStatus } from "./orders.service";
import { getCourierAdapter } from "@/modules/courier/courier.service";

const router = Router();

const checkoutSchema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().min(7),
  customerEmail: z.string().email().optional().or(z.literal("")),
  shippingAddress: z.object({ address: z.string().min(3), city: z.string().min(2) }),
  items: z.array(z.object({ variantId: z.string().uuid(), qty: z.number().int().positive() })).min(1),
  couponCode: z.string().optional(),
  shippingMethodId: z.string().uuid().optional(),
  paymentMethod: z.enum(["COD", "BANK_DEPOSIT"]).default("COD"),
});

// POST /api/orders — guest or authenticated COD checkout. Email is optional for guests
// (used only for the confirmation email); logged-in customers fall back to their account
// email when they don't type a different one.
router.post(
  "/",
  optionalAuthenticate,
  asyncHandler(async (req, res) => {
    const input = checkoutSchema.parse(req.body);
    let customerEmail = input.customerEmail || undefined;
    if (!customerEmail && req.user?.id) {
      const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { email: true } });
      customerEmail = user?.email;
    }
    const order = await createOrder({ ...input, customerEmail, userId: req.user?.id });
    res.status(201).json(order);
  })
);

const trackQuerySchema = z.object({
  orderNumber: z.string().min(1),
  phone: z.string().min(7),
});

// GET /api/orders/track — public order tracking by order number + phone
router.get(
  "/track",
  asyncHandler(async (req, res) => {
    const { orderNumber, phone } = trackQuerySchema.parse(req.query);
    const order = await trackOrder(orderNumber, phone);
    res.json(order);
  })
);

const cancelSchema = z.object({ phone: z.string().optional() });

// POST /api/orders/:id/cancel — the order's owner (or, for guest orders, whoever knows
// the checkout phone number) can cancel it while it's still PENDING.
router.post(
  "/:id/cancel",
  optionalAuthenticate,
  asyncHandler(async (req, res) => {
    const { phone } = cancelSchema.parse(req.body);
    const order = await cancelOrder(req.params.id, { userId: req.user?.id, phone });
    res.json(order);
  })
);

// GET /api/orders/mine — logged-in customer's own order history
router.get(
  "/mine",
  authenticate,
  asyncHandler(async (req, res) => {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(orders);
  })
);

const listQuerySchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"]).optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(25),
});

// GET /api/orders — admin order list
router.get(
  "/",
  authenticate,
  requirePermission("ORDERS"),
  asyncHandler(async (req, res) => {
    const query = listQuerySchema.parse(req.query);
    const where = query.status ? { status: query.status } : {};
    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: true },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.count({ where }),
    ]);
    res.json({ items, total, page: query.page, pageSize: query.pageSize });
  })
);

// GET /api/orders/:id — admin order detail
router.get(
  "/:id",
  authenticate,
  requirePermission("ORDERS"),
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { items: true } });
    if (!order) throw new AppError(404, "Order not found");
    res.json(order);
  })
);

const updateStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"]),
  courierProvider: z.enum(["LEOPARDS", "POSTEX"]).optional(),
});

// PATCH /api/orders/:id/status — admin: change status (auto-books courier on CONFIRMED)
router.patch(
  "/:id/status",
  authenticate,
  requirePermission("ORDERS"),
  asyncHandler(async (req, res) => {
    const input = updateStatusSchema.parse(req.body);
    const order = await updateOrderStatus(req.params.id, input.status, input.courierProvider);
    res.json(order);
  })
);

// POST /api/orders/:id/refresh-tracking — admin: pull the live status from the courier's
// API. `trackShipment` was already implemented per-adapter but never called anywhere.
router.post(
  "/:id/refresh-tracking",
  authenticate,
  requirePermission("ORDERS"),
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) throw new AppError(404, "Order not found");
    if (!order.courierProvider || !order.courierTrackingNumber) {
      throw new AppError(400, "This order has no courier shipment booked yet");
    }

    const adapter = getCourierAdapter(order.courierProvider);
    const result = await adapter.trackShipment(order.courierTrackingNumber);

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { courierStatus: result.status },
    });
    res.json(updated);
  })
);

export default router;
