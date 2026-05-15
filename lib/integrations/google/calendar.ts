import { and, eq } from "drizzle-orm";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { db } from "@/lib/db/client";
import { integrations } from "@/lib/db/schema";
import { refreshAccessToken } from "./oauth";

export interface GoogleEvent {
  externalId: string;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date;
  attendees: { email: string; name?: string }[];
  meetingUrl: string | null;
}

async function getValidAccessToken(userId: string): Promise<string | null> {
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

export async function isGoogleConnected(userId: string): Promise<boolean> {
  const [integration] = await db
    .select({ id: integrations.id })
    .from(integrations)
    .where(and(eq(integrations.provider, "google"), eq(integrations.connectedBy, userId)))
    .limit(1);
  return Boolean(integration);
}

export async function fetchGoogleEvents(
  userId: string,
  timeMin: Date,
  timeMax: Date,
): Promise<GoogleEvent[]> {
  const token = await getValidAccessToken(userId);
  if (!token) return [];

  const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
  url.searchParams.set("timeMin", timeMin.toISOString());
  url.searchParams.set("timeMax", timeMax.toISOString());
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", "100");

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    items?: Array<{
      id: string;
      summary?: string;
      description?: string;
      hangoutLink?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
      attendees?: Array<{ email?: string; displayName?: string }>;
    }>;
  };

  return (data.items ?? []).map((e) => ({
    externalId: e.id,
    title: e.summary ?? "(sans titre)",
    description: e.description ?? null,
    startAt: new Date(e.start?.dateTime ?? e.start?.date ?? Date.now()),
    endAt: new Date(e.end?.dateTime ?? e.end?.date ?? Date.now()),
    attendees: (e.attendees ?? [])
      .filter((a) => a.email)
      .map((a) => ({ email: a.email as string, name: a.displayName })),
    meetingUrl: e.hangoutLink ?? null,
  }));
}
