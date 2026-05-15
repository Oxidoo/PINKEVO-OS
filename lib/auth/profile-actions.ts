"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { profiles, teamInvitations } from "@/lib/db/schema";
import { ROLES, type Role } from "./rbac";
import { requireRole, requireUser } from "./server";

const profileSchema = z.object({
  fullName: z.string().min(1).max(120),
  telegramChatId: z.string().max(64).optional().or(z.literal("")),
});

export type SimpleState = { error?: string; ok?: boolean } | undefined;

export async function updateMyProfile(
  _prev: SimpleState,
  formData: FormData,
): Promise<SimpleState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    telegramChatId: formData.get("telegramChatId") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  await db
    .update(profiles)
    .set({
      fullName: parsed.data.fullName,
      telegramChatId: parsed.data.telegramChatId || null,
    })
    .where(eq(profiles.id, user.id));

  revalidatePath("/settings");
  return { ok: true };
}

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(ROLES),
});

export async function inviteTeammate(_prev: SimpleState, formData: FormData): Promise<SimpleState> {
  const inviter = await requireRole(["owner", "admin"]);
  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const token = crypto.randomUUID() + crypto.randomUUID().replaceAll("-", "");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await db.insert(teamInvitations).values({
    email: parsed.data.email.toLowerCase(),
    role: parsed.data.role,
    token,
    invitedBy: inviter.id,
    expiresAt,
  });

  // TODO Phase 3: send invitation email via Resend.
  revalidatePath("/settings");
  return { ok: true };
}

export async function updateMemberRole(memberId: string, role: Role): Promise<SimpleState> {
  await requireRole(["owner", "admin"]);
  await db.update(profiles).set({ role }).where(eq(profiles.id, memberId));
  revalidatePath("/settings");
  return { ok: true };
}

export async function revokeInvitation(id: string): Promise<SimpleState> {
  await requireRole(["owner", "admin"]);
  await db.delete(teamInvitations).where(eq(teamInvitations.id, id));
  revalidatePath("/settings");
  return { ok: true };
}
