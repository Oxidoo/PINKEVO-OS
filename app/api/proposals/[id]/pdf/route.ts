import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import { proposals } from "@/lib/db/schema";
import { getSignedUrl, uploadToStorage } from "@/lib/documents/storage";
import type { ProposalContent } from "@/lib/proposals/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const [p] = await db.select().from(proposals).where(eq(proposals.id, id)).limit(1);
  if (!p) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { renderProposalPdf } = await import("@/lib/proposals/pdf");
  const content = (p.content ?? {}) as ProposalContent;
  const pdf = await renderProposalPdf({
    ...content,
    title: content.title ?? p.title,
    totalSetup: content.totalSetup ?? Number(p.totalSetup),
    totalRecurring: content.totalRecurring ?? Number(p.totalRecurring),
    paymentLink: p.paymentLinkUrl
      ? { url: p.paymentLinkUrl, label: p.paymentLinkLabel ?? "Paiement" }
      : null,
    signature:
      p.acceptedAt && p.signatureName
        ? { name: p.signatureName, signedAt: p.acceptedAt, ip: p.signedIp }
        : null,
  });

  const path = `proposals/${p.id}.pdf`;
  await uploadToStorage(path, pdf, "application/pdf");
  const signed = await getSignedUrl(path, 86_400);
  if (signed && signed !== p.pdfUrl) {
    await db.update(proposals).set({ pdfUrl: signed }).where(eq(proposals.id, p.id));
  }

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="proposition-${p.id}.pdf"`,
    },
  });
}
