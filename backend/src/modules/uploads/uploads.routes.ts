import { Router } from "express";
import { v2 as cloudinary } from "cloudinary";
import { Role } from "@prisma/client";
import { env } from "@/config/env";
import { authenticate, requireRole } from "@/middleware/auth";

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
});

const router = Router();

// POST /api/uploads/sign — admin: returns signed params so the browser can upload
// straight to Cloudinary (product images never pass through our server).
router.post("/sign", authenticate, requireRole(Role.ADMIN, Role.STAFF), (_req, res) => {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = "products";
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, env.cloudinary.apiSecret);

  res.json({
    timestamp,
    signature,
    folder,
    apiKey: env.cloudinary.apiKey,
    cloudName: env.cloudinary.cloudName,
  });
});

export default router;
