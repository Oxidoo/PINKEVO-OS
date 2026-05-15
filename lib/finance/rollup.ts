import "server-only";
import { eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { clients, invoices, profiles } from "@/lib/db/schema";
import { sendTelegramMessage } from "@/lib/integrations/telegram/client";
import { logger } from "@/lib/logger";

/**
 * Monthly finance roll-up. Computes current MRR and compares it to the
 * previous calendar month's collected revenue; pushes a Telegram digest and
 * flags swings > 10%.
 */
export async function runFinanceRollup(): Promise<{ mrr: number; delta: number }> {
  const [mrrRow] = await db
    .select({ mrr: sql<string>`coalesce(sum(${clients.mrr}), 0)` })
    .from(clients)
    .where(eq(clients.status, "active"));
  const mrr = Number(mrrRow?.mrr ?? 0);

  const now = new Date();
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevEnd = new Date(now.getFullYear(), now.getMonth(), 1);

  const [prevRow] = await db
    .select({ total: sql<string>`coalesce(sum(${invoices.total}), 0)` })
    .from(invoices)
    .where(sql`${invoices.paidAt} >= ${prevStart} and ${invoices.paidAt} < ${prevEnd}`);
  const prevRevenue = Number(prevRow?.total ?? 0);

  const delta = prevRevenue > 0 ? ((mrr - prevRevenue) / prevRevenue) * 100 : 0;
  const swing = Math.abs(delta) >= 10;

  const recipients = await db
    .select({ chatId: profiles.telegramChatId })
    .from(profiles)
    .where(isNotNull(profiles.telegramChatId));

  const arrow = delta >= 0 ? "📈" : "📉";
  const msg = [
    "💰 *PINKEVO — bilan mensuel*",
    "",
    `MRR actuel : *${mrr.toLocaleString("fr-FR")} €*`,
    `Encaissé mois précédent : ${prevRevenue.toLocaleString("fr-FR")} €`,
    prevRevenue > 0 ? `${arrow} Variation : ${delta.toFixed(1)} %` : "",
    swing ? "\n⚠️ *Variation > 10 % — à analyser*" : "",
  ]
    .filter(Boolean)
    .join("\n");

  for (const r of recipients) {
    await sendTelegramMessage(r.chatId, msg);
  }

  logger.info({ mrr, prevRevenue, delta, swing }, "finance rollup done");
  return { mrr, delta };
}
