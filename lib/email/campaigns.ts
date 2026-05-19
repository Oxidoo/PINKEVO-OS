"use server";

import { desc, eq, isNotNull, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/server";
import type { ActionResult } from "@/lib/crm/clients";
import { db } from "@/lib/db/client";
import { emailCampaigns, emailMessages, emailTemplates } from "@/lib/db/schema";
import { executeCampaignSend } from "./scheduled";

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

export async function sendCampaign(id: string): Promise<ActionResult> {
  const sender = await requireRole(["owner", "admin", "manager", "sales"]);
  const result = await executeCampaignSend(id, sender.emailSignature);
  revalidatePath("/campaigns");
  return result;
}

