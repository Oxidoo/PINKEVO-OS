"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole, requireUser } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import { deals } from "@/lib/db/schema";
import type { ActionResult } from "./clients";
import { dealInput, dealStageValues, STAGE_PROBABILITY } from "./validation";

export async function getDeals() {
  await requireUser();
  return db.select().from(deals).orderBy(desc(deals.createdAt)).limit(500);
}

export async function createDeal(formData: FormData): Promise<ActionResult> {
  const profile = await requireRole(["owner", "admin", "manager", "sales"]);
  const parsed = dealInput.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const { value, clientId, leadId, expectedCloseDate, ...rest } = parsed.data;
  const [row] = await db
    .insert(deals)
    .values({
      ...rest,
      value: String(value),
      clientId: clientId || null,
      leadId: leadId || null,
      expectedCloseDate: expectedCloseDate || null,
      ownerId: profile.id,
    })
    .returning({ id: deals.id });
  revalidatePath("/deals");
  return { ok: true, id: row?.id };
}

const stageSchema = z.object({
  id: z.string().uuid(),
  stage: z.enum(dealStageValues),
});

export async function updateDealStage(id: string, stage: string): Promise<ActionResult> {
  await requireRole(["owner", "admin", "manager", "sales"]);
  const parsed = stageSchema.safeParse({ id, stage });
  if (!parsed.success) return { ok: false, error: "Étape invalide" };
  await db
    .update(deals)
    .set({
      stage: parsed.data.stage,
      probability: STAGE_PROBABILITY[parsed.data.stage],
    })
    .where(eq(deals.id, parsed.data.id));

  if (parsed.data.stage === "won") {
    const [deal] = await db.select().from(deals).where(eq(deals.id, parsed.data.id)).limit(1);
    const { dispatchAutomationEvent } = await import("@/lib/automations/dispatch");
    await dispatchAutomationEvent("pinkevo/deal.won", {
      leadId: deal?.leadId ?? undefined,
      clientId: deal?.clientId ?? undefined,
    });
  }

  revalidatePath("/deals");
  return { ok: true };
}

export async function deleteDeal(id: string): Promise<ActionResult> {
  await requireRole(["owner", "admin"]);
  await db.delete(deals).where(eq(deals.id, id));
  revalidatePath("/deals");
  return { ok: true };
}
