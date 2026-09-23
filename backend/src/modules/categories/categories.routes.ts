import { AppError } from "@/utils/AppError";
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
  name: z.string().trim().min(2),
  parentId: z.string().uuid().optional(),
});

router.post(
  "/",
  authenticate,
  requirePermission("CATEGORIES"),
  asyncHandler(async (req, res) => {
    const input = createSchema.parse(req.body);
    if (!slugify(input.name)) throw new AppError(400, "Category name must include a letter or number.");
    const duplicate = await prisma.category.findFirst({ where: { OR: [{ name: input.name }, { slug: slugify(input.name) }] } });
    if (duplicate) throw new AppError(409, "A category with this name already exists.");
    const category = await prisma.category.create({
      data: { name: input.name, slug: slugify(input.name), parentId: input.parentId },
    });
    res.status(201).json(category);
  })
);

const updateSchema = z.object({
  name: z.string().trim().min(2).optional(),
  parentId: z.string().uuid().nullable().optional(),
});

router.patch(
  "/:id",
  authenticate,
  requirePermission("CATEGORIES"),
  asyncHandler(async (req, res) => {
    const input = updateSchema.parse(req.body);
    if (input.name) {
      if (!slugify(input.name)) throw new AppError(400, "Category name must include a letter or number.");
      const duplicate = await prisma.category.findFirst({ where: { id: { not: req.params.id }, OR: [{ name: input.name }, { slug: slugify(input.name) }] } });
      if (duplicate) throw new AppError(409, "A category with this name already exists.");
    }
    if (input.parentId === req.params.id) throw new AppError(400, "A category cannot be its own parent.");
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
    const category = await prisma.category.findUnique({ where: { id: req.params.id }, include: { _count: { select: { products: true, children: true } } } });
    if (!category) throw new AppError(404, "Category not found.");
    if (category._count.products) throw new AppError(409, "Move this category's products to another category before deleting it.");
    if (category._count.children) throw new AppError(409, "Move or delete this category's subcategories before deleting it.");
    await prisma.category.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

export default router;
