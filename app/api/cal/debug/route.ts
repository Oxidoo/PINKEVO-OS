/**
 * Temporary debug endpoint — remove after Cal.com integration is confirmed working.
 * POST: parses and logs any incoming payload (no signature check).
 * GET:  returns the last received payload.
 */

let lastPayload: unknown = null;
let lastHeaders: Record<string, string> = {};
let lastReceivedAt: string | null = null;

export async function POST(request: Request) {
  const raw = await request.text();
  lastHeaders = Object.fromEntries(new Headers(request.headers));
  lastReceivedAt = new Date().toISOString();
  try {
    lastPayload = JSON.parse(raw);
  } catch {
    lastPayload = { raw };
  }
  return Response.json({ received: true });
}

export async function GET() {
  return Response.json({
    lastReceivedAt,
    relevantHeaders: {
      "x-cal-signature-256": lastHeaders["x-cal-signature-256"] ?? null,
      "content-type": lastHeaders["content-type"] ?? null,
    },
    payload: lastPayload,
  });
}
