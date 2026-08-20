import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "@/config/env";
import { errorHandler, notFoundHandler } from "@/middleware/errorHandler";

import authRoutes from "@/modules/auth/auth.routes";
import productRoutes from "@/modules/products/products.routes";
import categoryRoutes from "@/modules/categories/categories.routes";
import couponRoutes from "@/modules/coupons/coupons.routes";
import orderRoutes from "@/modules/orders/orders.routes";
import uploadRoutes from "@/modules/uploads/uploads.routes";
import adminRoutes from "@/modules/admin/admin.routes";
import customerRoutes from "@/modules/admin/customers.routes";
import reportsRoutes from "@/modules/admin/reports.routes";
import emailTemplatesRoutes from "@/modules/email-templates/email-templates.routes";
import settingsRoutes from "@/modules/settings/settings.routes";
import newsletterRoutes from "@/modules/newsletter/newsletter.routes";
import reviewRoutes from "@/modules/reviews/reviews.routes";
import contactRoutes from "@/modules/contact/contact.routes";
import trackingRoutes from "@/modules/tracking/tracking.routes";
import bannerRoutes from "@/modules/banners/banners.routes";
import shippingMethodRoutes from "@/modules/shipping/shipping-methods.routes";
import collectionRoutes from "@/modules/collections/collections.routes";

// Brute-force protection for login/register — generous enough for a real user who
// mistypes their password a few times, tight enough to make credential-stuffing slow.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again in a few minutes." },
});

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many messages sent. Please try again later." },
});

// Generous — a single real visitor generates several pageviews per visit just browsing.
const trackingLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests." },
});

// Separate bucket from authLimiter on purpose: this route already requires a valid
// session token, so it isn't exposed to credential-stuffing the way login/register are.
// Sharing one bucket meant a few login attempts could exhaust the budget and lock a
// logged-in admin out of routine profile/password edits.
const accountUpdateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again in a few minutes." },
});

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);
  app.use("/api/auth/forgot-password", authLimiter);
  app.use("/api/auth/me", (req, res, next) =>
    req.method === "PATCH" ? accountUpdateLimiter(req, res, next) : next()
  );
  app.use("/api/auth", authRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/coupons", couponRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/uploads", uploadRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/admin/customers", customerRoutes);
  app.use("/api/admin/reports", reportsRoutes);
  app.use("/api/admin/email-templates", emailTemplatesRoutes);
  app.use("/api/settings", settingsRoutes);
  app.use("/api/newsletter", newsletterRoutes);
  app.use("/api/reviews", reviewRoutes);
  app.use("/api/contact", contactLimiter, contactRoutes);
  app.use("/api/track", trackingLimiter, trackingRoutes);
  app.use("/api/banners", bannerRoutes);
  app.use("/api/shipping-methods", shippingMethodRoutes);
  app.use("/api/collections", collectionRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
