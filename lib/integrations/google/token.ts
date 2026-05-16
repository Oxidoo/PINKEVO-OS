import "server-only";
import { and, eq } from "drizzle-orm";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { db } from "@/lib/db/client";
import { integrations } from "@/lib/db/schema";
import { refreshAccessToken } from "./oauth";

/** Returns a valid Google access token for the user, refreshing if expired. */
export async function getGoogleAccessToken(userId: string): Promise<string | null> {
  const [integration] = await db
    .select()
    .from(integrations)
    .where(and(eq(integrations.provider, "google"), eq(integrations.connectedBy, userId)))
    .limit(1);
  if (!integration?.accessTokenEncrypted) return null;

  const expired = integration.expiresAt ? integration.expiresAt.getTime() < Date.now() : true;
  if (!expired) return decryptSecret(integration.accessTokenEncrypted);
  if (!integration.refreshTokenEncrypted) return null;

  const refreshed = await refreshAccessToken(decryptSecret(integration.refreshTokenEncrypted));
  await db
    .update(integrations)
    .set({
      accessTokenEncrypted: encryptSecret(refreshed.accessToken),
      expiresAt: refreshed.expiresAt,
    })
    .where(eq(integrations.id, integration.id));
  return refreshed.accessToken;
}
