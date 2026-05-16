import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { audits, websites } from "@/lib/db/schema";

export async function getWebsitesWithScores() {
  const all = await db.select().from(websites).orderBy(desc(websites.createdAt));
  const latest = await db
    .select({
      websiteId: audits.websiteId,
      type: audits.type,
      score: sql<number>`max(${audits.score})`,
    })
    .from(audits)
    .groupBy(audits.websiteId, audits.type);

  const byId = new Map<string, { seo?: number; perf?: number }>();
  for (const a of latest) {
    const entry = byId.get(a.websiteId) ?? {};
    if (a.type === "seo") entry.seo = a.score ?? undefined;
    else entry.perf = a.score ?? undefined;
    byId.set(a.websiteId, entry);
  }
  return all.map((w) => ({
    ...w,
    seoScore: byId.get(w.id)?.seo ?? null,
    perfScore: byId.get(w.id)?.perf ?? null,
  }));
}

export async function getWebsiteDetail(id: string) {
  const [website] = await db.select().from(websites).where(eq(websites.id, id)).limit(1);
  if (!website) return null;
  const history = await db
    .select()
    .from(audits)
    .where(eq(audits.websiteId, id))
    .orderBy(desc(audits.runAt))
    .limit(20);
  return { website, audits: history };
}
