import "server-only";
import { and, eq, gt, isNotNull, lt } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { leadContacts, leads, profiles } from "@/lib/db/schema";
import { sendTelegramMessage } from "@/lib/integrations/telegram/client";
import { logger } from "@/lib/logger";

/**
 * Called every 10 minutes by Inngest.
 * Sends Telegram notifications for followups falling in the next 10-minute window,
 * preventing duplicate sends by only targeting the exact upcoming window.
 */
export async function runFollowupReminders(): Promise<{ sent: number }> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 10 * 60 * 1000);

  // Followups whose time falls in the next 10 minutes.
  const due = await db
    .select({
      contactId: leadContacts.id,
      leadId: leadContacts.leadId,
      note: leadContacts.note,
      followupAt: leadContacts.followupAt,
    })
    .from(leadContacts)
    .where(
      and(
        isNotNull(leadContacts.followupAt),
        gt(leadContacts.followupAt, now),
        lt(leadContacts.followupAt, windowEnd),
      ),
    );

  if (due.length === 0) return { sent: 0 };

  // Fetch lead names in one query.
  const leadIds = [...new Set(due.map((d) => d.leadId))];
  const leadRows = await db
    .select({
      id: leads.id,
      firstName: leads.firstName,
      lastName: leads.lastName,
      company: leads.company,
    })
    .from(leads)
    .where(leadIds.length === 1 ? eq(leads.id, leadIds[0] as string) : undefined);

  // Build map — handle multiple leads via a second pass if needed.
  let allLeads = leadRows;
  if (leadIds.length > 1) {
    allLeads = await db
      .select({
        id: leads.id,
        firstName: leads.firstName,
        lastName: leads.lastName,
        company: leads.company,
      })
      .from(leads);
  }
  const leadMap = new Map(allLeads.map((l) => [l.id, l]));

  // All team members with a Telegram chat id.
  const recipients = await db
    .select({ chatId: profiles.telegramChatId })
    .from(profiles)
    .where(isNotNull(profiles.telegramChatId));

  let sent = 0;
  for (const d of due) {
    const lead = leadMap.get(d.leadId);
    const name = lead
      ? `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim() || lead.company || "Lead"
      : "Lead";

    const time = d.followupAt
      ? new Date(d.followupAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
      : "";

    const lines = [
      `⏰ *Rappel — ${name}* (${time})`,
      d.note ? `_${d.note.slice(0, 200)}_` : "",
    ].filter(Boolean);

    const msg = lines.join("\n");

    for (const r of recipients) {
      if (await sendTelegramMessage(r.chatId, msg)) sent += 1;
    }
  }

  logger.info({ sent, reminders: due.length }, "followup reminders sent");
  return { sent };
}
