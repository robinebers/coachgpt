"use server";

import { randomBytes } from "node:crypto";
import { del } from "@vercel/blob";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { getAssistant } from "@/assistants";
import { createAccount, requireAdmin, setPassword } from "@/lib/auth";
import { db, documents, user } from "@/lib/db";
import { processDocument } from "@/lib/knowledge";

const newPassword = () => randomBytes(9).toString("base64url");

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

// Errors are returned, not thrown, because Next.js hides thrown messages in production.
export async function saveClient(userId: string | undefined, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name"));
  const email = String(formData.get("email")).toLowerCase();
  if (await db.$count(user, and(eq(user.email, email), ne(user.id, userId ?? "")))) {
    return { error: `${email} already has an account.` };
  }
  let password: string | undefined;
  if (userId) {
    await db.update(user).set({ name, email }).where(eq(user.id, userId));
  } else {
    password = newPassword();
    await createAccount(email, name, password);
  }
  revalidatePath("/admin");
  return { password };
}

export async function resetPassword(userId: string) {
  await requireAdmin();
  const password = newPassword();
  await setPassword(userId, password);
  return password;
}

export async function removeClient(userId: string) {
  await requireAdmin();
  await db.delete(user).where(eq(user.id, userId));
  revalidatePath("/admin");
}
