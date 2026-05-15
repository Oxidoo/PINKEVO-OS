import { createHmac, timingSafeEqual } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { matchEntityByEmail } from "@/lib/calendar/match";
import { db } from "@/lib/db/client";
import { calendarEvents } from "@/lib/db/schema";
import { logger } from "@/lib/logger";

function verifySignature(body: string, signature: string | null): boolean {
  const secret = process.env.CAL_COM_WEBHOOK_SECRET;
  if (!secret) return true; // dev / unconfigured — accept
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

type CalPayload = {
  triggerEvent?: string;
  payload?: {
    uid?: string;
    title?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    videoCallData?: { url?: string };
    location?: string;
    attendees?: Array<{ email?: string; name?: string }>;
  };
};

export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (!verifySignature(raw, request.headers.get("x-cal-signature-256"))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let body: CalPayload;
  try {
    body = JSON.parse(raw) as CalPayload;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const p = body.payload;
  const trigger = body.triggerEvent;
  if (!p?.uid || !p.startTime || !p.endTime) {
    return NextResponse.json({ received: true });
  }

  const attendees = (p.attendees ?? [])
    .filter((a) => a.email)
    .map((a) => ({ email: a.email as string, name: a.name }));
  const match = await matchEntityByEmail(attendees[0]?.email ?? null);

  if (trigger === "BOOKING_CANCELLED") {
    await db.delete(calendarEvents).where(eq(calendarEvents.externalId, p.uid));
    return NextResponse.json({ received: true });
  }

  const [existing] = await db
    .select({ id: calendarEvents.id })
    .from(calendarEvents)
    .where(and(eq(calendarEvents.externalId, p.uid), eq(calendarEvents.provider, "cal_com")))
    .limit(1);

  const values = {
    externalId: p.uid,
    provider: "cal_com" as const,
    title: p.title ?? "RDV Cal.com",
    description: p.description ?? null,
    startAt: new Date(p.startTime),
    endAt: new Date(p.endTime),
    attendees,
    meetingUrl: p.videoCallData?.url ?? p.location ?? null,
    leadId: match.leadId,
    clientId: match.clientId,
  };

  if (existing) {
    await db.update(calendarEvents).set(values).where(eq(calendarEvents.id, existing.id));
  } else {
    await db.insert(calendarEvents).values(values);
  }

  logger.info({ trigger, uid: p.uid }, "cal.com webhook processed");
  return NextResponse.json({ received: true });
}
