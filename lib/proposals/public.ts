"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/lib/db/client";
import { proposals } from "@/lib/db/schema";

export async function getProposalByToken(token: string) {
  const [p] = await db.select().from(proposals).where(eq(proposals.signatureToken, token)).limit(1);
  if (!p) return null;
  // Mark as viewed (first time only).
  if (p.status === "sent") {
    await db.update(proposals).set({ status: "viewed" }).where(eq(proposals.id, p.id));
  }
  return p;
}

export async function acceptProposal(token: string): Promise<{ ok: boolean; error?: string }> {
  const [p] = await db.select().from(proposals).where(eq(proposals.signatureToken, token)).limit(1);
  if (!p) return { ok: false, error: "Proposition introuvable" };
  if (p.status === "accepted") return { ok: true };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "unknown";

  await db
    .update(proposals)
    .set({ status: "accepted", acceptedAt: new Date(), signedIp: ip })
    .where(eq(proposals.id, p.id));
  revalidatePath(`/p/${token}`);
  return { ok: true };
}
