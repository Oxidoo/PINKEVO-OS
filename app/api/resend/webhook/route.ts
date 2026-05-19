import { eq, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { emailCampaigns, emailMessages } from "@/lib/db/schema";
import { logger } from "@/lib/logger";

/**
 * Resend webhook — opens / clicks / bounces / replies.
 * Resend signs webhooks via Svix; full signature verification is added in
 * Phase 11 hardening. We match events to messages by the Resend email id.
 */
type ResendEvent = {
  type: string;
  data?: { email_id?: string };
};

export async function POST(request: NextRequest) {
  let payload: ResendEvent;
  try {
    payload = (await request.json()) as ResendEvent;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const emailId = payload.data?.email_id;
  if (!emailId) return NextResponse.json({ received: true });

  const now = new Date();
  const patch: Partial<typeof emailMessages.$inferInsert> = {};
  switch (payload.type) {
    case "email.delivered":
      patch.status = "delivered";
      break;
    case "email.opened":
      patch.openedAt = now;
      patch.status = "delivered";
      break;
    case "email.clicked":
      patch.clickedAt = now;
      break;
    case "email.bounced":
      patch.status = "bounced";
      patch.bouncedAt = now;
      break;
    case "email.complained":
      patch.status = "failed";
      break;
    default:
      return NextResponse.json({ received: true });
  }

  const [updated] = await db
    .update(emailMessages)
    .set(patch)
    .where(eq(emailMessages.resendId, emailId))
    .returning({ campaignId: emailMessages.campaignId });

  if (payload.type === "email.opened" && updated?.campaignId) {
    await db
      .update(emailCampaigns)
      .set({ openCount: sql`${emailCampaigns.openCount} + 1` })
      .where(eq(emailCampaigns.id, updated.campaignId));
  }

  logger.info({ type: payload.type, emailId }, "resend webhook processed");
  return NextResponse.json({ received: true });
}
