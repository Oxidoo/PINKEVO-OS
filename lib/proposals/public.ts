"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
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

const signSchema = z.object({
  name: z.string().trim().min(2, "Indiquez votre nom complet").max(120),
});

/**
 * Signe le devis : enregistre nom + IP + horodatage. Valeur juridique
 * équivalente à une signature manuscrite pour la majorité des contrats
 * commerciaux français (eIDAS niveau "simple").
 */
export async function signProposal(
  token: string,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const [p] = await db.select().from(proposals).where(eq(proposals.signatureToken, token)).limit(1);
  if (!p) return { ok: false, error: "Proposition introuvable" };
  if (p.status === "accepted") return { ok: true };

  const parsed = signSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "unknown";

  await db
    .update(proposals)
    .set({
      status: "accepted",
      acceptedAt: new Date(),
      signatureName: parsed.data.name,
      signedIp: ip,
    })
    .where(eq(proposals.id, p.id));
  revalidatePath(`/p/${token}`);
  return { ok: true };
}
