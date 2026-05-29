"use server";

import { desc, eq, inArray, isNotNull, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole, requireUser } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import { clients, leadContacts, leads } from "@/lib/db/schema";
import type { LeadContact } from "@/lib/db/schema";
import type { ActionResult } from "./clients";
import { leadInput, leadStatusValues } from "./validation";

export async function getLeads() {
  await requireUser();
  return db.select().from(leads).orderBy(desc(leads.createdAt)).limit(500);
}

export async function createLead(formData: FormData): Promise<ActionResult> {
  const profile = await requireRole(["owner", "admin", "manager", "sales"]);
  const parsed = leadInput.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const { email, ...rest } = parsed.data;
  const [row] = await db
    .insert(leads)
    .values({ ...rest, email: email || null, assignedTo: profile.id })
    .returning({ id: leads.id });

  if (row?.id) {
    // Auto-enrich in background via Inngest; dispatch automation event inline.
    const { inngest } = await import("@/lib/inngest/client");
    inngest.send({ name: "pinkevo/lead.created", data: { leadId: row.id } }).catch(() => {});
    const { dispatchAutomationEvent } = await import("@/lib/automations/dispatch");
    dispatchAutomationEvent("pinkevo/lead.created", { leadId: row.id }).catch(() => {});
  }

  revalidatePath("/leads");
  return { ok: true, id: row?.id };
}

const statusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(leadStatusValues),
});

export async function updateLeadStatus(id: string, status: string): Promise<ActionResult> {
  await requireRole(["owner", "admin", "manager", "sales"]);
  const parsed = statusSchema.safeParse({ id, status });
  if (!parsed.success) return { ok: false, error: "Statut invalide" };
  await db
    .update(leads)
    .set({
      status: parsed.data.status,
      lastContactedAt: parsed.data.status === "contacted" ? new Date() : undefined,
    })
    .where(eq(leads.id, parsed.data.id));
  revalidatePath("/leads");
  return { ok: true };
}

export async function enrichLead(id: string): Promise<ActionResult> {
  await requireRole(["owner", "admin", "manager", "sales"]);
  const { enrichLeadCore } = await import("./enrich-core");
  const result = await enrichLeadCore(id);
  if (!result.ok) {
    const msgs: Record<string, string> = {
      not_found: "Lead introuvable",
      no_query: "Aucune entreprise à enrichir",
      no_results: "Aucun résultat Pappers",
    };
    return { ok: false, error: msgs[result.reason ?? ""] ?? "Erreur d'enrichissement" };
  }
  revalidatePath("/leads");
  return { ok: true };
}

const csvRowSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
});

export async function importLeadsCsv(rows: unknown[]): Promise<ActionResult> {
  const profile = await requireRole(["owner", "admin", "manager", "sales"]);
  const valid = rows
    .map((r) => csvRowSchema.safeParse(r))
    .filter((r): r is z.ZodSafeParseSuccess<z.infer<typeof csvRowSchema>> => r.success)
    .map((r) => ({
      firstName: r.data.firstName || null,
      lastName: r.data.lastName || null,
      email: r.data.email || null,
      phone: r.data.phone || null,
      company: r.data.company || null,
      source: "csv" as const,
      status: "new" as const,
      assignedTo: profile.id,
    }))
    .filter((r) => r.email || r.company || r.lastName);

  if (valid.length === 0) {
    return { ok: false, error: "Aucune ligne valide dans le CSV" };
  }
  const inserted = await db.insert(leads).values(valid).returning({ id: leads.id });
  const { dispatchAutomationEvent } = await import("@/lib/automations/dispatch");
  for (const row of inserted.slice(0, 50)) {
    await dispatchAutomationEvent("pinkevo/lead.created", { leadId: row.id });
  }
  revalidatePath("/leads");
  return { ok: true, id: String(valid.length) };
}

const richCsvRowSchema = z.object({
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  phone: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  enrichmentData: z.record(z.string(), z.string()).optional(),
});

export async function deleteLead(id: string): Promise<ActionResult> {
  await requireRole(["owner", "admin", "manager", "sales"]);
  await db.delete(leads).where(eq(leads.id, id));
  revalidatePath("/leads");
  return { ok: true };
}

export async function bulkDeleteLeads(ids: string[]): Promise<ActionResult> {
  if (ids.length === 0) return { ok: false, error: "Aucun lead sélectionné" };
  await requireRole(["owner", "admin", "manager", "sales"]);
  await db.delete(leads).where(inArray(leads.id, ids));
  revalidatePath("/leads");
  return { ok: true, id: String(ids.length) };
}

