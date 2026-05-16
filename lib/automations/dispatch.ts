import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { automations } from "@/lib/db/schema";
import { type AutomationPayload, runAutomation } from "./engine";

/**
 * Run every enabled automation whose trigger event matches. Called inline at
 * domain points (deal won, lead imported, …) so it works without an Inngest
 * worker; the Inngest function delegates here too.
 */
export async function dispatchAutomationEvent(
  event: string,
  payload: AutomationPayload,
): Promise<number> {
  const matches = await db
    .select({ id: automations.id })
    .from(automations)
    .where(
      and(eq(automations.enabled, true), sql`${automations.triggerConfig} ->> 'event' = ${event}`),
    );
  for (const m of matches) {
    await runAutomation(m.id, payload);
  }
  return matches.length;
}
