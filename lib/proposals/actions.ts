"use server";

import { and, desc, eq, like, sql } from "drizzle-orm";
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

/**
 * Retourne la liste des devis avec le nom du client/lead associé pour
 * affichage dans la table principale.
 */
export async function getProposalsWithRecipient() {
  await requireUser();
  const rows = await db.select().from(proposals).orderBy(desc(proposals.createdAt));
  const clientIds = [...new Set(rows.map((r) => r.clientId).filter((id): id is string => !!id))];
  const leadIds = [...new Set(rows.map((r) => r.leadId).filter((id): id is string => !!id))];
  const [cls, lds] = await Promise.all([
    clientIds.length
      ? db
          .select({ id: clients.id, name: clients.name })
          .from(clients)
          .where(sql`${clients.id} = any(${clientIds})`)
      : Promise.resolve([]),
    leadIds.length
      ? db
          .select({
            id: leads.id,
            firstName: leads.firstName,
            lastName: leads.lastName,
            company: leads.company,
            email: leads.email,
          })
          .from(leads)
          .where(sql`${leads.id} = any(${leadIds})`)
      : Promise.resolve([]),
  ]);
  const clientMap = new Map(cls.map((c) => [c.id, c.name]));
  const leadMap = new Map(
    lds.map((l) => {
      const n = `${l.firstName ?? ""} ${l.lastName ?? ""}`.trim();
      return [l.id, n || l.company || l.email || "Lead sans nom"];
    }),
  );
  return rows.map((r) => ({
    ...r,
    recipient: r.clientId
      ? (clientMap.get(r.clientId) ?? "Client supprimé")
      : r.leadId
        ? (leadMap.get(r.leadId) ?? "Lead supprimé")
        : "—",
  }));
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

/** Génère un numéro de devis unique au format DEV-YYYY-NNN incrémenté par année. */
async function nextProposalNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `DEV-${year}-`;
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(proposals)
    .where(and(like(proposals.number, `${prefix}%`)));
  const seq = String((row?.count ?? 0) + 1).padStart(3, "0");
  return `${prefix}${seq}`;
}

const lineItemInputSchema = z.object({
  label: z.string().trim().min(1),
  frequency: z.string().trim().min(1),
  unitPrice: z.coerce.number().min(0),
  group: z.enum(["setup", "recurring"]),
});

const createSchema = z.object({
  templateId: z.string().uuid(),
  clientId: z.string().uuid().optional().or(z.literal("")),
  leadId: z.string().uuid().optional().or(z.literal("")),
  /** Lignes du tableau financier (peuvent surcharger celles du template). */
  lineItems: z.array(lineItemInputSchema).optional(),
  paymentLinkUrl: z.string().url().optional().or(z.literal("")),
  paymentLinkLabel: z.string().max(200).optional().or(z.literal("")),
  variables: z.record(z.string(), z.string()).default({}),
});

function substitute(text: string, values: Record<string, string>): string {
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k: string) => values[k] ?? `{{${k}}}`);
}

function substituteSections<T>(sections: T, values: Record<string, string>): T {
  if (typeof sections === "string") return substitute(sections, values) as T;
  if (Array.isArray(sections)) return sections.map((s) => substituteSections(s, values)) as T;
  if (sections && typeof sections === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(sections)) {
      out[k] = substituteSections(v, values);
    }
    return out as T;
  }
  return sections;
}

function sumByGroup(
  items: { unitPrice: number; group: "setup" | "recurring" }[],
  group: "setup" | "recurring",
) {
  return items.filter((i) => i.group === group).reduce((s, i) => s + Number(i.unitPrice), 0);
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

  // Utilise les lineItems fournis sinon ceux du template
  const lineItems = data.lineItems ?? tpl.sections.lineItems;

  const totalSetup = sumByGroup(lineItems, "setup");
  const totalRecurring = sumByGroup(lineItems, "recurring");

  // Hydrate variables auto
  const autoValues: Record<string, string> = {
    ...data.variables,
    date: new Date().toLocaleDateString("fr-FR"),
    prix_setup: String(totalSetup),
    prix_mensuel: String(totalRecurring),
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

  const filledSections = substituteSections({ ...tpl.sections, lineItems }, autoValues);
  const number = await nextProposalNumber();

  const [row] = await db
    .insert(proposals)
    .values({
      number,
      templateId: tpl.id,
      clientId: data.clientId || null,
      leadId: data.leadId || null,
      title:
        (filledSections as { title?: string }).title ??
        substitute(tpl.sections.title, autoValues),
      content: filledSections as Record<string, unknown>,
      totalSetup: String(totalSetup),
      totalRecurring: String(totalRecurring),
      paymentLinkUrl: data.paymentLinkUrl || null,
      paymentLinkLabel: data.paymentLinkLabel || null,
      status: "draft",
      signatureToken: newToken(),
    })
    .returning({ id: proposals.id });

  revalidatePath("/proposals");
  return { ok: true, id: row?.id };
}

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
