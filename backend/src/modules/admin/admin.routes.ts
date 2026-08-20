import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { asyncHandler } from "@/utils/asyncHandler";
import { authenticate, requireRole, requirePermission } from "@/middleware/auth";
import { AppError } from "@/utils/AppError";
import { passwordSchema } from "@/modules/auth/auth.routes";
import { PERMISSIONS } from "@/constants/permissions";
import { slugify } from "@/utils/slugify";
import {
  getConversionStats,
  getHourlySales,
  getPeriodTotals,
  getRevenueTrend,
  getTrafficByChannel,
  getVisitorStats,
  previousRange,
  resolveRange,
  spanDays,
} from "./dashboard.service";

const router = Router();

// GET /api/admin/dashboard?from=YYYY-MM-DD&to=YYYY-MM-DD — sales/traffic report for the
// selected range (defaults to the last 30 days when params are absent/invalid), plus
// low-stock alerts and a "Recent Orders" activity feed that intentionally ignores the
// range so it never looks confusingly empty when browsing a past period.
router.get(
  "/dashboard",
  authenticate,
  requireRole(Role.ADMIN, Role.STAFF),
  asyncHandler(async (req, res) => {
    const range = resolveRange(req.query.from as string | undefined, req.query.to as string | undefined);
    const prevRange = previousRange(range);
    const isSingleDay = spanDays(range) <= 1;

    const [
      periodTotals,
      previousPeriodTotals,
      lowStockVariants,
      statusGroups,
      recentOrders,
      topItemGroups,
      totalCustomers,
      revenueTrend,
      visitors,
      trafficByChannel,
      conversionStats,
    ] = await Promise.all([
      getPeriodTotals(range),
      getPeriodTotals(prevRange),
      prisma.productVariant.findMany({
        where: { stockQty: { lte: 5 }, isOutOfStock: false },
        include: { product: true },
        take: 20,
      }),
      prisma.order.groupBy({
        by: ["status"],
        where: { createdAt: { gte: range.from, lt: range.to } },
        _count: { _all: true },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, orderNumber: true, customerName: true, total: true, status: true, createdAt: true },
      }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        where: { order: { createdAt: { gte: range.from, lt: range.to } } },
        _sum: { qty: true },
        orderBy: { _sum: { qty: "desc" } },
        take: 5,
      }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      getRevenueTrend(range),
      getVisitorStats(range),
      getTrafficByChannel(range),
      getConversionStats(range),
    ]);

    // Hourly bucketing only makes sense for a single-day range; otherwise reuse the
    // already-fetched day-bucketed revenueTrend so the chart shows "Sales by Day" instead
    // of an extra query.
    const hourlySales = isSingleDay ? await getHourlySales(range) : revenueTrend;

    // Signed % change vs the immediately preceding period of equal length — null (not 0)
    // when the prior period had nothing, so the UI can say "new" instead of "+infinite%".
    const pctChange = (current: number, prior: number): number | null =>
      prior === 0 ? null : Math.round(((current - prior) / prior) * 1000) / 10;

    const topProductIds = topItemGroups.map((g) => g.productId);
    const topProductRecords = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true, slug: true },
    });
    const topProducts = topItemGroups.map((g) => {
      const product = topProductRecords.find((p) => p.id === g.productId);
      return { name: product?.name ?? "Deleted product", slug: product?.slug ?? null, qtySold: g._sum.qty ?? 0 };
    });

    res.json({
      range: { from: range.from.toISOString().slice(0, 10), to: new Date(range.to.getTime() - 86_400_000).toISOString().slice(0, 10) },
      orderCount: periodTotals.orderCount,
      revenue: periodTotals.revenue,
      orderCountChangePct: pctChange(periodTotals.orderCount, previousPeriodTotals.orderCount),
      revenueChangePct: pctChange(periodTotals.revenue, previousPeriodTotals.revenue),
      totalCustomers,
      lowStock: lowStockVariants.map((v) => ({
        productName: v.product.name,
        size: v.size,
        color: v.color,
        stockQty: v.stockQty,
      })),
      statusBreakdown: statusGroups.map((g) => ({ status: g.status, count: g._count._all })),
      recentOrders,
      topProducts,
      revenueTrend,
      hourlySales,
      hourlySalesGranularity: isSingleDay ? "hour" : "day",
      visitors,
      trafficByChannel,
      ...conversionStats,
    });
  })
);

