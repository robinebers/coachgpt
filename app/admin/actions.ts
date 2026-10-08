"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { del } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { headers } from "next/headers";
import { getAssistant } from "@/assistants";
import { requireAdmin } from "@/lib/auth";
import { db, documents } from "@/lib/db";
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

export async function inviteUser(email: string) {
  await requireAdmin();
  const host = (await headers()).get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const client = await clerkClient();
  await client.invitations.createInvitation({
    emailAddress: email.trim(),
    redirectUrl: `${protocol}://${host}/sign-up`,
    ignoreExisting: true,
  });
}
