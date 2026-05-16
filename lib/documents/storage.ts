import "server-only";
import { DOCUMENTS_BUCKET, getSupabaseAdmin } from "@/lib/supabase/admin";

let bucketEnsured = false;

async function ensureBucket() {
  if (bucketEnsured) return;
  const sb = getSupabaseAdmin();
  const { data } = await sb.storage.getBucket(DOCUMENTS_BUCKET);
  if (!data) {
    await sb.storage.createBucket(DOCUMENTS_BUCKET, { public: false });
  }
  bucketEnsured = true;
}

export async function uploadToStorage(
  path: string,
  body: ArrayBuffer | Buffer,
  contentType: string,
): Promise<void> {
  await ensureBucket();
  const { error } = await getSupabaseAdmin()
    .storage.from(DOCUMENTS_BUCKET)
    .upload(path, body, { contentType, upsert: true });
  if (error) throw new Error(`Upload échoué: ${error.message}`);
}

export async function getSignedUrl(path: string, expiresInSec = 3600): Promise<string | null> {
  const { data } = await getSupabaseAdmin()
    .storage.from(DOCUMENTS_BUCKET)
    .createSignedUrl(path, expiresInSec);
  return data?.signedUrl ?? null;
}

export async function deleteFromStorage(path: string): Promise<void> {
  await getSupabaseAdmin().storage.from(DOCUMENTS_BUCKET).remove([path]);
}
