"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole, requireUser } from "@/lib/auth/server";
import type { ActionResult } from "@/lib/crm/clients";
import { db } from "@/lib/db/client";
import { clients, leads, proposalTemplates, proposals } from "@/lib/db/schema";

export async function getProposals() {
  await requireUser();
  return db.select().from(proposals).orderBy(desc(proposals.createdAt));
}

/** Ensure a proposal has a public signature token; returns it. */
export async function ensureProposalToken(id: string): Promise<string | null> {
  await requireUser();
  const [p] = await db.select().from(proposals).where(eq(proposals.id, id)).limit(1);
  if (!p) return null;
  if (p.signatureToken) return p.signatureToken;
  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  await db.update(proposals).set({ signatureToken: token }).where(eq(proposals.id, id));
  revalidatePath("/proposals");
  return token;
}

function newToken(): string {
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
}

const createSchema = z.object({
  templateId: z.string().uuid(),
  clientId: z.string().uuid().optional().or(z.literal("")),
  leadId: z.string().uuid().optional().or(z.literal("")),
  totalSetup: z.coerce.number().min(0),
  totalRecurring: z.coerce.number().min(0),
  paymentLinkUrl: z.string().url().optional().or(z.literal("")),
  paymentLinkLabel: z.string().max(200).optional().or(z.literal("")),
  // valeurs additionnelles pour remplacer les variables du template
  variables: z.record(z.string(), z.string()).default({}),
});

function substitute(text: string, values: Record<string, string>): string {
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k: string) => values[k] ?? `{{${k}}}`);
}

function substituteSections(
  sections: {
    title: string;
    context: string;
    objectives: string[];
    deliverables: string[];
    timeline: string;
    conditions: string;
  },
  values: Record<string, string>,
) {
  return {
    title: substitute(sections.title, values),
    context: substitute(sections.context, values),
    objectives: sections.objectives.map((o) => substitute(o, values)),
    deliverables: sections.deliverables.map((d) => substitute(d, values)),
    timeline: substitute(sections.timeline, values),
    conditions: substitute(sections.conditions, values),
  };
}

/** Crée un devis à partir d'un template avec substitution des variables. */
export async function createProposalFromTemplate(input: unknown): Promise<ActionResult> {
  await requireRole(["owner", "admin", "manager", "sales"]);
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const data = parsed.data;
  const [tpl] = await db
    .select()
    .from(proposalTemplates)
    .where(eq(proposalTemplates.id, data.templateId))
    .limit(1);
  if (!tpl) return { ok: false, error: "Template introuvable" };

  // Hydrate variables auto à partir du client/lead si présents
  const autoValues: Record<string, string> = {
    ...data.variables,
    date: new Date().toLocaleDateString("fr-FR"),
    prix_setup: String(data.totalSetup),
    prix_mensuel: String(data.totalRecurring),
  };
  if (data.clientId) {
    const [c] = await db.select().from(clients).where(eq(clients.id, data.clientId)).limit(1);
    if (c) {
      autoValues.client = c.name;
      autoValues.societe = c.company ?? c.name;
    }
  } else if (data.leadId) {
    const [l] = await db.select().from(leads).where(eq(leads.id, data.leadId)).limit(1);
    if (l) {
      autoValues.client = `${l.firstName ?? ""} ${l.lastName ?? ""}`.trim() || l.company || "client";
      autoValues.prenom = l.firstName ?? "";
      autoValues.societe = l.company ?? "";
    }
  }

  const filled = substituteSections(tpl.sections, autoValues);

  const [row] = await db
    .insert(proposals)
    .values({
      templateId: tpl.id,
      clientId: data.clientId || null,
      leadId: data.leadId || null,
      title: filled.title,
      content: filled,
      totalSetup: String(data.totalSetup),
      totalRecurring: String(data.totalRecurring),
      paymentLinkUrl: data.paymentLinkUrl || null,
      paymentLinkLabel: data.paymentLinkLabel || null,
      status: "draft",
      signatureToken: newToken(),
    })
    .returning({ id: proposals.id });

  revalidatePath("/proposals");
  return { ok: true, id: row?.id };
}

/** Marque le devis comme envoyé (sentAt = now) — l'envoi se fait manuellement via le lien public. */
export async function markProposalSent(id: string): Promise<ActionResult> {
  await requireRole(["owner", "admin", "manager", "sales"]);
  await db
    .update(proposals)
    .set({ status: "sent", sentAt: new Date() })
    .where(eq(proposals.id, id));
  revalidatePath("/proposals");
  revalidatePath(`/proposals/${id}`);
  return { ok: true };
}

export async function deleteProposal(id: string): Promise<ActionResult> {
  await requireRole(["owner", "admin"]);
  await db.delete(proposals).where(eq(proposals.id, id));
  revalidatePath("/proposals");
  return { ok: true };
}