export async function importLeadsFromCsv(
  rows: unknown[],
  defaults: { category?: string; sector?: string; zone?: string },
): Promise<ActionResult> {
  const profile = await requireRole(["owner", "admin", "manager", "sales"]);

  const valid = rows
    .map((r) => richCsvRowSchema.safeParse(r))
    .filter((r): r is z.ZodSafeParseSuccess<z.infer<typeof richCsvRowSchema>> => r.success)
    .map((r) => ({
      firstName: r.data.firstName || null,
      lastName: r.data.lastName || null,
      email: r.data.email || null,
      phone: r.data.phone || null,
      company: r.data.company || null,
      enrichmentData:
        r.data.enrichmentData && Object.keys(r.data.enrichmentData).length > 0
          ? r.data.enrichmentData
          : null,
    }))
    .filter((r) => r.email || r.company || r.lastName);

  if (valid.length === 0) return { ok: false, error: "Aucune ligne valide dans le CSV" };

  const existing = await db
    .select({ email: leads.email, phone: leads.phone })
    .from(leads)
    .where(or(isNotNull(leads.email), isNotNull(leads.phone)));

  const existingEmails = new Set(
    existing.map((l: { email: string | null; phone: string | null }) => l.email).filter(Boolean),
  );
  const existingPhones = new Set(
    existing.map((l: { email: string | null; phone: string | null }) => l.phone).filter(Boolean),
  );

  const deduped = valid.filter((r) => {
    if (r.email && existingEmails.has(r.email)) return false;
    if (r.phone && existingPhones.has(r.phone)) return false;
    return true;
  });

  const skipped = valid.length - deduped.length;
  if (deduped.length === 0)
    return { ok: false, error: `Tous les leads existent déjà (${skipped} doublons ignorés)` };

  const toInsert = deduped.map((r) => ({
    ...r,
    category: defaults.category || null,
    sector: defaults.sector || null,
    zone: defaults.zone || null,
    source: "csv" as const,
    status: "new" as const,
    assignedTo: profile.id,
  }));

  const inserted = await db.insert(leads).values(toInsert).returning({ id: leads.id });
  const { dispatchAutomationEvent } = await import("@/lib/automations/dispatch");
  for (const row of inserted.slice(0, 50)) {
    await dispatchAutomationEvent("pinkevo/lead.created", { leadId: row.id });
  }
  revalidatePath("/leads");
  return { ok: true, id: JSON.stringify({ imported: deduped.length, skipped }) };
}

const contactMethodSchema = z.object({
  id: z.string().uuid(),
  method: z.enum(["sms", "email", "call"]),
  note: z.string().max(1000).optional(),
  followupAt: z.coerce.date().optional(),
});

export async function contactLead(
  id: string,
  method: string,
  note: string,
  followupAt?: string | null,
): Promise<ActionResult> {
  const profile = await requireRole(["owner", "admin", "manager", "sales"]);
  const parsed = contactMethodSchema.safeParse({
    id,
    method,
    note: note || undefined,
    followupAt: followupAt || undefined,
  });
  if (!parsed.success) return { ok: false, error: "Données invalides" };

  const now = new Date();
  await db.insert(leadContacts).values({
    leadId: parsed.data.id,
    method: parsed.data.method,
    note: parsed.data.note ?? null,
    contactedAt: now,
    followupAt: parsed.data.followupAt ?? null,
    createdBy: profile.id,
  });

  await db
    .update(leads)
    .set({ status: "contacted", lastContactedAt: now })
    .where(eq(leads.id, parsed.data.id));

  revalidatePath("/leads");
  return { ok: true };
}

export async function getLeadContacts(id: string): Promise<LeadContact[]> {
  await requireUser();
  return db
    .select()
    .from(leadContacts)
    .where(eq(leadContacts.leadId, id))
    .orderBy(desc(leadContacts.contactedAt));
}

export async function updateLeadContactNote(
  contactId: string,
  note: string,
  followupAt?: string | null,
): Promise<ActionResult> {
  await requireRole(["owner", "admin", "manager", "sales"]);
  if (note.length > 1000) return { ok: false, error: "Note trop longue" };
  const followup = followupAt ? new Date(followupAt) : null;
  if (followup && Number.isNaN(followup.getTime())) {
    return { ok: false, error: "Date invalide" };
  }
  await db
    .update(leadContacts)
    .set({ note: note.trim() || null, followupAt: followup })
    .where(eq(leadContacts.id, contactId));
  revalidatePath("/leads");
  return { ok: true };
}

export async function getUpcomingFollowups(): Promise<
  { leadId: string; followupAt: Date; note: string | null; contactId: string }[]
> {
  await requireUser();
  const rows = await db
    .select({
      id: leadContacts.id,
      leadId: leadContacts.leadId,
      followupAt: leadContacts.followupAt,
      note: leadContacts.note,
    })
    .from(leadContacts)
    .where(isNotNull(leadContacts.followupAt))
    .orderBy(leadContacts.followupAt);
  // Garder le rappel futur le plus proche par lead
  const byLead = new Map<string, { leadId: string; followupAt: Date; note: string | null; contactId: string }>();
  const now = Date.now();
  for (const r of rows) {
    if (!r.followupAt) continue;
    if (r.followupAt.getTime() < now) continue;
    const existing = byLead.get(r.leadId);
    if (!existing || r.followupAt.getTime() < existing.followupAt.getTime()) {
      byLead.set(r.leadId, {
        leadId: r.leadId,
        followupAt: r.followupAt,
        note: r.note,
        contactId: r.id,
      });
    }
  }
  return [...byLead.values()].sort((a, b) => a.followupAt.getTime() - b.followupAt.getTime());
}

export async function convertLeadToClient(id: string): Promise<ActionResult> {
  const profile = await requireRole(["owner", "admin", "manager", "sales"]);
  const [lead] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  if (!lead) return { ok: false, error: "Lead introuvable" };

  const name =
    lead.company ?? (`${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim() || "Sans nom");
  const [client] = await db
    .insert(clients)
    .values({
      name,
      company: lead.company,
      status: "active",
      ownerId: profile.id,
      acquiredAt: new Date(),
    })
    .returning({ id: clients.id });

  await db
    .update(leads)
    .set({ status: "converted", convertedToClientId: client?.id })
    .where(eq(leads.id, id));
  revalidatePath("/leads");
  revalidatePath("/clients");
  return { ok: true, id: client?.id };
}
