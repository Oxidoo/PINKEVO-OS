import "server-only";
import { and, eq, gte, isNotNull, isNull, like, lte, not, or } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { calendarEvents, clients, leads, profiles } from "@/lib/db/schema";
import { sendTelegramMessage } from "@/lib/integrations/telegram/client";
import { logger } from "@/lib/logger";

const PREP_MARKER = "[prep_sent]";

/**
 * Find meetings starting in ~25-35min that haven't had a prep recap sent,
 * build a context recap and push it via Telegram to team members who set a
 * telegram_chat_id. Marks the event so it isn't notified twice.
 */
export async function runMeetingPrep(): Promise<{ notified: number }> {
  const now = Date.now();
  const windowStart = new Date(now + 25 * 60 * 1000);
  const windowEnd = new Date(now + 35 * 60 * 1000);

  const upcoming = await db
    .select()
    .from(calendarEvents)
    .where(
      and(
        gte(calendarEvents.startAt, windowStart),
        lte(calendarEvents.startAt, windowEnd),
        or(isNull(calendarEvents.notes), not(like(calendarEvents.notes, `%${PREP_MARKER}%`))),
      ),
    );

  if (upcoming.length === 0) return { notified: 0 };

  const recipients = await db
    .select({ chatId: profiles.telegramChatId })
    .from(profiles)
    .where(isNotNull(profiles.telegramChatId));

  let notified = 0;
  for (const event of upcoming) {
    let context = "Aucun contact CRM lié.";
    if (event.leadId) {
      const [lead] = await db.select().from(leads).where(eq(leads.id, event.leadId)).limit(1);
      if (lead) {
        context = `Lead : *${lead.firstName ?? ""} ${lead.lastName ?? ""}* — ${lead.company ?? "?"}\nStatut : ${lead.status} · Score : ${lead.score}/100`;
      }
    } else if (event.clientId) {
      const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, event.clientId))
        .limit(1);
      if (client) {
        context = `Client : *${client.name}* (${client.company ?? "?"})\nStatut : ${client.status} · MRR : ${client.mrr}€`;
      }
    }

    const msg = [
      `🗓️ *RDV dans ~30 min* — ${event.title}`,
      `${new Date(event.startAt).toLocaleString("fr-FR")}`,
      "",
      context,
      event.meetingUrl ? `\n🔗 ${event.meetingUrl}` : "",
    ].join("\n");

    for (const r of recipients) {
      await sendTelegramMessage(r.chatId, msg);
    }

    await db
      .update(calendarEvents)
      .set({ notes: `${event.notes ?? ""} ${PREP_MARKER}`.trim() })
      .where(eq(calendarEvents.id, event.id));
    notified += 1;
  }

  logger.info({ notified }, "meeting prep recaps sent");
  return { notified };
}
