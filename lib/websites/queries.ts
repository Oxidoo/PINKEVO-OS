import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { audits, websites } from "@/lib/db/schema";
import type { PsiResult } from "@/lib/integrations/psi/client";

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

function extractPsi(rawData: Record<string, unknown> | null): PsiResult | null {
  if (!rawData) return null;
  const psi = (rawData as { psi?: unknown }).psi;
  if (!psi || typeof psi !== "object") return null;
  // Older audits may not have opportunities/failures/full metrics. Normalize.
  const p = psi as Partial<PsiResult> & { metrics?: Partial<PsiResult["metrics"]> };
  return {
    strategy: p.strategy ?? "mobile",
    performance: p.performance ?? 0,
    seo: p.seo ?? 0,
    accessibility: p.accessibility ?? 0,
    bestPractices: p.bestPractices ?? 0,
    metrics: {
      lcp: p.metrics?.lcp ?? 0,
      cls: p.metrics?.cls ?? 0,
      tbt: p.metrics?.tbt ?? 0,
      fcp: p.metrics?.fcp ?? 0,
      si: p.metrics?.si ?? 0,
      tti: p.metrics?.tti ?? 0,
    },
    opportunities: p.opportunities ?? [],
    failures: p.failures ?? [],
    mock: p.mock,
  };
}

export async function getLatestPsi(
  websiteId: string,
): Promise<{ mobile: PsiResult | null; desktop: PsiResult | null; lastRunAt: Date | null }> {
  const rows = await db
    .select()
    .from(audits)
    .where(and(eq(audits.websiteId, websiteId), eq(audits.type, "performance")))
    .orderBy(desc(audits.runAt))
    .limit(20);

  let mobile: PsiResult | null = null;
  let desktop: PsiResult | null = null;
  let lastRunAt: Date | null = null;
  for (const row of rows) {
    const psi = extractPsi(row.rawData);
    if (!psi) continue;
    if (!lastRunAt) lastRunAt = row.runAt;
    if (psi.strategy === "mobile" && !mobile) mobile = psi;
    else if (psi.strategy === "desktop" && !desktop) desktop = psi;
    if (mobile && desktop) break;
  }
  return { mobile, desktop, lastRunAt };
}

export async function getPerfHistory(websiteId: string, limit = 12) {
  return db
    .select({ runAt: audits.runAt, score: audits.score, rawData: audits.rawData })
    .from(audits)
    .where(and(eq(audits.websiteId, websiteId), eq(audits.type, "performance")))
    .orderBy(desc(audits.runAt))
    .limit(limit);
}
