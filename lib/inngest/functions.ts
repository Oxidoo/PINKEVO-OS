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

/** Pre-meeting prep — runs every 5 min, pushes a Telegram recap ~30min before. */
export const meetingPrep = inngest.createFunction(
  { id: "meeting-prep", triggers: [{ cron: "*/5 * * * *" }] },
  async () => {
    const { runMeetingPrep } = await import("@/lib/calendar/prep");
    return runMeetingPrep();
  },
);

/** Monthly finance roll-up — 1st of month at 08:00 Europe/Paris. */
export const financeRollup = inngest.createFunction(
  { id: "finance-rollup", triggers: [{ cron: "TZ=Europe/Paris 0 8 1 * *" }] },
  async () => {
    const { runFinanceRollup } = await import("@/lib/finance/rollup");
    return runFinanceRollup();
  },
);

/** Weekly site re-audit — Monday 07:00 Europe/Paris. */
export const weeklyAudits = inngest.createFunction(
  { id: "weekly-audits", triggers: [{ cron: "TZ=Europe/Paris 0 7 * * 1" }] },
  async () => {
    const { runWeeklyAudits } = await import("@/lib/websites/cron");
    return runWeeklyAudits();
  },
);

/** Manual automation run requested from the UI. */
export const automationRun = inngest.createFunction(
  { id: "automation-run", triggers: [{ event: "automation/triggered" }] },
  async ({ event }) => {
    const { runAutomation } = await import("@/lib/automations/engine");
    return runAutomation(event.data.automationId as string, event.data.payload ?? {});
  },
);

/** Domain-event router → matching enabled automations. */
export const automationDispatch = inngest.createFunction(
  { id: "automation-dispatch", triggers: [{ event: "pinkevo/automation.event" }] },
  async ({ event }) => {
    const { dispatchAutomationEvent } = await import("@/lib/automations/dispatch");
    const ran = await dispatchAutomationEvent(event.data.event as string, event.data.payload ?? {});
    return { ran };
  },
);

/** Daily Telegram report — 08:00 Europe/Paris. */
export const dailyReport = inngest.createFunction(
  { id: "daily-report", triggers: [{ cron: "TZ=Europe/Paris 0 8 * * *" }] },
  async () => {
    const { runDailyReport } = await import("@/lib/telegram/daily");
    return runDailyReport();
  },
);

/** Scheduled email campaigns — every minute, sends any campaign whose time has come. */
export const scheduledCampaigns = inngest.createFunction(
  { id: "scheduled-campaigns", triggers: [{ cron: "* * * * *" }] },
  async () => {
    const { runScheduledCampaigns } = await import("@/lib/email/scheduled");
    return runScheduledCampaigns();
  },
);

/** Auto-enrich a lead via Pappers when it is first created. */
export const leadAutoEnrich = inngest.createFunction(
  { id: "lead-auto-enrich", triggers: [{ event: "pinkevo/lead.created" }] },
  async ({ event }) => {
    const { enrichLeadCore } = await import("@/lib/crm/enrich-core");
    return enrichLeadCore(event.data.leadId as string);
  },
);

/** Followup reminders — every 10 min, notifies via Telegram. */
export const followupReminders = inngest.createFunction(
  { id: "followup-reminders", triggers: [{ cron: "*/10 * * * *" }] },
  async () => {
    const { runFollowupReminders } = await import("@/lib/crm/followup-reminders");
    return runFollowupReminders();
  },
);

export const functions = [
  ping,
  agentRun,
  meetingPrep,
  financeRollup,
  weeklyAudits,
  automationRun,
  automationDispatch,
  dailyReport,
  scheduledCampaigns,
  leadAutoEnrich,
  followupReminders,
];
