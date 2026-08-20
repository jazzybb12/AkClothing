import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { asyncHandler } from "@/utils/asyncHandler";
import { authenticate } from "@/middleware/auth";
import { AppError } from "@/utils/AppError";
import {
  loginUser,
  refreshTokens,
  registerUser,
  requestPasswordReset,
  resetPassword,
  updateOwnAccount,
} from "./auth.service";

const router = Router();

const REFRESH_COOKIE = "refreshToken";
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-zA-Z]/, "Password must include a letter")
  .regex(/[0-9]/, "Password must include a number");

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: passwordSchema,
  phone: z.string().optional(),
});

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, password, phone } = registerSchema.parse(req.body);
    const { accessToken, refreshToken } = await registerUser(name, email, password, phone);
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
    res.status(201).json({ accessToken });
  })
);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const { accessToken, refreshToken, user } = await loginUser(email, password);
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
    res.json({
      accessToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, permissions: user.permissions },
    });
  })
);

router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) throw new AppError(401, "Missing refresh token");
    const { accessToken, refreshToken } = await refreshTokens(token);
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
    res.json({ accessToken });
  })
);

router.post("/logout", (_req, res) => {
  res.clearCookie(REFRESH_COOKIE);
  res.status(204).send();
});

const forgotPasswordSchema = z.object({ email: z.string().email() });

// POST /api/auth/forgot-password — always responds the same way regardless of whether
// the email exists, so this endpoint can't be used to enumerate accounts.
router.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const { email } = forgotPasswordSchema.parse(req.body);
    await requestPasswordReset(email);
    res.json({ message: "If an account exists for that email, a reset link has been sent." });
  })
);

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

router.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    const { token, password } = resetPasswordSchema.parse(req.body);
    await resetPassword(token, password);
    res.json({ message: "Password reset — you can now sign in." });
  })
);

router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      permissions: user.permissions,
    });
  })
);

const updateMeSchema = z.object({
  currentPassword: z.string().min(1),
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  newPassword: passwordSchema.optional(),
});

// PATCH /api/auth/me — the logged-in user changes their own name/email/password.
// Always requires currentPassword, regardless of which fields are being changed.
router.patch(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const { currentPassword, name, email, newPassword } = updateMeSchema.parse(req.body);
    const user = await updateOwnAccount(req.user!.id, currentPassword, { name, email, newPassword });
    res.json(user);
  })
);

export default router;
