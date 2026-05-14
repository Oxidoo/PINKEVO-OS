/**
 * Seed script — to be implemented module by module from Phase 2 onwards.
 * Run with: pnpm seed
 */
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  console.info("[seed] phase 0 — no data to seed yet. Add seeds per module starting Phase 2.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
