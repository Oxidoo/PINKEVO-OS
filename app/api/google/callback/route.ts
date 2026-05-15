import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/server";
import { encryptSecret } from "@/lib/crypto";
import { db } from "@/lib/db/client";
import { integrations } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { exchangeCodeForTokens } from "@/lib/integrations/google/oauth";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const settings = `${env.NEXT_PUBLIC_APP_URL}/settings`;
  const user = await getUser();
  if (!user) return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/login`);

  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (!code || state !== user.id) {
    return NextResponse.redirect(`${settings}?error=google_oauth`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const [existing] = await db
      .select({ id: integrations.id })
      .from(integrations)
      .where(and(eq(integrations.provider, "google"), eq(integrations.connectedBy, user.id)))
      .limit(1);

    const values = {
      provider: "google" as const,
      connectedBy: user.id,
      accessTokenEncrypted: encryptSecret(tokens.accessToken),
      refreshTokenEncrypted: tokens.refreshToken
        ? encryptSecret(tokens.refreshToken)
        : existing
          ? undefined
          : null,
      expiresAt: tokens.expiresAt,
      scope: tokens.scope ?? null,
    };

    if (existing) {
      await db.update(integrations).set(values).where(eq(integrations.id, existing.id));
    } else {
      await db.insert(integrations).values(values);
    }
    return NextResponse.redirect(`${settings}?connected=google`);
  } catch (err) {
    logger.error({ err }, "google oauth callback failed");
    return NextResponse.redirect(`${settings}?error=google_oauth`);
  }
}
