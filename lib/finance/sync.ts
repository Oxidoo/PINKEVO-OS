import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { clients, contacts, subscriptions } from "@/lib/db/schema";

/** Resolve a Stripe customer (metadata.client_id or email) to a PINKEVO client. */
export async function resolveClientId(
  metadataClientId: string | null | undefined,
  email: string | null | undefined,
): Promise<string | null> {
  if (metadataClientId) {
    const [c] = await db
      .select({ id: clients.id })
      .from(clients)
      .where(eq(clients.id, metadataClientId))
      .limit(1);
    if (c) return c.id;
  }
  if (email) {
    const [ct] = await db
      .select({ clientId: contacts.clientId })
      .from(contacts)
      .where(eq(contacts.email, email.toLowerCase()))
      .limit(1);
    if (ct) return ct.clientId;
  }
  return null;
}

/** Recompute a client's MRR from its active subscriptions (yearly → /12). */
export async function recomputeClientMrr(clientId: string): Promise<void> {
  const [row] = await db
    .select({
      mrr: sql<string>`coalesce(sum(
        case when ${subscriptions.interval} = 'year'
             then ${subscriptions.amount} / 12
             else ${subscriptions.amount} end
      ), 0)`,
    })
    .from(subscriptions)
    .where(and(eq(subscriptions.clientId, clientId), eq(subscriptions.status, "active")));
  await db
    .update(clients)
    .set({ mrr: row?.mrr ?? "0" })
    .where(eq(clients.id, clientId));
}
