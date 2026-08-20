import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { asyncHandler } from "@/utils/asyncHandler";
import { sendEmail } from "@/utils/email";

const router = Router();

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(5).max(2000),
});

// POST /api/contact — public: forwards the message to the store's contact email
// (falls back to logging it, same as the password-reset email path, if none is set)
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = contactSchema.parse(req.body);
    const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
    const to = settings?.storeContactEmail || "store-owner@example.com";

    await sendEmail(
      to,
      `New contact message from ${input.name}`,
      `<p><strong>From:</strong> ${input.name} (${input.email})</p><p>${input.message.replace(/\n/g, "<br>")}</p>`
    );

    res.json({ message: "Thanks — we'll get back to you soon." });
  })
);

export default router;
