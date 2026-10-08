"use server";

import { randomBytes } from "node:crypto";
import { del } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { getAssistant } from "@/assistants";
import { createAccount, requireAdmin, setPassword } from "@/lib/auth";
import { db, documents, user } from "@/lib/db";
import { processDocument } from "@/lib/knowledge";

export async function addDocument(assistantSlug: string, name: string, blobPathname: string) {
  await requireAdmin();
  if (!getAssistant(assistantSlug) || !blobPathname.startsWith(`knowledge/${assistantSlug}/`)) {
    throw new Error("Unknown assistant");
  }
  const [document] = await db
    .insert(documents)
    .values({ assistantSlug, name, blobPathname, status: "processing" })
    .returning();
  after(() => processDocument(document));
  revalidatePath("/admin");
}

export async function deleteDocument(documentId: string) {
  await requireAdmin();
  const [document] = await db.delete(documents).where(eq(documents.id, documentId)).returning();
  if (document) await del(document.blobPathname);
  revalidatePath("/admin");
}

// The error is returned, not thrown, because Next.js hides thrown messages in production.
export async function addClient(formData: FormData): Promise<{ password: string } | { error: string }> {
  await requireAdmin();
  const email = String(formData.get("email")).toLowerCase();
  if (await db.$count(user, eq(user.email, email))) return { error: `${email} already has an account.` };
  const password = randomBytes(9).toString("base64url");
  await createAccount(email, `${formData.get("firstName")} ${formData.get("lastName")}`, password);
  revalidatePath("/admin");
  return { password };
}

export async function resetPassword(userId: string) {
  await requireAdmin();
  const password = randomBytes(9).toString("base64url");
  await setPassword(userId, password);
  return { password };
}

export async function removeClient(userId: string) {
  await requireAdmin();
  await db.delete(user).where(eq(user.id, userId));
  revalidatePath("/admin");
}
