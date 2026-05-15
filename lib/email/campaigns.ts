"use server";

import { desc, eq, isNotNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/server";
import type { ActionResult } from "@/lib/crm/clients";
import { db } from "@/lib/db/client";
import { emailCampaigns, emailMessages, leads } from "@/lib/db/schema";
import { sendEmail } from "@/lib/integrations/resend/client";
import { FollowUpEmail } from "./templates/follow-up";

export async function getCampaigns() {
  return db.select().from(emailCampaigns).orderBy(desc(emailCampaigns.createdAt));
}

export async function getEmailMessages() {
  return db.select().from(emailMessages).orderBy(desc(emailMessages.createdAt)).limit(100);
}

const campaignSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(160),
  subject: z.string().trim().min(1, "Objet requis").max(200),
  message: z.string().trim().min(1, "Message requis").max(4000),
  scheduledAt: z.string().optional().or(z.literal("")),
});

export async function createCampaign(formData: FormData): Promise<ActionResult> {
  await requireRole(["owner", "admin", "manager", "sales"]);
  const parsed = campaignSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const scheduled = parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null;
  const [row] = await db
    .insert(emailCampaigns)
    .values({
      name: parsed.data.name,
      status: scheduled ? "scheduled" : "draft",
      scheduledAt: scheduled,
      audienceFilter: { subject: parsed.data.subject, message: parsed.data.message },
    })
    .returning({ id: emailCampaigns.id });
  revalidatePath("/campaigns");
  return { ok: true, id: row?.id };
}

export async function sendCampaign(id: string): Promise<ActionResult> {
  await requireRole(["owner", "admin", "manager", "sales"]);
  const [campaign] = await db
    .select()
    .from(emailCampaigns)
    .where(eq(emailCampaigns.id, id))
    .limit(1);
  if (!campaign) return { ok: false, error: "Campagne introuvable" };

  const filter = (campaign.audienceFilter ?? {}) as { subject?: string; message?: string };
  const subject = filter.subject ?? campaign.name;
  const message = filter.message ?? "";

  const recipients = await db.select().from(leads).where(isNotNull(leads.email));

  await db.update(emailCampaigns).set({ status: "sending" }).where(eq(emailCampaigns.id, id));

  let sent = 0;
  for (const lead of recipients) {
    if (!lead.email) continue;
    const name = `${lead.firstName ?? ""}`.trim() || lead.company || "bonjour";
    const res = await sendEmail({
      to: lead.email,
      subject,
      campaignId: id,
      leadId: lead.id,
      react: FollowUpEmail({ contactName: name, message }),
    });
    if (res.ok) sent += 1;
  }

  await db
    .update(emailCampaigns)
    .set({ status: "sent", sentCount: sent })
    .where(eq(emailCampaigns.id, id));
  revalidatePath("/campaigns");
  return { ok: true, id: String(sent) };
}
