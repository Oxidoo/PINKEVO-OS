"use server";

import { and, eq, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/server";
import type { ActionResult } from "@/lib/crm/clients";
import { db } from "@/lib/db/client";
import { calendarEvents } from "@/lib/db/schema";
import { fetchGoogleEvents, isGoogleConnected } from "@/lib/integrations/google/calendar";
import { matchEntityByEmail } from "./match";

export async function getCalendarEvents(from: Date, to: Date) {
  await requireUser();
  return db
    .select()
    .from(calendarEvents)
    .where(and(gte(calendarEvents.startAt, from), lte(calendarEvents.startAt, to)))
    .orderBy(calendarEvents.startAt);
}

export async function googleConnectionStatus(): Promise<boolean> {
  const user = await requireUser();
  return isGoogleConnected(user.id);
}

export async function syncGoogleCalendar(): Promise<ActionResult> {
  const user = await requireUser();
  const from = new Date();
  from.setDate(from.getDate() - 7);
  const to = new Date();
  to.setDate(to.getDate() + 60);

  const events = await fetchGoogleEvents(user.id, from, to);
  if (events.length === 0) {
    return { ok: false, error: "Aucun événement (Google non connecté ou agenda vide)" };
  }

  let synced = 0;
  for (const e of events) {
    const match = await matchEntityByEmail(e.attendees[0]?.email ?? null);
    const [existing] = await db
      .select({ id: calendarEvents.id })
      .from(calendarEvents)
      .where(
        and(eq(calendarEvents.externalId, e.externalId), eq(calendarEvents.provider, "google")),
      )
      .limit(1);

    const values = {
      externalId: e.externalId,
      provider: "google" as const,
      title: e.title,
      description: e.description,
      startAt: e.startAt,
      endAt: e.endAt,
      attendees: e.attendees,
      meetingUrl: e.meetingUrl,
      leadId: match.leadId,
      clientId: match.clientId,
    };
    if (existing) {
      await db.update(calendarEvents).set(values).where(eq(calendarEvents.id, existing.id));
    } else {
      await db.insert(calendarEvents).values(values);
    }
    synced += 1;
  }

  revalidatePath("/calendar");
  return { ok: true, id: String(synced) };
}
