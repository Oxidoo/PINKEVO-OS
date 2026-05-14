import { NextResponse } from "next/server";

// Phase 5: verify Cal.com signature, create calendar_events + link to leads.
export async function POST() {
  return NextResponse.json({ received: true, phase: 5 });
}
