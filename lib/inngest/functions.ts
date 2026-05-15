import { inngest } from "./client";

export const ping = inngest.createFunction(
  { id: "ping", triggers: [{ event: "pinkevo/ping" }] },
  async ({ event }) => ({ ok: true, ts: event.ts }),
);

/** Async agent execution. Triggered by triggerAgentRun when Inngest is configured. */
export const agentRun = inngest.createFunction(
  { id: "agent-run", triggers: [{ event: "agent/run.requested" }] },
  async ({ event }) => {
    const { executeAgentRun } = await import("@/lib/ai/runs");
    await executeAgentRun(event.data.runId as string);
    return { ran: event.data.runId };
  },
);

export const functions = [ping, agentRun];
