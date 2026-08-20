import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { asyncHandler } from "@/utils/asyncHandler";
import { authenticate, requirePermission } from "@/middleware/auth";
import { AppError } from "@/utils/AppError";
import { slugify } from "@/utils/slugify";

const router = Router();

function withRatingSummary<T extends { reviews: { rating: number }[] }>(product: T) {
  const { reviews, ...rest } = product;
  const reviewCount = reviews.length;
  const avgRating = reviewCount === 0 ? null : reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount;
  return { ...rest, avgRating, reviewCount };
}

const listQuerySchema = z.object({
  category: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  q: z.string().optional(),
  featured: z.coerce.boolean().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc"]).default("newest"),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(24),
});

const SORT_ORDER_BY: Record<string, Prisma.ProductOrderByWithRelationInput> = {
  newest: { createdAt: "desc" },
  price_asc: { basePrice: "asc" },
  price_desc: { basePrice: "desc" },
};

// GET /api/products — public storefront listing with filters + pagination
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = listQuerySchema.parse(req.query);

    const where: Prisma.ProductWhereInput = {
      status: "ACTIVE",
      ...(query.category
        ? { category: { OR: [{ slug: query.category }, { parent: { slug: query.category } }] } }
        : {}),
      ...(query.q ? { name: { contains: query.q } } : {}),
      ...(query.featured !== undefined ? { featured: query.featured } : {}),
      ...(query.minPrice || query.maxPrice
        ? {
            basePrice: {
              ...(query.minPrice ? { gte: query.minPrice } : {}),
              ...(query.maxPrice ? { lte: query.maxPrice } : {}),
            },
          }
        : {}),
      ...(query.size || query.color
        ? {
            variants: {
              some: {
                ...(query.size ? { size: query.size } : {}),
                ...(query.color ? { color: query.color } : {}),
              },
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { images: true, variants: true, category: true, reviews: { select: { rating: true } } },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: SORT_ORDER_BY[query.sort],
      }),
      prisma.product.count({ where }),
    ]);

    res.json({ items: items.map(withRatingSummary), total, page: query.page, pageSize: query.pageSize });
  })
);

// GET /api/products/:slug — public product detail
router.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: {
        images: true,
        variants: { include: { images: true } },
        category: true,
        reviews: { select: { rating: true } },
      },
    });
    if (!product || product.status !== "ACTIVE") {
      throw new AppError(404, "Product not found");
    }
    res.json(withRatingSummary(product));
  })
);

const variantInputSchema = z.object({
  size: z.string().min(1),
  color: z.string().min(1),
  sku: z.string().min(1),
  priceOverride: z.number().optional(),
  stockQty: z.number().int().min(0).default(0),
});

const createProductSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(1),
  basePrice: z.number().positive(),
  categoryId: z.string().uuid(),
  status: z.enum(["ACTIVE", "DRAFT"]).default("DRAFT"),
  featured: z.boolean().default(false),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  variants: z.array(variantInputSchema).min(1),
  images: z.array(z.object({ url: z.string().url(), altText: z.string().optional() })).default([]),
});

// POST /api/products — admin: create product with size/color variants
router.post(
  "/",
  authenticate,
  requirePermission("PRODUCTS"),
  asyncHandler(async (req, res) => {
    const input = createProductSchema.parse(req.body);
    const slug = slugify(input.name);

    const product = await prisma.product.create({
      data: {
        name: input.name,
        slug,
        description: input.description,
        basePrice: input.basePrice,
        categoryId: input.categoryId,
        status: input.status,
        featured: input.featured,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        variants: {
          create: input.variants.map((v) => ({
            size: v.size,
            color: v.color,
            sku: v.sku,
            priceOverride: v.priceOverride,
            stockQty: v.stockQty,
            isOutOfStock: v.stockQty <= 0,
          })),
        },
        images: {
          create: input.images.map((img, position) => ({ url: img.url, altText: img.altText, position })),
        },
      },
      include: { variants: true, images: true },
    });

    res.status(201).json(product);
  })
);

