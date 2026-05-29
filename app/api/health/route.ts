import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";

export const dynamic = "force-dynamic";

/**
 * Lightweight health probe for uptime monitors and load balancers.
 * Returns 200 when the database is reachable, 503 otherwise.
 */
export async function GET() {
  const startedAt = Date.now();
  try {
    await db.execute(sql`select 1`);
    return Response.json({
      status: "ok",
      db: "up",
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return Response.json(
      {
        status: "error",
        db: "down",
        latencyMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
