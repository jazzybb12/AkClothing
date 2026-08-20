import { Router } from "express";
import { prisma } from "@/config/prisma";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

// GET /api/settings — public, storefront-safe subset (WhatsApp button, footer contact info)
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const settings = await prisma.settings.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" },
    });
    res.json({
      logoUrl: settings.logoUrl,
      faviconUrl: settings.faviconUrl,
      brandColor: settings.brandColor,
      accentColor: settings.accentColor,
      whatsappNumber: settings.whatsappNumber,
      storeName: settings.storeName,
      storeContactEmail: settings.storeContactEmail,
      storeContactPhone: settings.storeContactPhone,
      shippingFee: settings.shippingFee,
      codEnabled: settings.codEnabled,
      bankDepositEnabled: settings.bankDepositEnabled,
      bankDepositInstructions: settings.bankDepositInstructions,
      occasionEyebrow: settings.occasionEyebrow,
      occasionHeading: settings.occasionHeading,
      bazaarEyebrow: settings.bazaarEyebrow,
      bazaarHeading: settings.bazaarHeading,
      bazaarLimit: settings.bazaarLimit,
      collectionsEyebrow: settings.collectionsEyebrow,
      collectionsHeading: settings.collectionsHeading,
      reviewsEyebrow: settings.reviewsEyebrow,
      reviewsHeading: settings.reviewsHeading,
    });
  })
);

export default router;
