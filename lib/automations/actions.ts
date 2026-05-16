"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/server";
import type { ActionResult } from "@/lib/crm/clients";
import { db } from "@/lib/db/client";
import { automations } from "@/lib/db/schema";
import { type AutomationStep, runAutomation } from "./engine";
import { getTemplate } from "./templates";

export async function getAutomations() {
  await requireRole(["owner", "admin", "manager"]);
  return db.select().from(automations).orderBy(desc(automations.createdAt));
}

export async function createFromTemplate(slug: string): Promise<ActionResult> {
  await requireRole(["owner", "admin", "manager"]);
  const tpl = getTemplate(slug);
  if (!tpl) return { ok: false, error: "Template inconnu" };
  const [row] = await db
    .insert(automations)
    .values({
      name: tpl.name,
      triggerType: tpl.triggerType,
      triggerConfig: { event: tpl.triggerEvent },
      steps: tpl.steps as unknown as Record<string, unknown>[],
      enabled: false,
    })
    .returning({ id: automations.id });
  revalidatePath("/automations");
  return { ok: true, id: row?.id };
}

const STEP_KINDS = [
  "qualify_lead",
  "audit_site",
  "send_followup",
  "create_client_from_lead",
  "onboarding_email",
] as const;

const customSchema = z.object({
  name: z.string().trim().min(1).max(160),
  triggerType: z.enum(["manual", "event", "cron"]),
  triggerEvent: z.string().trim().max(120).optional().or(z.literal("")),
  steps: z.array(z.enum(STEP_KINDS)).min(1).max(3),
});

export async function createAutomation(input: {
  name: string;
  triggerType: string;
  triggerEvent?: string;
  steps: string[];
}): Promise<ActionResult> {
  await requireRole(["owner", "admin", "manager"]);
  const parsed = customSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const steps: AutomationStep[] = parsed.data.steps.map((kind) => ({ kind }));
  const [row] = await db
    .insert(automations)
    .values({
      name: parsed.data.name,
      triggerType: parsed.data.triggerType,
      triggerConfig: parsed.data.triggerEvent ? { event: parsed.data.triggerEvent } : {},
      steps: steps as unknown as Record<string, unknown>[],
      enabled: false,
    })
    .returning({ id: automations.id });
  revalidatePath("/automations");
  return { ok: true, id: row?.id };
}

export async function toggleAutomation(id: string, enabled: boolean): Promise<ActionResult> {
  await requireRole(["owner", "admin", "manager"]);
  await db.update(automations).set({ enabled }).where(eq(automations.id, id));
  revalidatePath("/automations");
  return { ok: true };
}

export async function deleteAutomation(id: string): Promise<ActionResult> {
  await requireRole(["owner", "admin"]);
  await db.delete(automations).where(eq(automations.id, id));
  revalidatePath("/automations");
  return { ok: true };
}

export async function runAutomationNow(id: string): Promise<ActionResult> {
  await requireRole(["owner", "admin", "manager"]);
  if (process.env.INNGEST_EVENT_KEY) {
    const { inngest } = await import("@/lib/inngest/client");
    await inngest.send({ name: "automation/triggered", data: { automationId: id } });
  } else {
    await runAutomation(id, {});
  }
  revalidatePath("/automations");
  return { ok: true };
}
