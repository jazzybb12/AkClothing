import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { asyncHandler } from "@/utils/asyncHandler";
import { authenticate, requirePermission } from "@/middleware/auth";
import { AppError } from "@/utils/AppError";
import { applyCoupon, findBestAutoApplyCoupon } from "./coupons.service";

const router = Router();

router.get(
  "/",
  authenticate,
  requirePermission("COUPONS"),
  asyncHandler(async (_req, res) => {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    res.json(coupons);
  })
);

const createSchema = z.object({
  code: z.string().min(3),
  type: z.enum(["PERCENTAGE", "FIXED", "FREE_SHIPPING"]),
  value: z.number().min(0),
  minOrderAmount: z.number().min(0).default(0),
  usageLimit: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().optional(),
  autoApply: z.boolean().default(false),
});

router.post(
  "/",
  authenticate,
  requirePermission("COUPONS"),
  asyncHandler(async (req, res) => {
    const input = createSchema.parse(req.body);
    const coupon = await prisma.coupon.create({
      data: {
        code: input.code.toUpperCase(),
        type: input.type,
        value: input.value,
        minOrderAmount: input.minOrderAmount,
        usageLimit: input.usageLimit,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        autoApply: input.autoApply,
      },
    });
    res.status(201).json(coupon);
  })
);

const updateSchema = z.object({
  active: z.boolean().optional(),
  value: z.number().min(0).optional(),
  minOrderAmount: z.number().min(0).optional(),
  usageLimit: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  autoApply: z.boolean().optional(),
});

router.patch(
  "/:id",
  authenticate,
  requirePermission("COUPONS"),
  asyncHandler(async (req, res) => {
    const input = updateSchema.parse(req.body);
    const coupon = await prisma.coupon.update({
      where: { id: req.params.id },
      data: {
        ...input,
        expiresAt: input.expiresAt === undefined ? undefined : input.expiresAt ? new Date(input.expiresAt) : null,
      },
    });
    res.json(coupon);
  })
);

// DELETE /api/coupons/:id — admin
router.delete(
  "/:id",
  authenticate,
  requirePermission("COUPONS"),
  asyncHandler(async (req, res) => {
    await prisma.coupon.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

const validateSchema = z.object({
  code: z.string().min(1),
  subtotal: z.number().positive(),
});

// POST /api/coupons/validate — used by the cart/checkout page before placing an order
router.post(
  "/validate",
  asyncHandler(async (req, res) => {
    const { code, subtotal } = validateSchema.parse(req.body);
    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon) throw new AppError(404, "Coupon not found");

    const { discountAmount, freeShipping } = applyCoupon(coupon, subtotal);
    res.json({ code: coupon.code, discountAmount, freeShipping });
  })
);

const autoApplyQuerySchema = z.object({
  subtotal: z.coerce.number().positive(),
});

// GET /api/coupons/auto-apply?subtotal= — lets checkout preview a no-code discount
// before the order is actually placed, instead of it only appearing afterward.
router.get(
  "/auto-apply",
  asyncHandler(async (req, res) => {
    const { subtotal } = autoApplyQuerySchema.parse(req.query);
    const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
    const shippingFee = Number(settings?.shippingFee ?? 0);

    const coupon = await findBestAutoApplyCoupon(prisma, subtotal, shippingFee);
    if (!coupon) return res.json({ applied: false });

    const { discountAmount, freeShipping } = applyCoupon(coupon, subtotal);
    res.json({ applied: true, code: coupon.code, discountAmount, freeShipping });
  })
);

export default router;
