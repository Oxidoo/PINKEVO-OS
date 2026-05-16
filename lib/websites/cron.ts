import "server-only";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { audits, profiles, websites } from "@/lib/db/schema";
import { runPsi } from "@/lib/integrations/psi/client";
import { sendTelegramMessage } from "@/lib/integrations/telegram/client";
import { logger } from "@/lib/logger";

/**
 * Weekly PSI re-audit of monitored sites. Records a performance audit and
 * alerts via Telegram when the mobile score drops > 10 points vs the last one.
 */
export async function runWeeklyAudits(): Promise<{ audited: number; alerts: number }> {
  const monitored = await db.select().from(websites).where(eq(websites.monitoringEnabled, true));
  if (monitored.length === 0) return { audited: 0, alerts: 0 };

  const recipients = await db
    .select({ chatId: profiles.telegramChatId })
    .from(profiles)
    .where(isNotNull(profiles.telegramChatId));

  let alerts = 0;
  for (const site of monitored) {
    const [prev] = await db
      .select()
      .from(audits)
      .where(and(eq(audits.websiteId, site.id), eq(audits.type, "performance")))
      .orderBy(desc(audits.runAt))
      .limit(1);

    const psi = await runPsi(site.url, "mobile");
    await db.insert(audits).values({
      websiteId: site.id,
      type: "performance",
      score: psi.performance,
      rawData: { psi, source: "weekly_cron" },
    });

    if (prev?.score != null && prev.score - psi.performance > 10) {
      alerts += 1;
      const msg = [
        "⚠️ *Chute de performance détectée*",
        `${site.name} — ${site.url}`,
        `Perf mobile : ${prev.score} → *${psi.performance}* (${psi.performance - prev.score})`,
      ].join("\n");
      for (const r of recipients) await sendTelegramMessage(r.chatId, msg);
    }
  }

  logger.info({ audited: monitored.length, alerts }, "weekly audits done");
  return { audited: monitored.length, alerts };
}
