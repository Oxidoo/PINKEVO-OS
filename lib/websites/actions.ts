"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { executeAgentRun } from "@/lib/ai/runs";
import { requireRole } from "@/lib/auth/server";
import type { ActionResult } from "@/lib/crm/clients";
import { db } from "@/lib/db/client";
import { agentRuns, agents, audits, websites } from "@/lib/db/schema";
import { runPsi } from "@/lib/integrations/psi/client";

const websiteSchema = z.object({
  clientId: z.string().uuid(),
  name: z.string().trim().min(1).max(160),
  url: z.string().url(),
  cms: z.enum(["webflow", "framer", "wordpress", "next", "other"]).default("other"),
});

export async function createWebsite(formData: FormData): Promise<ActionResult> {
  await requireRole(["owner", "admin", "manager", "producer"]);
  const parsed = websiteSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const [row] = await db.insert(websites).values(parsed.data).returning({ id: websites.id });
  if (row) {
    const { dispatchAutomationEvent } = await import("@/lib/automations/dispatch");
    await dispatchAutomationEvent("pinkevo/website.delivered", { websiteId: row.id });
  }
  revalidatePath("/websites");
  return { ok: true, id: row?.id };
}

export async function toggleMonitoring(id: string, enabled: boolean): Promise<ActionResult> {
  await requireRole(["owner", "admin", "manager", "producer"]);
  await db.update(websites).set({ monitoringEnabled: enabled }).where(eq(websites.id, id));
  revalidatePath(`/websites/${id}`);
  return { ok: true };
}

/** Run SEO + perf auditors on a website (parallel), tracked as agent_runs. */
export async function runFullAudit(websiteId: string): Promise<ActionResult> {
  const profile = await requireRole(["owner", "admin", "manager", "producer"]);
  const auditAgents = await db.select().from(agents).where(eq(agents.enabled, true));
  const targets = auditAgents.filter((a) => a.slug === "seo_auditor" || a.slug === "perf_auditor");
  if (targets.length === 0) {
    return { ok: false, error: "Agents d'audit indisponibles" };
  }

  const runIds: string[] = [];
  for (const agent of targets) {
    const [run] = await db
      .insert(agentRuns)
      .values({
        agentId: agent.id,
        triggeredBy: profile.id,
        input: { websiteId },
        status: "queued",
      })
      .returning({ id: agentRuns.id });
    if (run) runIds.push(run.id);
  }

  if (process.env.INNGEST_EVENT_KEY) {
    const { inngest } = await import("@/lib/inngest/client");
    await Promise.all(
      runIds.map((id) => inngest.send({ name: "agent/run.requested", data: { runId: id } })),
    );
  } else {
    await Promise.all(runIds.map((id) => executeAgentRun(id)));
  }

  revalidatePath(`/websites/${websiteId}`);
  return { ok: true, id: String(runIds.length) };
}

/**
 * Quick PSI scan : runs PageSpeed Insights for mobile + desktop synchronously
 * and stores both as `performance` audits. Free, ~10–30s, no agents required.
 */
export async function runQuickPsiScan(websiteId: string): Promise<ActionResult> {
  const profile = await requireRole(["owner", "admin", "manager", "producer"]);
  const [site] = await db.select().from(websites).where(eq(websites.id, websiteId)).limit(1);
  if (!site) return { ok: false, error: "Site introuvable" };

  const [mobile, desktop] = await Promise.all([
    runPsi(site.url, "mobile"),
    runPsi(site.url, "desktop"),
  ]);

  await db.insert(audits).values([
    {
      websiteId,
      type: "performance",
      score: mobile.performance,
      triggeredBy: profile.id,
      rawData: { psi: mobile, source: "quick_scan", strategy: "mobile" },
    },
    {
      websiteId,
      type: "performance",
      score: desktop.performance,
      triggeredBy: profile.id,
      rawData: { psi: desktop, source: "quick_scan", strategy: "desktop" },
    },
    {
      websiteId,
      type: "seo",
      score: mobile.seo,
      triggeredBy: profile.id,
      rawData: { psi: mobile, source: "quick_scan", strategy: "mobile" },
    },
  ]);

  revalidatePath(`/websites/${websiteId}`);
  revalidatePath("/websites");
  return { ok: true, id: "2" };
}
