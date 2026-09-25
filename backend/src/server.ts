import fs from "fs";
import path from "path";
import { createApp } from "@/app";
import { env } from "@/config/env";
import { cleanupDemoData } from "@/utils/cleanupDemoData";

// Some hosts (Hostinger's deploy packaging included) copy node_modules into the final
// runtime location without preserving the executable bit on Prisma's native engine
// binaries. Restoring 0o755 here is a no-op on platforms where the bit was already set,
// and harmless on Windows (chmod is largely a no-op there too), so this is safe to run
// unconditionally on every boot.
function restoreEngineExecutePermissions() {
  const dirs = ["@prisma/engines", ".prisma/client"].map((d) => path.join(__dirname, "..", "node_modules", d));
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (/engine|schema-engine|query_engine|libquery_engine/.test(file)) {
        try {
          fs.chmodSync(path.join(dir, file), 0o755);
        } catch {
          // best-effort, non-fatal
        }
      }
    }
  }
}
restoreEngineExecutePermissions();

// Migrations are applied out-of-band (run `npx prisma migrate deploy` against the
// production DATABASE_URL from a local machine or CI whenever the schema changes) rather
// than at app boot. Hostinger's Node.js hosting both (a) expects listen() within a few
// seconds of startup, and (b) was observed to be unable to reliably spawn the Prisma
// schema-engine subprocess that `migrate deploy` needs (OS-level spawn failures even with
// long retry backoff) — @prisma/client's query engine used for normal request handling
// below runs in-process (no subprocess spawn), so it isn't affected by that limitation.
const app = createApp();

app.listen(env.port, () => {
  console.log(`Backend API listening on http://localhost:${env.port}`);
  cleanupDemoData().catch((error) => console.error("Demo data cleanup failed:", error));
});