router.get(
  "/settings",
  authenticate,
  requirePermission("SETTINGS"),
  asyncHandler(async (_req, res) => {
    const settings = await prisma.settings.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" },
    });
    res.json(settings);
  })
);

router.patch(
  "/settings",
  authenticate,
  requirePermission("SETTINGS"),
  asyncHandler(async (req, res) => {
    const {
      logoUrl,
      faviconUrl,
      brandColor,
      accentColor,
      whatsappNumber,
      defaultCourier,
      storeName,
      storeContactEmail,
      storeContactPhone,
      shippingFee,
      codEnabled,
      bankDepositEnabled,
      bankDepositInstructions,
      occasionEyebrow,
      occasionHeading,
      bazaarEyebrow,
      bazaarHeading,
      bazaarLimit,
      collectionsEyebrow,
      collectionsHeading,
      reviewsEyebrow,
      reviewsHeading,
    } = req.body;
    const data = {
      logoUrl,
      faviconUrl,
      brandColor,
      accentColor,
      whatsappNumber,
      defaultCourier,
      storeName,
      storeContactEmail,
      storeContactPhone,
      bankDepositInstructions,
      occasionEyebrow,
      occasionHeading,
      bazaarEyebrow,
      bazaarHeading,
      collectionsEyebrow,
      collectionsHeading,
      reviewsEyebrow,
      reviewsHeading,
      ...(shippingFee !== undefined ? { shippingFee: Number(shippingFee) } : {}),
      ...(codEnabled !== undefined ? { codEnabled: Boolean(codEnabled) } : {}),
      ...(bankDepositEnabled !== undefined ? { bankDepositEnabled: Boolean(bankDepositEnabled) } : {}),
      ...(bazaarLimit !== undefined ? { bazaarLimit: bazaarLimit === null ? null : Number(bazaarLimit) } : {}),
    };
    const settings = await prisma.settings.upsert({
      where: { id: "singleton" },
      update: data,
      create: { id: "singleton", ...data },
    });
    res.json(settings);
  })
);

// GET /api/admin/newsletter — view collected subscriber emails
router.get(
  "/newsletter",
  authenticate,
  requirePermission("NEWSLETTER"),
  asyncHandler(async (_req, res) => {
    const subscribers = await prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" } });
    res.json(subscribers);
  })
);

