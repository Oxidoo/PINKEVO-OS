"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import { contacts } from "@/lib/db/schema";
import type { ActionResult } from "./clients";
import { contactInput } from "./validation";

export async function createContact(formData: FormData): Promise<ActionResult> {
  await requireRole(["owner", "admin", "manager", "sales"]);
  const parsed = contactInput.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const { email, linkedinUrl, ...rest } = parsed.data;
  const [row] = await db
    .insert(contacts)
    .values({ ...rest, email: email || null, linkedinUrl: linkedinUrl || null })
    .returning({ id: contacts.id });
  revalidatePath(`/clients/${parsed.data.clientId}`);
  return { ok: true, id: row?.id };
}

export async function deleteContact(id: string, clientId: string): Promise<ActionResult> {
  await requireRole(["owner", "admin", "manager", "sales"]);
  await db.delete(contacts).where(eq(contacts.id, id));
  revalidatePath(`/clients/${clientId}`);
  return { ok: true };
}
