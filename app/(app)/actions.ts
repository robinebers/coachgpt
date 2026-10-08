"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";
import { chats, db } from "@/lib/db";

export async function deleteChat(chatId: string) {
  const user = await getUser();
  await db.delete(chats).where(and(eq(chats.id, chatId), eq(chats.userId, user.id)));
  revalidatePath("/", "layout");
}
