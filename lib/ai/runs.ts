"use server";

import { and, desc, eq, gte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getHandler } from "@/lib/ai/agents";
import { computeCostUsd, providerForModel } from "@/lib/ai/cost";
import { requireRole } from "@/lib/auth/server";
import type { ActionResult } from "@/lib/crm/clients";
import { db } from "@/lib/db/client";
import { agentRuns, agents, apiUsage } from "@/lib/db/schema";
import { logger } from "@/lib/logger";

/** Core executor — runs the agent handler and finalises the agent_runs row. */
export async function executeAgentRun(runId: string): Promise<void> {
  const [run] = await db.select().from(agentRuns).where(eq(agentRuns.id, runId)).limit(1);
  if (!run) return;
  const [agent] = await db.select().from(agents).where(eq(agents.id, run.agentId)).limit(1);
  if (!agent) return;

  const handler = getHandler(agent.slug);
  if (!handler) {
    await db
      .update(agentRuns)
      .set({ status: "failed", error: "Handler introuvable", finishedAt: new Date() })
      .where(eq(agentRuns.id, runId));
    return;
  }

  const startedAt = new Date();
  await db.update(agentRuns).set({ status: "running", startedAt }).where(eq(agentRuns.id, runId));

  try {
    const parsed = handler.inputSchema.parse(run.input ?? {});
    const result = await handler.run(parsed, agent.model, {
      triggeredBy: run.triggeredBy,
    });
    const finishedAt = new Date();
    const cost = computeCostUsd(agent.model, result.tokensInput, result.tokensOutput);

    await db
      .update(agentRuns)
      .set({
        status: "success",
        output: { ...result.output, summary: result.summary },
        tokensInput: result.tokensInput,
        tokensOutput: result.tokensOutput,
        costUsd: String(cost),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        finishedAt,
      })
      .where(eq(agentRuns.id, runId));

    if (result.tokensInput + result.tokensOutput > 0) {
      const today = finishedAt.toISOString().slice(0, 10);
      await db.insert(apiUsage).values({
        provider: providerForModel(agent.model),
        date: today,
        tokens: result.tokensInput + result.tokensOutput,
        requests: 1,
        costUsd: String(cost),
        rawData: { agentSlug: agent.slug, runId },
      });
    }
  } catch (err) {
    logger.error({ err, runId }, "agent run failed");
    await db
      .update(agentRuns)
      .set({
        status: "failed",
        error: err instanceof Error ? err.message : "Erreur inconnue",
        finishedAt: new Date(),
      })
      .where(eq(agentRuns.id, runId));
  }

  revalidatePath("/agents");
}

/**
 * Trigger an agent run. Creates the queued row, then dispatches to Inngest
 * when configured, otherwise executes inline (keeps the UX working in dev /
 * demo without a running Inngest worker).
 */
export async function triggerAgentRun(
  slug: string,
  input: Record<string, unknown>,
): Promise<ActionResult> {
  const profile = await requireRole(["owner", "admin", "manager", "sales"]);
  const [agent] = await db
    .select()
    .from(agents)
    .where(eq(agents.slug, slug as (typeof agents.slug.enumValues)[number]))
    .limit(1);
  if (!agent) return { ok: false, error: "Agent introuvable" };
  if (!agent.enabled) return { ok: false, error: "Agent désactivé" };

  const [run] = await db
    .insert(agentRuns)
    .values({ agentId: agent.id, triggeredBy: profile.id, input, status: "queued" })
    .returning({ id: agentRuns.id });
  if (!run) return { ok: false, error: "Création du run échouée" };

  if (process.env.INNGEST_EVENT_KEY) {
    const { inngest } = await import("@/lib/inngest/client");
    await inngest.send({ name: "agent/run.requested", data: { runId: run.id } });
  } else {
    await executeAgentRun(run.id);
  }

  revalidatePath("/agents");
  return { ok: true, id: run.id };
}

export async function updateAgentConfig(
  id: string,
  data: { systemPrompt: string; model: string; enabled: boolean },
): Promise<ActionResult> {
  await requireRole(["owner", "admin", "manager"]);
  await db
    .update(agents)
    .set({ systemPrompt: data.systemPrompt, model: data.model, enabled: data.enabled })
    .where(eq(agents.id, id));
  revalidatePath("/agents");
  return { ok: true };
}

const monthStart = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

export async function getAgentsWithStats() {
  const all = await db.select().from(agents).orderBy(agents.slug);
  const stats = await db
    .select({
      agentId: agentRuns.agentId,
      runs: sql<number>`count(*)::int`,
      cost: sql<string>`coalesce(sum(${agentRuns.costUsd}), 0)`,
      successes: sql<number>`count(*) filter (where ${agentRuns.status} = 'success')::int`,
      lastRun: sql<string | null>`max(${agentRuns.createdAt})`,
    })
    .from(agentRuns)
    .where(gte(agentRuns.createdAt, monthStart()))
    .groupBy(agentRuns.agentId);

  const byId = new Map(stats.map((s) => [s.agentId, s]));
  return all.map((a) => {
    const s = byId.get(a.id);
    return {
      ...a,
      monthRuns: s?.runs ?? 0,
      monthCost: Number(s?.cost ?? 0),
      successRate: s && s.runs > 0 ? Math.round((s.successes / s.runs) * 100) : null,
      lastRun: s?.lastRun ?? null,
    };
  });
}

export async function getAgentRuns(agentId: string) {
  return db
    .select()
    .from(agentRuns)
    .where(eq(agentRuns.agentId, agentId))
    .orderBy(desc(agentRuns.createdAt))
    .limit(30);
}

export async function getAiCostBreakdown() {
  const byDay = await db
    .select({
      date: apiUsage.date,
      provider: apiUsage.provider,
      cost: sql<string>`sum(${apiUsage.costUsd})`,
      tokens: sql<string>`coalesce(sum(${apiUsage.tokens}), 0)`,
    })
    .from(apiUsage)
    .where(gte(apiUsage.date, monthStart().toISOString().slice(0, 10)))
    .groupBy(apiUsage.date, apiUsage.provider)
    .orderBy(apiUsage.date);

  const byAgent = await db
    .select({
      agentId: agentRuns.agentId,
      cost: sql<string>`coalesce(sum(${agentRuns.costUsd}), 0)`,
      runs: sql<number>`count(*)::int`,
    })
    .from(agentRuns)
    .where(and(gte(agentRuns.createdAt, monthStart()), eq(agentRuns.status, "success")))
    .groupBy(agentRuns.agentId);

  return { byDay, byAgent };
}
