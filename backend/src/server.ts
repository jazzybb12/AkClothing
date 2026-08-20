import { execSync } from "child_process";
import { createApp } from "@/app";
import { env } from "@/config/env";

// Applies pending migrations at process startup rather than during `npm install` —
// some hosts (e.g. Hostinger's Node.js app deploy) only inject environment variables
// (DATABASE_URL etc.) into the running process, not into the build/install step, so a
// migrate step in package.json's postinstall can't reach the real database yet.
try {
  // Invoke Prisma's CLI entry point directly, using process.execPath (the absolute path
  // to the currently-running node binary) rather than the bare "node" or "npx" commands —
  // Hostinger's runtime spawns execSync's subshell with a PATH that doesn't even resolve
  // "node" by name, even though the app itself is obviously running under Node.
  const prismaCli = require.resolve("prisma/build/index.js");
  execSync(`"${process.execPath}" "${prismaCli}" migrate deploy`, { encoding: "utf-8" });
} catch (err) {
  // stdio defaults to "pipe" here (not "inherit") specifically so the real Prisma error
  // text ends up on err.stdout/err.stderr, where the host's log viewer actually captures
  // it — "inherit" writes straight to the OS stream and gets lost in some hosts' logs.
  const e = err as { stdout?: string; stderr?: string; message?: string };
  console.error("Prisma migrate deploy failed.");
  if (e.stdout) console.error("stdout:", e.stdout);
  if (e.stderr) console.error("stderr:", e.stderr);
  if (!e.stdout && !e.stderr) console.error(e.message ?? err);
  process.exit(1);
}

const app = createApp();

app.listen(env.port, () => {
  console.log(`Backend API listening on http://localhost:${env.port}`);
});
