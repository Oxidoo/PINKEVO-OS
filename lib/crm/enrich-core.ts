import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { leads } from "@/lib/db/schema";
import { searchCompany } from "@/lib/integrations/pappers/client";

export async function enrichLeadCore(id: string): Promise<{ ok: boolean; reason?: string }> {
  const [lead] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  if (!lead) return { ok: false, reason: "not_found" };

  const query = lead.company ?? `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim();
  if (!query) return { ok: false, reason: "no_query" };

  const company = await searchCompany(query);
  if (!company) return { ok: false, reason: "no_results" };

  await db
    .update(leads)
    .set({
      status: lead.status === "new" ? "enriched" : lead.status,
      enrichmentData: { ...(lead.enrichmentData ?? {}), pappers: company },
    })
    .where(eq(leads.id, id));

  return { ok: true };
}
