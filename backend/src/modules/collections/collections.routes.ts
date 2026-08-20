import { Router } from "express";
import { prisma } from "@/config/prisma";
import { asyncHandler } from "@/utils/asyncHandler";
import { AppError } from "@/utils/AppError";

const router = Router();

// GET /api/collections — public: active collections only, for the homepage tile grid
// (the admin management list under /api/admin/collections returns every collection,
// including inactive ones — same split as /api/banners vs /api/admin/banners).
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const collections = await prisma.collection.findMany({
      where: { active: true },
      select: { id: true, name: true, slug: true, description: true, imageUrl: true, position: true },
      orderBy: { position: "asc" },
    });
    res.json(collections);
  })
);

// GET /api/collections/:slug — public: collection detail + its active products, for the
// /collections/[slug] browse page
router.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    const collection = await prisma.collection.findUnique({
      where: { slug: req.params.slug },
      include: {
        products: {
          where: { status: "ACTIVE" },
          include: { images: true, variants: true, category: true, reviews: { select: { rating: true } } },
        },
      },
    });
    if (!collection || !collection.active) throw new AppError(404, "Collection not found");

    const products = collection.products.map((p) => {
      const { reviews, ...rest } = p;
      const reviewCount = reviews.length;
      const avgRating = reviewCount === 0 ? null : reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount;
      return { ...rest, avgRating, reviewCount };
    });

    res.json({ id: collection.id, name: collection.name, slug: collection.slug, description: collection.description, imageUrl: collection.imageUrl, products });
  })
);

export default router;
