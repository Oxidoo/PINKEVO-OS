import "server-only";
import { and, count, eq, gte, isNotNull, lt, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  agentRuns,
  audits,
  calendarEvents,
  emailMessages,
  invoices,
  leads,
  profiles,
  proposals,
} from "@/lib/db/schema";
import { sendTelegramMessage } from "@/lib/integrations/telegram/client";
import { logger } from "@/lib/logger";

/** Daily 08:00 Europe/Paris digest pushed to all team members with a chat id. */
export async function runDailyReport(): Promise<{ sent: number }> {
  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const startYesterday = new Date(startToday);
  startYesterday.setDate(startYesterday.getDate() - 1);
  const endToday = new Date(startToday);
  endToday.setDate(endToday.getDate() + 1);

  const [newLeads, emailsSent, runs, aiCost, todayEvents, staleProposals, perfAlerts, unpaid] =
    await Promise.all([
      db
        .select({ n: count() })
        .from(leads)
        .where(and(gte(leads.createdAt, startYesterday), lt(leads.createdAt, startToday))),
      db
        .select({ n: count() })
        .from(emailMessages)
        .where(
          and(
            gte(emailMessages.createdAt, startYesterday),
            lt(emailMessages.createdAt, startToday),
          ),
        ),
      db
        .select({ n: count() })
        .from(agentRuns)
        .where(and(gte(agentRuns.createdAt, startYesterday), lt(agentRuns.createdAt, startToday))),
      db
        .select({ c: sql<string>`coalesce(sum(${agentRuns.costUsd}), 0)` })
        .from(agentRuns)
        .where(and(gte(agentRuns.createdAt, startYesterday), lt(agentRuns.createdAt, startToday))),
      db
        .select({ n: count() })
        .from(calendarEvents)
        .where(and(gte(calendarEvents.startAt, startToday), lt(calendarEvents.startAt, endToday))),
      db
        .select({ n: count() })
        .from(proposals)
        .where(
          and(
            eq(proposals.status, "sent"),
            lt(proposals.sentAt, new Date(now.getTime() - 3 * 86_400_000)),
          ),
        ),
      db
        .select({ n: count() })
        .from(audits)
        .where(and(eq(audits.type, "performance"), lt(audits.score, 70))),
      db
        .select({ n: count() })
        .from(invoices)
        .where(
          and(
            eq(invoices.status, "open"),
            lte(invoices.dueAt, new Date(now.getTime() - 7 * 86_400_000)),
          ),
        ),
    ]);

  const dateStr = now.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const msg = [
    `🌅 *PINKEVO daily — ${dateStr}*`,
    "",
    "*Hier*",
    `• Nouveaux leads : ${newLeads[0]?.n ?? 0}`,
    `• Emails envoyés : ${emailsSent[0]?.n ?? 0}`,
    `• Runs agents : ${runs[0]?.n ?? 0} (coût $${Number(aiCost[0]?.c ?? 0).toFixed(2)})`,
    "",
    "*Aujourd'hui*",
    `• RDV : ${todayEvents[0]?.n ?? 0}`,
    `• Propales > 3j sans réponse : ${staleProposals[0]?.n ?? 0}`,
    "",
    "*Alertes*",
    `• Sites perf < 70 : ${perfAlerts[0]?.n ?? 0}`,
    `• Factures impayées > 7j : ${unpaid[0]?.n ?? 0}`,
  ].join("\n");

  const recipients = await db
    .select({ chatId: profiles.telegramChatId })
    .from(profiles)
    .where(isNotNull(profiles.telegramChatId));

  let sent = 0;
  for (const r of recipients) {
    if (await sendTelegramMessage(r.chatId, msg)) sent += 1;
  }
  logger.info({ sent }, "telegram daily report sent");
  return { sent };
}
