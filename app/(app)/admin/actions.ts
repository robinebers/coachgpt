"use server";

import { randomBytes } from "node:crypto";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { getAssistant } from "@/assistants";
import { maxInstructionsLength } from "@/assistants/types";
import { createAccount, isAdminEmail, requireAdmin, setPassword } from "@/lib/auth";
import { assistantInstructions, db, documents, user } from "@/lib/db";
import { isAllowedFile, maxFileSizeMB } from "@/lib/file-types";
import { processDocument } from "@/lib/knowledge";

const newPassword = () => randomBytes(9).toString("base64url");

// Errors are returned, not thrown, because Next.js hides thrown messages in production.
export async function addDocument(assistantSlug: string, formData: FormData) {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || !getAssistant(assistantSlug) || !isAllowedFile(file.name)) {
    return { error: "This file type can't be added." };
  }
  if (file.size > maxFileSizeMB * 1024 * 1024) {
    return { error: `Files can be up to ${maxFileSizeMB} MB. Split it into smaller files.` };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const [document] = await db
    .insert(documents)
    .values({ assistantSlug, name: file.name, status: "processing" })
    .returning();
  after(() => processDocument(document, bytes));
  revalidatePath("/admin");
  return {};
}

export async function deleteDocument(documentId: string) {
  await requireAdmin();
  await db.delete(documents).where(eq(documents.id, documentId));
  revalidatePath("/admin");
}

// Forms send line breaks as \r\n, which would count twice against the limit.
const normalized = (text: string) => text.replaceAll("\r\n", "\n").trim();

export async function saveInstructions(assistantSlug: string, formData: FormData) {
  await requireAdmin();
  const assistant = getAssistant(assistantSlug);
  if (!assistant) return { error: "This assistant doesn't exist." };
  const instructions = normalized(String(formData.get("instructions")));
  if (!instructions) return { error: "Instructions can't be empty." };
  if (instructions.length > maxInstructionsLength) {
    return { error: `Instructions can be up to ${maxInstructionsLength.toLocaleString("en-US")} characters.` };
  }
  await db
    .insert(assistantInstructions)
    .values({ assistantSlug: assistant.slug, instructions })
    .onConflictDoUpdate({ target: assistantInstructions.assistantSlug, set: { instructions, updatedAt: new Date() } });
  revalidatePath("/admin");
  return {};
}

export async function saveClient(userId: string | undefined, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name"));
  const email = String(formData.get("email")).toLowerCase();
  if (await db.$count(user, and(eq(user.email, email), ne(user.id, userId ?? "")))) {
    return { error: `${email} already has an account.` };
  }
  let password: string | undefined;
  if (userId) {
    const [current] = await db.select({ email: user.email }).from(user).where(eq(user.id, userId));
    if (current && isAdminEmail(current.email) && current.email !== email) {
      return { error: "Admin emails can only be changed in the app's settings." };
    }
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
  const [removed] = await db.select({ email: user.email }).from(user).where(eq(user.id, userId));
  if (!removed || isAdminEmail(removed.email)) return;
  await db.delete(user).where(eq(user.id, userId));
  revalidatePath("/admin");
}
