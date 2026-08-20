import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

const subscribeSchema = z.object({ email: z.string().email() });

// POST /api/newsletter — public signup, idempotent (re-subscribing an existing email is a no-op success)
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { email } = subscribeSchema.parse(req.body);
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: {},
      create: { email },
    });
    res.status(201).json({ email });
  })
);

export default router;
