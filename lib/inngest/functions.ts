import { inngest } from "./client";

// Phase 4+: agent runs, cron audits, daily Telegram report, monthly finance roll-up.
// Stubbed function so /api/inngest can be wired immediately.
export const ping = inngest.createFunction(
  {
    id: "ping",
    triggers: [{ event: "pinkevo/ping" }],
  },
  async ({ event }) => ({ ok: true, ts: event.ts }),
);

export const functions = [ping];
