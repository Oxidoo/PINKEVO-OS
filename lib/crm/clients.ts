"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole, requireUser } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import { activities, clients, contacts, deals } from "@/lib/db/schema";
import { clientInput } from "./validation";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

function parseForm<T extends Record<string, unknown>>(formData: FormData): T {
  return Object.fromEntries(formData.entries()) as T;
}

export async function createClient(formData: FormData): Promise<ActionResult> {
  const profile = await requireRole(["owner", "admin", "manager", "sales"]);
  const parsed = clientInput.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const { mrr, ...rest } = parsed.data;
  const [row] = await db
    .insert(clients)
    .values({
      ...rest,
      mrr: String(mrr),
      ownerId: profile.id,
      acquiredAt: parsed.data.status === "active" ? new Date() : null,
    })
    .returning({ id: clients.id });
  revalidatePath("/clients");
  return { ok: true, id: row?.id };
}

export async function updateClient(id: string, formData: FormData): Promise<ActionResult> {
  await requireRole(["owner", "admin", "manager", "sales"]);
  const parsed = clientInput.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const { mrr, ...rest } = parsed.data;
  await db
    .update(clients)
    .set({ ...rest, mrr: String(mrr) })
    .where(eq(clients.id, id));
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  return { ok: true, id };
}

export async function deleteClient(id: string): Promise<ActionResult> {
  await requireRole(["owner", "admin"]);
  await db.delete(clients).where(eq(clients.id, id));
  revalidatePath("/clients");
  return { ok: true };
}

export async function getClients() {
  await requireUser();
  return db.select().from(clients).orderBy(desc(clients.createdAt)).limit(500);
}

export async function getClientDetail(id: string) {
  await requireUser();
  const [client] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  if (!client) return null;
  const [clientContacts, clientDeals, clientActivities] = await Promise.all([
    db.select().from(contacts).where(eq(contacts.clientId, id)),
    db.select().from(deals).where(eq(deals.clientId, id)).orderBy(desc(deals.createdAt)),
    db
      .select()
      .from(activities)
      .where(eq(activities.entityId, id))
      .orderBy(desc(activities.performedAt))
      .limit(50),
  ]);
  return { client, contacts: clientContacts, deals: clientDeals, activities: clientActivities };
}
