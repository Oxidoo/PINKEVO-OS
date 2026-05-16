"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole, requireUser } from "@/lib/auth/server";
import type { ActionResult } from "@/lib/crm/clients";
import { db } from "@/lib/db/client";
import { documents } from "@/lib/db/schema";
import { deleteFromStorage, getSignedUrl, uploadToStorage } from "./storage";

const MAX_BYTES = 25 * 1024 * 1024;

export async function getDocuments() {
  await requireUser();
  return db.select().from(documents).orderBy(desc(documents.createdAt));
}

export async function uploadDocument(formData: FormData): Promise<ActionResult> {
  const profile = await requireRole(["owner", "admin", "manager", "producer"]);
  const file = formData.get("file");
  const clientId = (formData.get("clientId") as string) || null;
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Aucun fichier" };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Fichier trop volumineux (max 25 Mo)" };
  }

  const safeName = file.name.replace(/[^\w.-]+/g, "_");
  const path = `${clientId ?? "general"}/${Date.now()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await uploadToStorage(path, buffer, file.type || "application/octet-stream");

  await db.insert(documents).values({
    name: file.name,
    type: "other",
    clientId,
    storagePath: path,
    mimeType: file.type || null,
    sizeBytes: file.size,
    uploadedBy: profile.id,
  });
  revalidatePath("/documents");
  return { ok: true };
}

export async function getDocumentUrl(id: string): Promise<ActionResult> {
  await requireUser();
  const [doc] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  if (!doc) return { ok: false, error: "Document introuvable" };
  const url = await getSignedUrl(doc.storagePath);
  if (!url) return { ok: false, error: "URL indisponible" };
  return { ok: true, id: url };
}

export async function deleteDocument(id: string): Promise<ActionResult> {
  await requireRole(["owner", "admin", "manager", "producer"]);
  const [doc] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  if (!doc) return { ok: false, error: "Document introuvable" };
  await deleteFromStorage(doc.storagePath);
  await db.delete(documents).where(eq(documents.id, id));
  revalidatePath("/documents");
  return { ok: true };
}
