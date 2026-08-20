import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { env } from "@/config/env";
import { sendEmail } from "@/utils/email";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "./jwt";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function registerUser(name: string, email: string, password: string, phone?: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, phone, passwordHash },
  });

  return issueTokens(user.id, user.role);
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError(401, "Invalid email or password");
  }
  // Checked only after the password has already matched, so this never lets an
  // attacker use login attempts to discover which accounts exist vs. are disabled.
  if (!user.active) {
    throw new AppError(403, "This account has been deactivated. Contact an administrator.");
  }

  return { ...issueTokens(user.id, user.role), user };
}

export async function refreshTokens(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, "Invalid or expired refresh token");
  }
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.active) {
    throw new AppError(401, "Invalid or expired refresh token");
  }
  return issueTokens(user.id, user.role);
}

// Always succeeds from the caller's point of view (the route never reveals whether the
// email exists) — this function is where the actual work happens, silently no-op'ing for
// unknown emails so the API response can't be used to enumerate accounts.
export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) return;

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: token, resetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
  });

  const resetUrl = `${env.frontendUrl}/reset-password?token=${token}`;
  await sendEmail(
    user.email,
    "Reset your ak.shop password",
    `<p>Hi ${user.name},</p>
     <p>Click the link below to set a new password. This link expires in 1 hour and can only be used once.</p>
     <p><a href="${resetUrl}">${resetUrl}</a></p>
     <p>If you didn't request this, you can safely ignore this email.</p>`
  );
}

export async function resetPassword(token: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { resetToken: token } });
  if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
    throw new AppError(400, "This reset link is invalid or has expired");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExpiresAt: null },
  });
}

// Self-service profile update (name/email/password) — always requires the current
// password, so a stolen access token alone (e.g. via XSS) can't be used to silently
// take over the account by swapping the email or password.
export async function updateOwnAccount(
  userId: string,
  currentPassword: string,
  updates: { name?: string; email?: string; newPassword?: string }
) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new AppError(401, "Current password is incorrect");
  }

  if (updates.email && updates.email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email: updates.email } });
    if (existing) throw new AppError(409, "That email is already in use");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(updates.name ? { name: updates.name } : {}),
      ...(updates.email ? { email: updates.email } : {}),
      ...(updates.newPassword ? { passwordHash: await bcrypt.hash(updates.newPassword, 10) } : {}),
    },
  });

  return {
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    phone: updated.phone,
    permissions: updated.permissions,
  };
}

function issueTokens(userId: string, role: "CUSTOMER" | "ADMIN" | "STAFF") {
  return {
    accessToken: signAccessToken({ sub: userId, role }),
    refreshToken: signRefreshToken({ sub: userId, role }),
  };
}
