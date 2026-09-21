import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { env } from "@/config/env";
import { sendEmail } from "@/utils/email";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "./jwt";

const RESET_TOKEN_TTL_MS = 10 * 60 * 1000;

function codeHash(userId: string, code: string) {
  return "code:" + crypto.createHmac("sha256", env.jwtAccessSecret).update(`${userId}:${code}`).digest("hex");
}

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
  if (env.nodeEnv === "production" && !env.resend.apiKey) {
    throw new AppError(503, "Password reset email is temporarily unavailable. Please try again later.");
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) return;
  const now = new Date();
  const code = crypto.randomInt(100000, 1000000).toString();
  const token = codeHash(user.id, code);
  const updated = await prisma.user.updateMany({
    where: { id: user.id, active: true, OR: [{ resetCodeSentAt: null }, { resetCodeSentAt: { lte: new Date(now.getTime() - 60000) } }] },
    data: { resetToken: token, resetTokenExpiresAt: new Date(now.getTime() + RESET_TOKEN_TTL_MS), resetCodeAttempts: 0, resetCodeSentAt: now },
  });
  if (!updated.count) return;
  try { await sendEmail(
    user.email,
    "Your ak.shop password reset code",
    `<p>Your password reset code is:</p><p style="font-size:32px;letter-spacing:6px"><strong>${code}</strong></p>
     <p>Enter this code on the password reset page. It expires in 10 minutes and can be used once.</p>
     <p>If you did not request this, ignore this email. Do not share the code.</p>`,
    { requireDelivery: true }
  ); } catch {
    await prisma.user.updateMany({ where: { id: user.id, resetToken: token }, data: { resetToken: null, resetTokenExpiresAt: null, resetCodeSentAt: null } });
    // Keep the response identical to unknown accounts; log no email, code or token.
    console.error("Password reset email delivery failed.");
  }
}

export async function resetPasswordWithCode(email: string, code: string, newPassword: string) {
  const invalid = () => new AppError(400, "Invalid or expired code. Request a new code and try again.");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active || !user.resetToken?.startsWith("code:")) throw invalid();
  if (user.resetCodeAttempts >= 5) throw new AppError(400, "This code has reached its attempt limit. Select Resend code and use the newest email.");
  const eligible = { id: user.id, active: true, resetToken: user.resetToken, resetTokenExpiresAt: { gt: new Date() }, resetCodeAttempts: { lt: 5 } };
  // Atomically reserve an attempt so parallel requests cannot bypass the limit.
  const attempt = await prisma.user.updateMany({ where: eligible, data: { resetCodeAttempts: { increment: 1 } } });
  if (!attempt.count || !crypto.timingSafeEqual(Buffer.from(codeHash(user.id, code)), Buffer.from(user.resetToken))) throw invalid();
  const passwordHash = await bcrypt.hash(newPassword, 10);
  const changed = await prisma.user.updateMany({
    where: { id: user.id, active: true, resetToken: user.resetToken, resetTokenExpiresAt: { gt: new Date() } },
    data: { passwordHash, resetToken: null, resetTokenExpiresAt: null, resetCodeAttempts: 0 },
  });
  if (!changed.count) throw invalid();
}

export async function resetPassword(token: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { resetToken: token } });
  if (!user || !user.active || token.startsWith("code:") || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
    throw new AppError(400, "This reset link is invalid or has expired");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const changed = await prisma.user.updateMany({
    where: { id: user.id, active: true, resetToken: token, resetTokenExpiresAt: { gt: new Date() } },
    data: { passwordHash, resetToken: null, resetTokenExpiresAt: null },
  });
  if (!changed.count) throw new AppError(400, "This reset link is invalid or has expired");
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
