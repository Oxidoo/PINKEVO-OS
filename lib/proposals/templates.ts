"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole, requireUser } from "@/lib/auth/server";
import type { ActionResult } from "@/lib/crm/clients";
import { db } from "@/lib/db/client";
import { proposalTemplates } from "@/lib/db/schema";

const lineItemSchema = z.object({
  label: z.string().trim().min(1).max(200),
  frequency: z.string().trim().min(1).max(40),
  unitPrice: z.coerce.number().min(0),
  group: z.enum(["setup", "recurring"]),
});

const deliverableGroupSchema = z.object({
  service: z.string().trim().min(1).max(80),
  items: z.array(z.string().trim().min(1)).min(1),
  frequency: z.string().trim().min(1).max(80),
});

const additionalSectionSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1),
});

const sectionsSchema = z.object({
  title: z.string().min(1).max(200),
  subtitle: z.string().max(200).optional().or(z.literal("")),
  objectDescription: z.string().min(1),
  lineItems: z.array(lineItemSchema).min(1),
  deliverables: z.array(deliverableGroupSchema).min(1),
  conditionsEngagement: z.string().min(1),
  conditionsBilling: z.string().min(1),
  conditionsPriceRevision: z.string().min(1),
  conditionsClientObligations: z.string().min(1),
  additionalSections: z.array(additionalSectionSchema).optional().default([]),
});

const templateSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(96)
    .regex(/^[a-z0-9-]+$/, "Slug : minuscules, chiffres, tirets uniquement"),
  name: z.string().min(1).max(160),
  description: z.string().optional().or(z.literal("")),
  sections: sectionsSchema,
});

const VARIABLE_REGEX = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

function extractVariables(input: z.infer<typeof sectionsSchema>): string[] {
  const parts: string[] = [
    input.title,
    input.subtitle ?? "",
    input.objectDescription,
    input.conditionsEngagement,
    input.conditionsBilling,
    input.conditionsPriceRevision,
    input.conditionsClientObligations,
  ];
  for (const li of input.lineItems) parts.push(li.label);
  for (const d of input.deliverables) {
    parts.push(d.service, d.frequency, ...d.items);
  }
  for (const s of input.additionalSections ?? []) parts.push(s.title, s.body);
  const found = new Set<string>();
  for (const m of parts.join(" ").matchAll(VARIABLE_REGEX)) {
    if (m[1]) found.add(m[1]);
  }
  return [...found].sort();
}

export async function getProposalTemplates() {
  await requireUser();
  return db.select().from(proposalTemplates).orderBy(desc(proposalTemplates.createdAt));
}

export async function getProposalTemplate(id: string) {
  await requireUser();
  const [row] = await db
    .select()
    .from(proposalTemplates)
    .where(eq(proposalTemplates.id, id))
    .limit(1);
  return row ?? null;
}

export async function createProposalTemplate(input: unknown): Promise<ActionResult> {
  await requireRole(["owner", "admin", "manager", "sales"]);
  const parsed = templateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const { slug, name, description, sections } = parsed.data;
  try {
    const [row] = await db
      .insert(proposalTemplates)
      .values({
        slug,
        name,
        description: description || null,
        sections: { ...sections, additionalSections: sections.additionalSections ?? [] },
        variables: extractVariables(sections),
      })
      .returning({ id: proposalTemplates.id });
    revalidatePath("/proposals/templates");
    revalidatePath("/proposals");
    return { ok: true, id: row?.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Échec de la création" };
  }
}

export async function updateProposalTemplate(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  await requireRole(["owner", "admin", "manager", "sales"]);
  const parsed = templateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const { slug, name, description, sections } = parsed.data;
  await db
    .update(proposalTemplates)
    .set({
      slug,
      name,
      description: description || null,
      sections: { ...sections, additionalSections: sections.additionalSections ?? [] },
      variables: extractVariables(sections),
      updatedAt: new Date(),
    })
    .where(eq(proposalTemplates.id, id));
  revalidatePath("/proposals/templates");
  revalidatePath(`/proposals/templates/${id}`);
  revalidatePath("/proposals");
  return { ok: true, id };
}

export async function deleteProposalTemplate(id: string): Promise<ActionResult> {
  await requireRole(["owner", "admin"]);
  await db.delete(proposalTemplates).where(eq(proposalTemplates.id, id));
  revalidatePath("/proposals/templates");
  revalidatePath("/proposals");
  return { ok: true };
}
