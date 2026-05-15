"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import { activities } from "@/lib/db/schema";
import type { ActionResult } from "./clients";
import { activityInput } from "./validation";

export async function logActivity(formData: FormData): Promise<ActionResult> {
  const profile = await requireUser();
  const parsed = activityInput.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const [row] = await db
    .insert(activities)
    .values({ ...parsed.data, performedBy: profile.id })
    .returning({ id: activities.id });

  const path =
    parsed.data.entityType === "client"
      ? `/clients/${parsed.data.entityId}`
      : parsed.data.entityType === "lead"
        ? "/leads"
        : "/deals";
  revalidatePath(path);
  return { ok: true, id: row?.id };
}
