import { createHmac, timingSafeEqual } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { matchEntityByEmail } from "@/lib/calendar/match";
import { db } from "@/lib/db/client";
import { calendarEvents } from "@/lib/db/schema";
import { logger } from "@/lib/logger";

function verifySignature(body: string, signature: string | null): boolean {
  const secret = process.env.CAL_COM_WEBHOOK_SECRET;
  if (!secret) return true; // unconfigured — accept (dev)
  if (!signature) {
    logger.warn("cal.com webhook: missing X-Cal-Signature-256 header");
    return false;
  }
  // Cal.com may send raw hex or "sha256=<hex>"
  const raw = signature.startsWith("sha256=") ? signature.slice(7) : signature;
  const expected = createHmac("sha256", secret.trim()).update(body).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(raw, "hex"));
  } catch (err) {
    logger.warn({ err, sigLen: raw.length, expectedLen: expected.length }, "cal.com signature compare failed");
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

type LastAttempt = {
  receivedAt: string;
  trigger: string | null;
  uid: string | null;
  signatureProvided: string | null;
  signatureValid: boolean;
  result: string;
  error?: string;
};
let lastAttempt: LastAttempt | null = null;

export async function GET() {
  const configured = !!process.env.CAL_COM_WEBHOOK_SECRET;
  return NextResponse.json({
    status: "ok",
    secret_configured: configured,
    endpoint: "/api/cal/webhook",
    accepts: ["BOOKING_CREATED", "BOOKING_RESCHEDULED", "BOOKING_CANCELLED"],
    lastAttempt,
  });
}

export async function POST(request: NextRequest) {
  const raw = await request.text();
  const sig = request.headers.get("x-cal-signature-256");
  const signatureValid = verifySignature(raw, sig);

  let parsed: CalPayload = {};
  try {
    parsed = JSON.parse(raw) as CalPayload;
  } catch {}

  const trigger = parsed.triggerEvent ?? null;
  const uid = parsed.payload?.uid ?? null;

  const setLast = (result: string, error?: string) => {
    lastAttempt = {
      receivedAt: new Date().toISOString(),
      trigger,
      uid,
      signatureProvided: sig,
      signatureValid,
      result,
      error,
    };
  };

  logger.info(
    { headers: Object.fromEntries(request.headers), bodyPreview: raw.slice(0, 200) },
    "cal.com webhook received",
  );

  if (!signatureValid) {
    setLast("rejected", "invalid signature");
    logger.warn("cal.com webhook: signature rejected");
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const p = parsed.payload;
  logger.info({ trigger, uid, startTime: p?.startTime }, "cal.com payload parsed");

  if (!p?.uid || !p.startTime || !p.endTime) {
    setLast("ignored", `missing uid/startTime/endTime (trigger=${trigger})`);
    logger.warn({ p }, "cal.com webhook: missing fields — ignoring (likely PING)");
    return NextResponse.json({ received: true });
  }

  const attendees = (p.attendees ?? [])
    .filter((a) => a.email)
    .map((a) => ({ email: a.email as string, name: a.name }));
  const match = await matchEntityByEmail(attendees[0]?.email ?? null);

  if (trigger === "BOOKING_CANCELLED") {
    await db.delete(calendarEvents).where(eq(calendarEvents.externalId, p.uid));
    setLast("deleted");
    logger.info({ uid: p.uid }, "cal.com booking deleted");
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

  try {
    if (existing) {
      await db.update(calendarEvents).set(values).where(eq(calendarEvents.id, existing.id));
      setLast("updated");
      logger.info({ uid: p.uid }, "cal.com booking updated");
    } else {
      await db.insert(calendarEvents).values(values);
      setLast("inserted");
      logger.info({ uid: p.uid }, "cal.com booking inserted");
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    setLast("db_error", msg);
    logger.error({ err }, "cal.com webhook db error");
    return NextResponse.json({ error: "db error", message: msg }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
