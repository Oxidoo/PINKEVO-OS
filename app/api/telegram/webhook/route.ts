import { type NextRequest, NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/integrations/telegram/client";
import { logger } from "@/lib/logger";
import { authorizeChat, handleCommand } from "@/lib/telegram/commands";

export const dynamic = "force-dynamic";

type TelegramUpdate = {
  message?: { chat?: { id?: number }; text?: string };
};

export async function POST(request: NextRequest) {
  // Optional shared-secret header set when registering the webhook.
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expected && request.headers.get("x-telegram-bot-api-secret-token") !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }

  const chatId = update.message?.chat?.id;
  const text = update.message?.text;
  if (!chatId || !text) return NextResponse.json({ ok: true });

  const chatStr = String(chatId);
  const profileId = await authorizeChat(chatStr);
  if (!profileId) {
    await sendTelegramMessage(
      chatStr,
      "⛔ Chat non autorisé. Renseignez ce chat ID dans votre profil PINKEVO.",
    );
    return NextResponse.json({ ok: true });
  }

  try {
    const reply = await handleCommand(text, profileId);
    await sendTelegramMessage(chatStr, reply);
  } catch (err) {
    logger.error({ err, chatStr }, "telegram command failed");
    await sendTelegramMessage(chatStr, "❌ Erreur lors du traitement de la commande.");
  }
  return NextResponse.json({ ok: true });
}