// DELETE /api/admin/newsletter/:id — remove a subscriber
router.delete(
  "/newsletter/:id",
  authenticate,
  requirePermission("NEWSLETTER"),
  asyncHandler(async (req, res) => {
    await prisma.newsletterSubscriber.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

// GET /api/admin/reviews — moderation view: every review across all products
router.get(
  "/reviews",
  authenticate,
  requirePermission("REVIEWS"),
  asyncHandler(async (_req, res) => {
    const reviews = await prisma.review.findMany({
      include: { user: { select: { name: true, email: true } }, product: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(reviews);
  })
);

const createReviewSchema = z.object({
  productId: z.string().uuid(),
  authorName: z.string().min(2).max(80),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(3).max(1000),
});

// POST /api/admin/reviews — let the store owner seed a review under a display name of
// their choice (e.g. for a new product with no real customer feedback yet). Recorded
// under the creating admin's own userId, but authorName overrides the shown name so it
// doesn't read as "Store Admin" on the storefront. See Review.authorName in schema.prisma.
router.post(
  "/reviews",
  authenticate,
  requirePermission("REVIEWS"),
  asyncHandler(async (req, res) => {
    const input = createReviewSchema.parse(req.body);
    const review = await prisma.review.create({
      data: {
        productId: input.productId,
        userId: req.user!.id,
        authorName: input.authorName,
        rating: input.rating,
        comment: input.comment,
      },
      include: { user: { select: { name: true, email: true } }, product: { select: { name: true, slug: true } } },
    });
    res.status(201).json(review);
  })
);

// PATCH /api/admin/reviews/:id — toggle whether a review is curated onto the homepage
// marquee (see Review.showOnHomepage in schema.prisma for the fallback behavior)
router.patch(
  "/reviews/:id",
  authenticate,
  requirePermission("REVIEWS"),
  asyncHandler(async (req, res) => {
    const { showOnHomepage } = z.object({ showOnHomepage: z.boolean() }).parse(req.body);
    const review = await prisma.review.update({
      where: { id: req.params.id },
      data: { showOnHomepage },
      include: { user: { select: { name: true, email: true } }, product: { select: { name: true, slug: true } } },
    });
    res.json(review);
  })
);

// GET /api/admin/banners — every banner incl. inactive ones, for the management list
// (the public GET /api/banners only returns active: true, used by the homepage itself)
router.get(
  "/banners",
  authenticate,
  requirePermission("BANNERS"),
  asyncHandler(async (_req, res) => {
    const banners = await prisma.banner.findMany({ orderBy: { position: "asc" } });
    res.json(banners);
  })
);

const bannerSchema = z.object({
  eyebrow: z.string().max(60).optional().nullable(),
  heading: z.string().min(2).max(120),
  subtext: z.string().max(200).optional().nullable(),
  ctaLabel: z.string().max(40).optional().nullable(),
  ctaHref: z.string().max(200).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  gradientKey: z.enum(["brand", "emerald", "accent"]).default("brand"),
  position: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

// POST /api/admin/banners — add a new homepage hero slide
router.post(
  "/banners",
  authenticate,
  requirePermission("BANNERS"),
  asyncHandler(async (req, res) => {
    const input = bannerSchema.parse(req.body);
    const banner = await prisma.banner.create({ data: input });
    res.status(201).json(banner);
  })
);

const bannerUpdateSchema = bannerSchema.partial();

// PATCH /api/admin/banners/:id — edit text/image/CTA, reorder (position), or toggle active
router.patch(
  "/banners/:id",
  authenticate,
  requirePermission("BANNERS"),
  asyncHandler(async (req, res) => {
    const input = bannerUpdateSchema.parse(req.body);
    const banner = await prisma.banner.update({ where: { id: req.params.id }, data: input });
    res.json(banner);
  })
);

// DELETE /api/admin/banners/:id
router.delete(
  "/banners/:id",
  authenticate,
  requirePermission("BANNERS"),
  asyncHandler(async (req, res) => {
    await prisma.banner.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

// GET /api/admin/shipping-methods — every method incl. inactive ones, for the management
// list (the public GET /api/shipping-methods only returns active: true, used by checkout)
router.get(
  "/shipping-methods",
  authenticate,
  requirePermission("SHIPPING"),
  asyncHandler(async (_req, res) => {
    const methods = await prisma.shippingMethod.findMany({ orderBy: { position: "asc" } });
    res.json(methods);
  })
);

const shippingMethodSchema = z.object({
  name: z.string().min(2).max(60),
  description: z.string().max(200).optional().nullable(),
  fee: z.number().min(0),
  position: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

// POST /api/admin/shipping-methods
router.post(
  "/shipping-methods",
  authenticate,
  requirePermission("SHIPPING"),
  asyncHandler(async (req, res) => {
    const input = shippingMethodSchema.parse(req.body);
    const method = await prisma.shippingMethod.create({ data: input });
    res.status(201).json(method);
  })
);

const shippingMethodUpdateSchema = shippingMethodSchema.partial();

// PATCH /api/admin/shipping-methods/:id — edit name/description/fee, reorder, toggle active
router.patch(
  "/shipping-methods/:id",
  authenticate,
  requirePermission("SHIPPING"),
  asyncHandler(async (req, res) => {
    const input = shippingMethodUpdateSchema.parse(req.body);
    const method = await prisma.shippingMethod.update({ where: { id: req.params.id }, data: input });
    res.json(method);
  })
);

// DELETE /api/admin/shipping-methods/:id — past orders keep their shippingMethodName
// snapshot even after the method itself is deleted (FK is ON DELETE SET NULL).
router.delete(
  "/shipping-methods/:id",
  authenticate,
  requirePermission("SHIPPING"),
  asyncHandler(async (req, res) => {
    await prisma.shippingMethod.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

// GET /api/admin/collections — every collection incl. inactive, with product counts, for
// the management list (the public GET /api/collections only returns active: true)
router.get(
  "/collections",
  authenticate,
  requirePermission("COLLECTIONS"),
  asyncHandler(async (_req, res) => {
    const collections = await prisma.collection.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { position: "asc" },
    });
    res.json(collections);
  })
);

// GET /api/admin/collections/:id — single collection with its assigned product IDs, for
// the product-picker checklist (unlike the public detail route, this isn't filtered to
// active products/collections — an admin needs to edit a hidden collection too)
router.get(
  "/collections/:id",
  authenticate,
  requirePermission("COLLECTIONS"),
  asyncHandler(async (req, res) => {
    const collection = await prisma.collection.findUnique({
      where: { id: req.params.id },
      include: { products: { select: { id: true } } },
    });
    if (!collection) throw new AppError(404, "Collection not found");
    res.json({ ...collection, productIds: collection.products.map((p) => p.id) });
  })
);

const collectionSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(300).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  position: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

// POST /api/admin/collections
router.post(
  "/collections",
  authenticate,
  requirePermission("COLLECTIONS"),
  asyncHandler(async (req, res) => {
    const input = collectionSchema.parse(req.body);
    const collection = await prisma.collection.create({ data: { ...input, slug: slugify(input.name) } });
    res.status(201).json(collection);
  })
);

const collectionUpdateSchema = collectionSchema.partial();

// PATCH /api/admin/collections/:id — edit name/description/image, reorder, toggle active.
// Renaming re-slugifies (same convention as Products/Categories) — fine since collection
// slugs are only ever linked to from within this same site, never handed out externally.
router.patch(
  "/collections/:id",
  authenticate,
  requirePermission("COLLECTIONS"),
  asyncHandler(async (req, res) => {
    const input = collectionUpdateSchema.parse(req.body);
    const collection = await prisma.collection.update({
      where: { id: req.params.id },
      data: { ...input, ...(input.name ? { slug: slugify(input.name) } : {}) },
    });
    res.json(collection);
  })
);

// DELETE /api/admin/collections/:id
router.delete(
  "/collections/:id",
  authenticate,
  requirePermission("COLLECTIONS"),
  asyncHandler(async (req, res) => {
    await prisma.collection.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

const collectionProductsSchema = z.object({ productIds: z.array(z.string().uuid()) });

// PUT /api/admin/collections/:id/products — replaces the collection's whole product list
// with the given set (simplest possible UX: a checklist that submits its full selection,
// same "replace the whole thing" convention as PATCH /admin/settings elsewhere in this file)
router.put(
  "/collections/:id/products",
  authenticate,
  requirePermission("COLLECTIONS"),
  asyncHandler(async (req, res) => {
    const { productIds } = collectionProductsSchema.parse(req.body);
    const collection = await prisma.collection.update({
      where: { id: req.params.id },
      data: { products: { set: productIds.map((id) => ({ id })) } },
      include: { products: { select: { id: true, name: true } } },
    });
    res.json(collection);
  })
);

const userSummary = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  permissions: true,
  createdAt: true,
} as const;

// GET /api/admin/staff — everyone with back-office access can see the team list
router.get(
  "/staff",
  authenticate,
  requireRole(Role.ADMIN, Role.STAFF),
  asyncHandler(async (_req, res) => {
    const staff = await prisma.user.findMany({
      where: { role: { in: [Role.ADMIN, Role.STAFF] } },
      select: userSummary,
      orderBy: { createdAt: "asc" },
    });
    res.json(staff);
  })
);

const createStaffSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: passwordSchema,
  role: z.enum([Role.ADMIN, Role.STAFF]),
});

// POST /api/admin/staff — ADMIN-only: the only way a STAFF/ADMIN account is ever created.
// Public registration (/api/auth/register) always creates a plain CUSTOMER — this keeps
// back-office access strictly invite-only by an existing admin.
router.post(
  "/staff",
  authenticate,
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    const input = createStaffSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new AppError(409, "An account with this email already exists");

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await prisma.user.create({
      data: { name: input.name, email: input.email, passwordHash, role: input.role },
      select: userSummary,
    });
    res.status(201).json(user);
  })
);

const updateStaffSchema = z.object({
  active: z.boolean().optional(),
  role: z.enum([Role.ADMIN, Role.STAFF]).optional(),
  permissions: z.array(z.enum(PERMISSIONS)).optional(),
});

// PATCH /api/admin/staff/:id — ADMIN-only: deactivate/reactivate or change a team member's role
router.patch(
  "/staff/:id",
  authenticate,
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user!.id) {
      throw new AppError(400, "You can't change your own access from here");
    }
    const input = updateStaffSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: input,
      select: userSummary,
    });
    res.json(user);
  })
);

// DELETE /api/admin/staff/:id — ADMIN-only: permanently remove a team member's access
router.delete(
  "/staff/:id",
  authenticate,
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user!.id) {
      throw new AppError(400, "You can't remove your own account");
    }
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

export default router;
