import { execSync } from "child_process";
import { createApp } from "@/app";
import { env } from "@/config/env";

// Applies pending migrations at process startup rather than during `npm install` —
// some hosts (e.g. Hostinger's Node.js app deploy) only inject environment variables
// (DATABASE_URL etc.) into the running process, not into the build/install step, so a
// migrate step in package.json's postinstall can't reach the real database yet.
try {
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
} catch (err) {
  console.error("Prisma migrate deploy failed:", err);
  process.exit(1);
}

const app = createApp();

app.listen(env.port, () => {
  console.log(`Backend API listening on http://localhost:${env.port}`);
});
