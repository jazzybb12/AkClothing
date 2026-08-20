import { Router } from "express";
import { prisma } from "@/config/prisma";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

// GET /api/banners — public: active homepage hero slides, in display order
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const banners = await prisma.banner.findMany({
      where: { active: true },
      orderBy: { position: "asc" },
    });
    res.json(banners);
  })
);

export default router;
