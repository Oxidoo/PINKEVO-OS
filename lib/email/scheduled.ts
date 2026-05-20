import "server-only";
import { and, eq, isNotNull, lte } from "drizzle-orm";
import type { ActionResult } from "@/lib/crm/clients";
import { db } from "@/lib/db/client";
import { emailCampaigns, leads } from "@/lib/db/schema";
import { sendEmail } from "@/lib/integrations/resend/client";
import { logger } from "@/lib/logger";
import { FollowUpEmail } from "./templates/follow-up";

function interpolate(
  text: string,
  lead: {
    firstName?: string | null;
    lastName?: string | null;
    company?: string | null;
    email?: string | null;
    category?: string | null;
    sector?: string | null;
  },
): string {
  return text
    .replace(/\{\{prénom\}\}/gi, lead.firstName ?? "")
    .replace(/\{\{nom\}\}/gi, lead.lastName ?? "")
    .replace(/\{\{société\}\}/gi, lead.company ?? "")
    .replace(/\{\{email\}\}/gi, lead.email ?? "")
    .replace(/\{\{catégorie\}\}/gi, lead.category ?? "")
    .replace(/\{\{secteur\}\}/gi, lead.sector ?? "");
}

/** Core send logic — no auth, no revalidatePath. Safe to call from cron or actions. */
export async function executeCampaignSend(
  id: string,
  liveSignature?: string | null,
): Promise<ActionResult> {
  const [campaign] = await db
    .select()
    .from(emailCampaigns)
    .where(eq(emailCampaigns.id, id))
    .limit(1);
  if (!campaign) return { ok: false, error: "Campagne introuvable" };

  const filter = (campaign.audienceFilter ?? {}) as {
    subject?: string;
    message?: string;
    category?: string;
    sector?: string;
    signature?: string;
  };
  const subject = filter.subject ?? campaign.name;
  const message = filter.message ?? "";
  const signature = liveSignature ?? filter.signature ?? undefined;

  const conditions = [isNotNull(leads.email)];
  if (filter.category) conditions.push(eq(leads.category, filter.category));
  if (filter.sector) conditions.push(eq(leads.sector, filter.sector));

  const recipients = await db
    .select()
    .from(leads)
    .where(and(...conditions));

  await db.update(emailCampaigns).set({ status: "sending" }).where(eq(emailCampaigns.id, id));

  let sent = 0;
  for (const lead of recipients) {
    if (!lead.email) continue;
    const res = await sendEmail({
      to: lead.email,
      subject: interpolate(subject, lead),
      campaignId: id,
      leadId: lead.id,
      react: FollowUpEmail({
        message: interpolate(message, lead),
        signature,
      }),
    });
    if (res.ok) sent += 1;
  }

  await db
    .update(emailCampaigns)
    .set({ status: "sent", sentCount: sent })
    .where(eq(emailCampaigns.id, id));
  return { ok: true, id: String(sent) };
}

/** Cron entrypoint: send every scheduled campaign whose time has come. */
export async function runScheduledCampaigns(): Promise<{ due: number; sent: number }> {
  const due = await db
    .select({ id: emailCampaigns.id })
    .from(emailCampaigns)
    .where(
      and(
        eq(emailCampaigns.status, "scheduled"),
        isNotNull(emailCampaigns.scheduledAt),
        lte(emailCampaigns.scheduledAt, new Date()),
      ),
    );

  let count = 0;
  for (const c of due) {
    const res = await executeCampaignSend(c.id);
    if (res.ok) count += 1;
  }
  logger.info({ due: due.length, sent: count }, "scheduled campaigns processed");
  return { due: due.length, sent: count };
}
