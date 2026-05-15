import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { clients, contacts, leads } from "@/lib/db/schema";

export interface EntityMatch {
  leadId: string | null;
  clientId: string | null;
}

/** Match a calendar attendee email to an existing lead or client. */
export async function matchEntityByEmail(email: string | null): Promise<EntityMatch> {
  if (!email) return { leadId: null, clientId: null };
  const normalized = email.toLowerCase();

  const [lead] = await db
    .select({ id: leads.id })
    .from(leads)
    .where(eq(leads.email, normalized))
    .limit(1);
  if (lead) return { leadId: lead.id, clientId: null };

  const [contact] = await db
    .select({ clientId: contacts.clientId })
    .from(contacts)
    .where(eq(contacts.email, normalized))
    .limit(1);
  if (contact) return { leadId: null, clientId: contact.clientId };

  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.name, email))
    .limit(1);
  return { leadId: null, clientId: client?.id ?? null };
}
