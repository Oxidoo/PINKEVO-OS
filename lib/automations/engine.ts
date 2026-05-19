import "server-only";
import { eq } from "drizzle-orm";
import { executeAgentRun } from "@/lib/ai/runs";
import { db } from "@/lib/db/client";
import { agentRuns, agents, automations, clients, leads } from "@/lib/db/schema";
import { FollowUpEmail } from "@/lib/email/templates/follow-up";
import { sendEmail } from "@/lib/integrations/resend/client";
import { logger } from "@/lib/logger";

export type StepKind =
  | "qualify_lead"
  | "audit_site"
  | "send_followup"
  | "create_client_from_lead"
  | "onboarding_email";

export interface AutomationStep {
  kind: StepKind;
  label?: string;
}

export interface AutomationPayload {
  leadId?: string;
  websiteId?: string;
  clientId?: string;
}

export const STEP_LABELS: Record<StepKind, string> = {
  qualify_lead: "Qualifier le lead (agent IA)",
  audit_site: "Audit complet du site (SEO + perf)",
  send_followup: "Envoyer un email de relance",
  create_client_from_lead: "Convertir le lead en client",
  onboarding_email: "Envoyer l'email d'onboarding",
};

async function runAgentBySlug(slug: string, input: Record<string, unknown>) {
  const [agent] = await db
    .select()
    .from(agents)
    .where(eq(agents.slug, slug as (typeof agents.slug.enumValues)[number]))
    .limit(1);
  if (!agent) return;
  const [run] = await db
    .insert(agentRuns)
    .values({ agentId: agent.id, input, status: "queued" })
    .returning({ id: agentRuns.id });
  if (run) await executeAgentRun(run.id);
}

async function executeStep(step: AutomationStep, payload: AutomationPayload): Promise<string> {
  switch (step.kind) {
    case "qualify_lead": {
      if (!payload.leadId) return "skip: pas de lead";
      await runAgentBySlug("lead_qualifier", { leadId: payload.leadId });
      return "lead qualifié";
    }
    case "audit_site": {
      if (!payload.websiteId) return "skip: pas de site";
      await runAgentBySlug("seo_auditor", { websiteId: payload.websiteId });
      await runAgentBySlug("perf_auditor", { websiteId: payload.websiteId });
      return "audits lancés";
    }
    case "send_followup": {
      const id = payload.leadId;
      if (!id) return "skip: pas de lead";
      const [lead] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
      if (!lead?.email) return "skip: pas d'email";
      await sendEmail({
        to: lead.email,
        subject: "On reprend contact",
        leadId: lead.id,
        react: FollowUpEmail({
          message: "Nous revenons vers vous suite à votre intérêt. Disponible pour un échange ?",
        }),
      });
      return "email de relance envoyé";
    }
    case "create_client_from_lead": {
      if (!payload.leadId) return "skip: pas de lead";
      const [lead] = await db.select().from(leads).where(eq(leads.id, payload.leadId)).limit(1);
      if (!lead) return "skip: lead introuvable";
      const name = lead.company ?? (`${lead.firstName ?? ""}`.trim() || "Nouveau client");
      const [client] = await db
        .insert(clients)
        .values({ name, company: lead.company, status: "active", acquiredAt: new Date() })
        .returning({ id: clients.id });
      if (client) {
        await db
          .update(leads)
          .set({ status: "converted", convertedToClientId: client.id })
          .where(eq(leads.id, lead.id));
        payload.clientId = client.id;
      }
      return "client créé";
    }
    case "onboarding_email": {
      const id = payload.clientId;
      if (!id) return "skip: pas de client";
      const [client] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
      // Onboarding email goes to the first contact; fall back to a log when absent.
      if (!client) return "skip: client introuvable";
      logger.info({ clientId: id }, "onboarding email queued (no contact email resolver in V1)");
      return "onboarding préparé";
    }
    default:
      return "étape inconnue";
  }
}

export async function runAutomation(
  automationId: string,
  payload: AutomationPayload,
): Promise<{ ran: number; results: string[] }> {
  const [automation] = await db
    .select()
    .from(automations)
    .where(eq(automations.id, automationId))
    .limit(1);
  if (!automation?.enabled) return { ran: 0, results: [] };

  const steps = (automation.steps ?? []) as unknown as AutomationStep[];
  const results: string[] = [];
  for (const step of steps) {
    try {
      results.push(`${STEP_LABELS[step.kind] ?? step.kind}: ${await executeStep(step, payload)}`);
    } catch (err) {
      logger.error({ err, automationId, step }, "automation step failed");
      results.push(`${step.kind}: échec`);
    }
  }
  await db
    .update(automations)
    .set({ lastRunAt: new Date() })
    .where(eq(automations.id, automationId));
  logger.info({ automationId, ran: results.length }, "automation executed");
  return { ran: results.length, results };
}
