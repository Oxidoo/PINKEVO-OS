import { logger } from "@/lib/logger";

/**
 * Minimal Telegram Bot API sender. No-ops gracefully (logs only) when
 * TELEGRAM_BOT_TOKEN is unset or no chat id is provided.
 */
export async function sendTelegramMessage(chatId: string | null, text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) {
    logger.info({ chatId }, "telegram skipped (no token or chat id)");
    return false;
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    }),
  });
  if (!res.ok) {
    logger.error({ status: res.status }, "telegram send failed");
    return false;
  }
  return true;
}
