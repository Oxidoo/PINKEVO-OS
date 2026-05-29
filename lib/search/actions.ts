"use server";

import { ilike, or } from "drizzle-orm";
import { requireUser } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import { clients, deals, leads } from "@/lib/db/schema";

export interface SearchResult {
  id: string;
  label: string;
  sub?: string;
  href: string;
  kind: "lead" | "client" | "deal";
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  await requireUser();
  const q = query.trim();
  if (q.length < 2) return [];

  const pattern = `%${q}%`;

  const [leadRows, clientRows, dealRows] = await Promise.all([
    db
      .select({
        id: leads.id,
        firstName: leads.firstName,
        lastName: leads.lastName,
        company: leads.company,
        email: leads.email,
      })
      .from(leads)
      .where(
        or(
          ilike(leads.firstName, pattern),
          ilike(leads.lastName, pattern),
          ilike(leads.company, pattern),
          ilike(leads.email, pattern),
        ),
      )
      .limit(5),
    db
      .select({ id: clients.id, name: clients.name, company: clients.company })
      .from(clients)
      .where(or(ilike(clients.name, pattern), ilike(clients.company, pattern)))
      .limit(5),
    db
      .select({ id: deals.id, title: deals.title })
      .from(deals)
      .where(ilike(deals.title, pattern))
      .limit(5),
  ]);

  const results: SearchResult[] = [
    ...leadRows.map((l) => ({
      id: l.id,
      kind: "lead" as const,
      label: `${l.firstName ?? ""} ${l.lastName ?? ""}`.trim() || l.company || l.email || "Lead",
      sub: l.company ?? undefined,
      href: "/leads",
    })),
    ...clientRows.map((c) => ({
      id: c.id,
      kind: "client" as const,
      label: c.name,
      sub: c.company ?? undefined,
      href: `/clients/${c.id}`,
    })),
    ...dealRows.map((d) => ({
      id: d.id,
      kind: "deal" as const,
      label: d.title,
      href: "/deals",
    })),
  ];

  return results;
}
