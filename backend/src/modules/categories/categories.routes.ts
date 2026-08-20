import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { asyncHandler } from "@/utils/asyncHandler";
import { authenticate, requirePermission } from "@/middleware/auth";
import { slugify } from "@/utils/slugify";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    res.json(categories);
  })
);

const createSchema = z.object({
  name: z.string().min(2),
  parentId: z.string().uuid().optional(),
});

router.post(
  "/",
  authenticate,
  requirePermission("CATEGORIES"),
  asyncHandler(async (req, res) => {
    const input = createSchema.parse(req.body);
    const category = await prisma.category.create({
      data: { name: input.name, slug: slugify(input.name), parentId: input.parentId },
    });
    res.status(201).json(category);
  })
);

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  parentId: z.string().uuid().nullable().optional(),
});

router.patch(
  "/:id",
  authenticate,
  requirePermission("CATEGORIES"),
  asyncHandler(async (req, res) => {
    const input = updateSchema.parse(req.body);
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        ...input,
        ...(input.name ? { slug: slugify(input.name) } : {}),
      },
    });
    res.json(category);
  })
);

router.delete(
  "/:id",
  authenticate,
  requirePermission("CATEGORIES"),
  asyncHandler(async (req, res) => {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

export default router;
