"use server";

import { and, asc, desc, eq, isNotNull, isNull, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/server";
import type { ActionResult } from "@/lib/crm/clients";
import { db } from "@/lib/db/client";
import { emailCampaigns, emailMessages, emailTemplates, leads } from "@/lib/db/schema";
import { sendEmail } from "@/lib/integrations/resend/client";
import { FollowUpEmail } from "./templates/follow-up";

export async function getCampaigns() {
  return db
    .select()
    .from(emailCampaigns)
    .where(isNull(emailCampaigns.archivedAt))
    .orderBy(desc(emailCampaigns.createdAt));
}

export async function getArchivedCampaigns() {
  return db
    .select()
    .from(emailCampaigns)
    .where(isNotNull(emailCampaigns.archivedAt))
    .orderBy(desc(emailCampaigns.archivedAt));
}

export async function archiveCampaign(id: string): Promise<ActionResult> {
  await requireRole(["owner", "admin", "manager", "sales"]);
  await db
    .update(emailCampaigns)
    .set({ archivedAt: new Date() })
    .where(eq(emailCampaigns.id, id));
  revalidatePath("/campaigns");
  return { ok: true };
}

export async function unarchiveCampaign(id: string): Promise<ActionResult> {
  await requireRole(["owner", "admin", "manager", "sales"]);
  await db
    .update(emailCampaigns)
    .set({ archivedAt: null })
    .where(eq(emailCampaigns.id, id));
  revalidatePath("/campaigns");
  return { ok: true };
}

export async function deleteCampaign(id: string): Promise<ActionResult> {
  await requireRole(["owner", "admin", "manager"]);
  await db.delete(emailCampaigns).where(eq(emailCampaigns.id, id));
  revalidatePath("/campaigns");
  return { ok: true };
}

export async function getEmailMessages() {
  return db.select().from(emailMessages).orderBy(desc(emailMessages.createdAt)).limit(100);
}

export async function getEmailTemplates() {
  return db.select().from(emailTemplates).orderBy(desc(emailTemplates.createdAt));
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const templateSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(160),
  subject: z.string().trim().min(1, "Objet requis").max(200),
  body: z.string().trim().min(1, "Corps requis").max(10000),
  category: z
    .enum(["outreach", "follow_up", "proposal", "invoice", "transactional"])
    .default("outreach"),
});

export async function createEmailTemplate(formData: FormData): Promise<ActionResult> {
  await requireRole(["owner", "admin", "manager", "sales"]);
  const parsed = templateSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const { name, subject, body, category } = parsed.data;
  const slug = `${slugify(name)}-${Date.now()}`;

  // Extract variables used in subject + body
  const variableRegex = /\{\{[^}]+\}\}/gi;
  const usedVars = Array.from(new Set([
    ...(subject.match(variableRegex) ?? []),
    ...(body.match(variableRegex) ?? []),
  ]));

  await db.insert(emailTemplates).values({
    slug,
    name,
    subject,
    bodyHtml: body,
    bodyText: body,
    category,
    variables: usedVars,
  });

  revalidatePath("/campaigns");
  return { ok: true };
}

export async function updateEmailTemplate(id: string, formData: FormData): Promise<ActionResult> {
  await requireRole(["owner", "admin", "manager", "sales"]);
  const parsed = templateSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const { name, subject, body, category } = parsed.data;

  const variableRegex = /\{\{[^}]+\}\}/gi;
  const usedVars = Array.from(new Set([
    ...(subject.match(variableRegex) ?? []),
    ...(body.match(variableRegex) ?? []),
  ]));

  await db
    .update(emailTemplates)
    .set({ name, subject, bodyHtml: body, bodyText: body, category, variables: usedVars })
    .where(eq(emailTemplates.id, id));

  revalidatePath("/campaigns");
  return { ok: true };
}

export async function deleteEmailTemplate(id: string): Promise<ActionResult> {
  await requireRole(["owner", "admin", "manager", "sales"]);
  await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
  revalidatePath("/campaigns");
  return { ok: true };
}

const campaignSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(160),
  subject: z.string().trim().min(1, "Objet requis").max(200),
  message: z.string().trim().min(1, "Message requis").max(4000),
  scheduledAt: z.string().optional().or(z.literal("")),
  category: z.string().optional().or(z.literal("")),
  sector: z.string().optional().or(z.literal("")),
  templateId: z.string().optional().or(z.literal("")),
});

export async function createCampaign(formData: FormData): Promise<ActionResult> {
  const creator = await requireRole(["owner", "admin", "manager", "sales"]);
  const parsed = campaignSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const scheduled = parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null;
  const audienceFilter: Record<string, unknown> = {
    subject: parsed.data.subject,
    message: parsed.data.message,
  };
  if (parsed.data.category) audienceFilter.category = parsed.data.category;
  if (parsed.data.sector) audienceFilter.sector = parsed.data.sector;
  // Snapshot the creator's signature so scheduled sends (no logged-in user) keep it.
  if (creator.emailSignature) audienceFilter.signature = creator.emailSignature;

  const [row] = await db
    .insert(emailCampaigns)
    .values({
      name: parsed.data.name,
      status: scheduled ? "scheduled" : "draft",
      scheduledAt: scheduled,
      audienceFilter,
      templateId: parsed.data.templateId || null,
    })
    .returning({ id: emailCampaigns.id });
  revalidatePath("/campaigns");
  return { ok: true, id: row?.id };
}

function interpolate(text: string, lead: {
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  email?: string | null;
  category?: string | null;
  sector?: string | null;
}): string {
  return text
    .replace(/\{\{prénom\}\}/gi, lead.firstName ?? "")
    .replace(/\{\{nom\}\}/gi, lead.lastName ?? "")
    .replace(/\{\{société\}\}/gi, lead.company ?? "")
    .replace(/\{\{email\}\}/gi, lead.email ?? "")
    .replace(/\{\{catégorie\}\}/gi, lead.category ?? "")
    .replace(/\{\{secteur\}\}/gi, lead.sector ?? "");
}

/** Core send logic — no auth. Used by the manual action and the scheduled cron. */
async function executeCampaignSend(
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

  const recipients = await db.select().from(leads).where(and(...conditions));

  await db.update(emailCampaigns).set({ status: "sending" }).where(eq(emailCampaigns.id, id));

  let sent = 0;
  for (const lead of recipients) {
    if (!lead.email) continue;
    const name = `${lead.firstName ?? ""}`.trim() || lead.company || "bonjour";
    const res = await sendEmail({
      to: lead.email,
      subject: interpolate(subject, lead),
      campaignId: id,
      leadId: lead.id,
      react: FollowUpEmail({
        contactName: name,
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
  revalidatePath("/campaigns");
  return { ok: true, id: String(sent) };
}

export async function sendCampaign(id: string): Promise<ActionResult> {
  const sender = await requireRole(["owner", "admin", "manager", "sales"]);
  return executeCampaignSend(id, sender.emailSignature);
}

/** Cron entrypoint: send every scheduled campaign whose time has come. */
export async function runScheduledCampaigns(): Promise<{ sent: number }> {
  const due = await db
    .select({ id: emailCampaigns.id })
    .from(emailCampaigns)
    .where(
      and(
        eq(emailCampaigns.status, "scheduled"),
        isNull(emailCampaigns.archivedAt),
        isNotNull(emailCampaigns.scheduledAt),
        lte(emailCampaigns.scheduledAt, new Date()),
      ),
    );

  let count = 0;
  for (const c of due) {
    const res = await executeCampaignSend(c.id);
    if (res.ok) count += 1;
  }
  return { sent: count };
}
