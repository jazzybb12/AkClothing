import { execSync } from "child_process";
import fs from "fs";
import net from "net";
import path from "path";
import { createApp } from "@/app";
import { env } from "@/config/env";

// Raw TCP reachability probe against the DB host, logged before Prisma's own attempt —
// distinguishes "network route blocked" (timeout/ENETUNREACH) from "server reachable but
// rejecting" (ECONNREFUSED) from "server reachable, Prisma-level auth issue" (neither of
// those, Prisma's own P1000/P1001 below tells the rest). Diagnostic only — never blocks
// startup, and dbHost/dbPort come straight from DATABASE_URL so it always checks whatever
// host is actually configured.
function probeDatabaseTcp(): Promise<void> {
  return new Promise((resolve) => {
    let dbHost: string, dbPort: number;
    try {
      const u = new URL(env.databaseUrl);
      dbHost = u.hostname;
      dbPort = Number(u.port || 3306);
    } catch {
      console.error("TCP probe: could not parse DATABASE_URL to extract host/port.");
      return resolve();
    }
    console.log(`TCP probe: attempting raw connection to ${dbHost}:${dbPort}...`);
    let settled = false;
    const finish = (log: string) => {
      if (settled) return;
      settled = true;
      console.log(log);
      resolve();
    };
    const socket = net.createConnection({ host: dbHost, port: dbPort }, () => {
      socket.setTimeout(0);
      finish("TCP probe: reachable.");
      socket.end();
    });
    socket.setTimeout(10000, () => {
      socket.destroy();
      finish("TCP probe: timeout — no route or blocked by firewall.");
    });
    socket.on("error", (e: NodeJS.ErrnoException) => {
      finish(`TCP probe: error — ${e.code}`);
    });
  });
}

// Some hosts (Hostinger's deploy packaging included) copy node_modules into the final
// runtime location without preserving the executable bit on Prisma's native engine
// binaries, causing EACCES when Prisma tries to spawn them. Restoring 0o755 here is a
// no-op on platforms where the bit was already set, and harmless on Windows (chmod is
// largely a no-op there too), so this is safe to run unconditionally on every boot.
function restoreEngineExecutePermissions() {
  const dirs = ["@prisma/engines", ".prisma/client"].map((d) => path.join(__dirname, "..", "node_modules", d));
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (/engine|schema-engine|query_engine|libquery_engine/.test(file)) {
        try {
          fs.chmodSync(path.join(dir, file), 0o755);
        } catch {
          // best-effort — if this fails, the migrate step below will surface a clear error
        }
      }
    }
  }
}
async function main() {
  restoreEngineExecutePermissions();
  await probeDatabaseTcp();

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
}

main();
