import { NextResponse } from "next/server";

// Phase 6: verify Stripe signature, sync subscriptions/invoices to DB.
export async function POST() {
  return NextResponse.json({ received: true, phase: 6 });
}
