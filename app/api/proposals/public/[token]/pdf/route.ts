import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getAgencySettings } from "@/lib/agency/settings";
import { db } from "@/lib/db/client";
import { clients, leads, proposals } from "@/lib/db/schema";
import type { ProposalContent } from "@/lib/proposals/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Route PDF publique : accessible via le token unique du devis. Permet
 * au client (sans compte) de télécharger une copie PDF avec sa signature.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [p] = await db.select().from(proposals).where(eq(proposals.signatureToken, token)).limit(1);
  if (!p) return NextResponse.json({ error: "not found" }, { status: 404 });

  let recipient = { name: "—" } as {
    name: string;
    company?: string | null;
    address?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  if (p.clientId) {
    const [c] = await db.select().from(clients).where(eq(clients.id, p.clientId)).limit(1);
    if (c) recipient = { name: c.name, company: c.company };
  } else if (p.leadId) {
    const [l] = await db.select().from(leads).where(eq(leads.id, p.leadId)).limit(1);
    if (l) {
      const fullName = `${l.firstName ?? ""} ${l.lastName ?? ""}`.trim() || l.company || "Lead";
      recipient = {
        name: fullName,
        company: l.company,
        address: l.zone,
        email: l.email,
        phone: l.phone,
      };
    }
  }

  const agency = await getAgencySettings();
  const content = (p.content ?? {}) as ProposalContent;
  const issuedDate = p.sentAt ?? p.createdAt;
  const validUntil = new Date(issuedDate);
  validUntil.setDate(validUntil.getDate() + 30);

  const { renderProposalPdf } = await import("@/lib/proposals/pdf");
  const pdf = await renderProposalPdf({
    number: p.number ?? `DEV-${p.id.slice(0, 8)}`,
    content,
    totalSetup: Number(p.totalSetup),
    totalRecurring: Number(p.totalRecurring),
    agency,
    recipient,
    issuedDate,
    validUntil,
    signature:
      p.acceptedAt && p.signatureName
        ? { name: p.signatureName, signedAt: p.acceptedAt, ip: p.signedIp }
        : null,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${p.number ?? "devis"}.pdf"`,
    },
  });
}