// GET /api/products/id/:id — admin: fetch by id regardless of status (DRAFT included), for the edit page
router.get(
  "/id/:id",
  authenticate,
  requirePermission("PRODUCTS"),
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { images: true, variants: { include: { images: true } }, category: true },
    });
    if (!product) throw new AppError(404, "Product not found");
    res.json(product);
  })
);

const updateProductSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  basePrice: z.number().positive().optional(),
  categoryId: z.string().uuid().optional(),
  status: z.enum(["ACTIVE", "DRAFT"]).optional(),
  featured: z.boolean().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

// PATCH /api/products/:id — admin: edit price/status/details
router.patch(
  "/:id",
  authenticate,
  requirePermission("PRODUCTS"),
  asyncHandler(async (req, res) => {
    const input = updateProductSchema.parse(req.body);
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...input,
        ...(input.name ? { slug: slugify(input.name) } : {}),
      },
    });
    res.json(product);
  })
);

// DELETE /api/products/:id — admin
router.delete(
  "/:id",
  authenticate,
  requirePermission("PRODUCTS"),
  asyncHandler(async (req, res) => {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

const updateVariantSchema = z.object({
  size: z.string().min(1).optional(),
  color: z.string().min(1).optional(),
  sku: z.string().min(1).optional(),
  stockQty: z.number().int().min(0).optional(),
  isOutOfStock: z.boolean().optional(),
  priceOverride: z.number().nullable().optional(),
});

// PATCH /api/products/:id/variants/:variantId — admin: covers both the inline
// stock/out-of-stock quick actions and full edits (size/color/sku) from the edit page.
router.patch(
  "/:id/variants/:variantId",
  authenticate,
  requirePermission("PRODUCTS"),
  asyncHandler(async (req, res) => {
    const input = updateVariantSchema.parse(req.body);
    const variant = await prisma.productVariant.update({
      where: { id: req.params.variantId },
      data: input,
    });
    res.json(variant);
  })
);

// POST /api/products/:id/variants — admin: add a new size/color to an existing product
router.post(
  "/:id/variants",
  authenticate,
  requirePermission("PRODUCTS"),
  asyncHandler(async (req, res) => {
    const input = variantInputSchema.parse(req.body);
    const variant = await prisma.productVariant.create({
      data: {
        productId: req.params.id,
        size: input.size,
        color: input.color,
        sku: input.sku,
        priceOverride: input.priceOverride,
        stockQty: input.stockQty,
        isOutOfStock: input.stockQty <= 0,
      },
    });
    res.status(201).json(variant);
  })
);

// DELETE /api/products/:id/variants/:variantId — admin: remove a size/color, but never
// the last one (a product needs at least one purchasable variant)
router.delete(
  "/:id/variants/:variantId",
  authenticate,
  requirePermission("PRODUCTS"),
  asyncHandler(async (req, res) => {
    const variantCount = await prisma.productVariant.count({ where: { productId: req.params.id } });
    if (variantCount <= 1) {
      throw new AppError(400, "A product must have at least one size/color variant");
    }
    await prisma.productVariant.delete({ where: { id: req.params.variantId } });
    res.status(204).send();
  })
);

const addImageSchema = z.object({
  url: z.string().url(),
  altText: z.string().optional(),
  variantId: z.string().uuid().optional(),
});

// POST /api/products/:id/images — admin: add a photo to an existing product
router.post(
  "/:id/images",
  authenticate,
  requirePermission("PRODUCTS"),
  asyncHandler(async (req, res) => {
    const input = addImageSchema.parse(req.body);
    const position = await prisma.productImage.count({ where: { productId: req.params.id } });
    const image = await prisma.productImage.create({
      data: { productId: req.params.id, url: input.url, altText: input.altText, variantId: input.variantId, position },
    });
    res.status(201).json(image);
  })
);

// DELETE /api/products/:id/images/:imageId — admin: remove a photo
router.delete(
  "/:id/images/:imageId",
  authenticate,
  requirePermission("PRODUCTS"),
  asyncHandler(async (req, res) => {
    await prisma.productImage.delete({ where: { id: req.params.imageId } });
    res.status(204).send();
  })
);

export default router;
