"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/server";
import type { ActionResult } from "@/lib/crm/clients";
import { db } from "@/lib/db/client";
import { expenses, toolSubscriptions } from "@/lib/db/schema";

const expenseSchema = z.object({
  category: z.enum(["tool", "api", "salary", "marketing", "other"]),
  vendor: z.string().trim().max(120).optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  amount: z.coerce.number().min(0),
});

export async function addExpense(formData: FormData): Promise<ActionResult> {
  await requireRole(["owner", "admin"]);
  const parsed = expenseSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  await db.insert(expenses).values({
    category: parsed.data.category,
    vendor: parsed.data.vendor || null,
    description: parsed.data.description || null,
    amount: String(parsed.data.amount),
  });
  revalidatePath("/finance");
  revalidateTag("finance");
  return { ok: true };
}

const toolSchema = z.object({
  name: z.string().trim().min(1).max(120),
  vendor: z.string().trim().max(120).optional().or(z.literal("")),
  monthlyCost: z.coerce.number().min(0),
  seats: z.coerce.number().int().min(0).optional(),
});

export async function addToolSubscription(formData: FormData): Promise<ActionResult> {
  await requireRole(["owner", "admin"]);
  const parsed = toolSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  await db.insert(toolSubscriptions).values({
    name: parsed.data.name,
    vendor: parsed.data.vendor || null,
    monthlyCost: String(parsed.data.monthlyCost),
    seats: parsed.data.seats ?? null,
  });
  revalidatePath("/finance");
  revalidateTag("finance");
  return { ok: true };
}
