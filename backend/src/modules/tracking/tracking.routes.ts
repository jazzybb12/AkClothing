import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { asyncHandler } from "@/utils/asyncHandler";
import { classifyChannel } from "@/utils/traffic";
import { env } from "@/config/env";

const router = Router();

const pageviewSchema = z.object({
  path: z.string().min(1).max(500),
  sessionId: z.string().min(1).max(100),
  referrer: z.string().max(1000).optional(),
});

// POST /api/track/pageview — public, fire-and-forget beacon from the storefront (never
// the admin panel — see frontend PageViewTracker). Powers the real visitor/traffic-source
// numbers on the admin dashboard; nothing here is fabricated.
router.post(
  "/pageview",
  asyncHandler(async (req, res) => {
    const input = pageviewSchema.parse(req.body);
    let ownHost: string | undefined;
    try {
      ownHost = new URL(env.frontendUrl).hostname;
    } catch {
      ownHost = undefined;
    }
    const channel = classifyChannel(input.referrer, input.path, ownHost);

    await prisma.pageView.create({
      data: { path: input.path, sessionId: input.sessionId, referrer: input.referrer, channel },
    });

    res.status(201).json({ ok: true });
  })
);

export default router;
