import { NextResponse } from "next/server";

// Phase 10: route commands /leads, /mrr, /today, /run <agent> ...
export async function POST() {
  return NextResponse.json({ received: true, phase: 10 });
}
