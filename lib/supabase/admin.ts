import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export const DOCUMENTS_BUCKET = "documents";

let client: SupabaseClient | null = null;

/**
 * Service-role Supabase client — bypasses RLS. Server-only, never expose.
 * Lazily constructed so an empty env at build time doesn't throw.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!client) {
    client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
