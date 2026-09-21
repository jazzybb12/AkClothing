import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !email.includes("@") || !password || password.length < 12) {
    throw new Error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (at least 12 characters) in backend/.env first.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.role !== "ADMIN") {
    throw new Error("This email belongs to a non-admin account. Use an admin email or a new email.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    create: { name: "Store Admin", email, passwordHash, role: "ADMIN", active: true },
    update: { passwordHash, active: true, resetToken: null, resetTokenExpiresAt: null },
  });
  console.log(`Admin access restored for ${email}. Sign in using the password you set in backend/.env.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Admin recovery failed.");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
