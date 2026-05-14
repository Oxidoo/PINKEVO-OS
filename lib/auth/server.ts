import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { profiles, type Profile } from "@/lib/db/schema";
import { hasRole, type Role } from "./rbac";

/**
 * Get the currently authenticated Supabase user, or null.
 * Cached per request via React `cache`.
 */
export const getUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Get the current user's profile from our `profiles` table, or null. */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser();
  if (!user) return null;
  const rows = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
  return rows[0] ?? null;
});

/** Redirect to /login if not authenticated. Returns the profile otherwise. */
export async function requireUser(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  return profile;
}

/** Redirect to /dashboard if the current user doesn't have one of the allowed roles. */
export async function requireRole(allowed: readonly Role[]): Promise<Profile> {
  const profile = await requireUser();
  if (!hasRole(profile.role, allowed)) {
    redirect("/dashboard?forbidden=1");
  }
  return profile;
}
