"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole, requireUser } from "@/lib/auth/server";
import type { ActionResult } from "@/lib/crm/clients";
import { db } from "@/lib/db/client";
import { agencySettings } from "@/lib/db/schema";

const DEFAULT_SLUG = "default";

export async function getAgencySettings() {
  await requireUser();
  const [row] = await db
    .select()
    .from(agencySettings)
    .where(eq(agencySettings.slug, DEFAULT_SLUG))
    .limit(1);
  return row ?? null;
}

const settingsSchema = z.object({
  legalName: z.string().trim().min(1).max(200),
  tradingName: z.string().trim().max(200).optional().or(z.literal("")),
  legalStatus: z.string().trim().max(120).optional().or(z.literal("")),
  siret: z.string().trim().max(32).optional().or(z.literal("")),
  apeCode: z.string().trim().max(16).optional().or(z.literal("")),
  vatRegime: z.string().trim().max(200).optional().or(z.literal("")),
  vatNumber: z.string().trim().max(32).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  postalCode: z.string().trim().max(16).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  website: z.string().trim().url().optional().or(z.literal("")),
  iban: z.string().trim().max(64).optional().or(z.literal("")),
  bic: z.string().trim().max(16).optional().or(z.literal("")),
  jurisdiction: z.string().trim().max(200).optional().or(z.literal("")),
  brandColor: z.string().trim().max(16).optional().or(z.literal("")),
});

function nullify<T extends Record<string, unknown>>(obj: T): T {
  const out = {} as Record<string, unknown>;
  for (const [k, v] of Object.entries(obj)) {
    out[k] = v === "" ? null : v;
  }
  return out as T;
}

export async function updateAgencySettings(input: unknown): Promise<ActionResult> {
  await requireRole(["owner", "admin"]);
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const values = nullify(parsed.data);
  const [existing] = await db
    .select({ id: agencySettings.id })
    .from(agencySettings)
    .where(eq(agencySettings.slug, DEFAULT_SLUG))
    .limit(1);
  if (existing) {
    await db
      .update(agencySettings)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(agencySettings.id, existing.id));
  } else {
    await db.insert(agencySettings).values({ slug: DEFAULT_SLUG, ...values });
  }
  revalidatePath("/settings/billing");
  revalidatePath("/proposals");
  return { ok: true };
}
