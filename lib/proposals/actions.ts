"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import { proposals } from "@/lib/db/schema";

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
