import { Router } from "express";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { asyncHandler } from "@/utils/asyncHandler";
import { authenticate } from "@/middleware/auth";
import { AppError } from "@/utils/AppError";

const router = Router();

const listQuerySchema = z.object({ productId: z.string().uuid() });

// GET /api/reviews?productId=... — public: all reviews for a product
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { productId } = listQuerySchema.parse(req.query);
    const reviews = await prisma.review.findMany({
      where: { productId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(reviews);
  })
);

// GET /api/reviews/homepage — public: reviews for the homepage marquee. Curated
// (showOnHomepage) reviews take priority; if none are curated, falls back to the
// highest-rated reviews site-wide (same fallback pattern as Product.featured).
router.get(
  "/homepage",
  asyncHandler(async (_req, res) => {
    const curated = await prisma.review.findMany({
      where: { showOnHomepage: true },
      include: { user: { select: { name: true } }, product: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    if (curated.length > 0) return res.json(curated);

    const fallback = await prisma.review.findMany({
      where: { rating: { gte: 4 } },
      include: { user: { select: { name: true } }, product: { select: { name: true, slug: true } } },
      orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
      take: 20,
    });
    res.json(fallback);
  })
);

const upsertSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(3).max(1000),
});

// POST /api/reviews — logged-in user: create or update their own review for a product.
// Scoped to authorName: null so this never touches an admin-seeded review that happens
// to share the same userId (see Review.authorName in schema.prisma for why there's no
// DB-level unique constraint doing this instead).
router.post(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const input = upsertSchema.parse(req.body);
    const existing = await prisma.review.findFirst({
      where: { productId: input.productId, userId: req.user!.id, authorName: null },
    });
    const review = existing
      ? await prisma.review.update({
          where: { id: existing.id },
          data: { rating: input.rating, comment: input.comment },
          include: { user: { select: { name: true } } },
        })
      : await prisma.review.create({
          data: { productId: input.productId, userId: req.user!.id, rating: input.rating, comment: input.comment },
          include: { user: { select: { name: true } } },
        });
    res.status(201).json(review);
  })
);

// DELETE /api/reviews/:id — the review's author, or an admin/staff, can remove it
router.delete(
  "/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const review = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!review) throw new AppError(404, "Review not found");

    const isOwner = review.userId === req.user!.id;
    const isModerator = req.user!.role === Role.ADMIN || req.user!.role === Role.STAFF;
    if (!isOwner && !isModerator) throw new AppError(403, "You can only delete your own review");

    await prisma.review.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

export default router;
