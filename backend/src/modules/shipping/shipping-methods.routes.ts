import { Router } from "express";
import { prisma } from "@/config/prisma";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

// GET /api/shipping-methods — public: active options only, for the checkout picker
// (the admin management list under /api/admin/shipping-methods returns every method,
// including inactive ones — same split as /api/banners vs /api/admin/banners).
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const methods = await prisma.shippingMethod.findMany({
      where: { active: true },
      orderBy: { position: "asc" },
    });
    res.json(methods);
  })
);

export default router;
