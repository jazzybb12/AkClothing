import { Router } from "express";
import { z } from "zod";
import { EmailTemplateKey } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { asyncHandler } from "@/utils/asyncHandler";
import { authenticate, requirePermission } from "@/middleware/auth";
import { AppError } from "@/utils/AppError";
import { getTemplate, PLACEHOLDERS } from "./email-templates.service";

const router = Router();

const KEYS = Object.values(EmailTemplateKey);

// GET /api/admin/email-templates — all 5 templates with their effective (override-or-default)
// content and a flag for whether an admin has customized them.
router.get(
  "/",
  authenticate,
  requirePermission("EMAIL_TEMPLATES"),
  asyncHandler(async (_req, res) => {
    const templates = await Promise.all(KEYS.map(async (key) => ({ key, ...(await getTemplate(key)) })));
    res.json({ templates, placeholders: PLACEHOLDERS });
  })
);

const updateSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
});

// PATCH /api/admin/email-templates/:key — save a customized subject/body override
router.patch(
  "/:key",
  authenticate,
  requirePermission("EMAIL_TEMPLATES"),
  asyncHandler(async (req, res) => {
    if (!KEYS.includes(req.params.key as EmailTemplateKey)) throw new AppError(400, "Unknown template key");
    const key = req.params.key as EmailTemplateKey;
    const input = updateSchema.parse(req.body);
    await prisma.emailTemplate.upsert({
      where: { key },
      update: input,
      create: { key, ...input },
    });
    res.json({ key, ...input, isCustomized: true });
  })
);

// POST /api/admin/email-templates/:key/reset — discard the override, revert to default
router.post(
  "/:key/reset",
  authenticate,
  requirePermission("EMAIL_TEMPLATES"),
  asyncHandler(async (req, res) => {
    if (!KEYS.includes(req.params.key as EmailTemplateKey)) throw new AppError(400, "Unknown template key");
    const key = req.params.key as EmailTemplateKey;
    await prisma.emailTemplate.deleteMany({ where: { key } });
    res.json({ key, ...(await getTemplate(key)) });
  })
);

export default router;
