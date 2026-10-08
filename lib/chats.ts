import type { UIMessage } from "ai";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { chats, db, messages } from "@/lib/db";

export async function listChats(userId: string) {
  return db
    .select({ id: chats.id, title: chats.title, assistantSlug: chats.assistantSlug })
    .from(chats)
    .where(eq(chats.userId, userId))
    .orderBy(desc(chats.updatedAt))
    .limit(100);
}

export async function getChat(chatId: string, userId: string) {
  const [chat] = await db
    .select()
    .from(chats)
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)));
  return chat ?? null;
}

export async function getMessages(chatId: string): Promise<UIMessage[]> {
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(asc(messages.createdAt));
  return rows.map(({ id, role, parts }) => ({ id, role, parts }));
}

export async function saveMessages(chatId: string, newMessages: UIMessage[]) {
  if (newMessages.length === 0) return;
  await db
    .insert(messages)
    .values(newMessages.map(({ id, role, parts }) => ({ id, chatId, role, parts })))
    .onConflictDoUpdate({ target: messages.id, set: { parts: sql`excluded.parts` } });
  await db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, chatId));
}

export function titleFrom(message: UIMessage) {
  const text = message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join(" ")
    .trim();
  return text.slice(0, 80) || "New chat";
}
