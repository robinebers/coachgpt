import type { UIMessage } from "ai";
import { asc, desc, eq, getTableColumns } from "drizzle-orm";
import { chats, db, messages, user } from "@/lib/db";

export type ChatAccess = "owner" | "reader";

export function chatAccess(
  chat: { userId: string },
  viewer: { id: string; isAdmin: boolean },
): ChatAccess | null {
  if (chat.userId === viewer.id) return "owner";
  if (viewer.isAdmin) return "reader";
  return null;
}

export async function listChats(userId: string) {
  return db
    .select({ id: chats.id, title: chats.title, assistantSlug: chats.assistantSlug, updatedAt: chats.updatedAt })
    .from(chats)
    .where(eq(chats.userId, userId))
    .orderBy(desc(chats.updatedAt))
    .limit(100);
}

export async function getChat(chatId: string) {
  const [chat] = await db
    .select({ ...getTableColumns(chats), ownerName: user.name })
    .from(chats)
    .innerJoin(user, eq(chats.userId, user.id))
    .where(eq(chats.id, chatId));
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

// Tool results hold the coach's knowledge files word for word, so they never reach the browser.
export function withoutToolParts(messages: UIMessage[]): UIMessage[] {
  return messages.map((message) => ({
    ...message,
    parts: message.parts.filter((part) => !part.type.startsWith("tool-") && part.type !== "dynamic-tool"),
  }));
}

export async function saveMessage(chatId: string, { id, role, parts }: UIMessage) {
  await db.insert(messages).values({ id, chatId, role, parts });
  await db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, chatId));
}

export function titleFrom(message: UIMessage) {
  const text = message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join(" ")
    .trim();
  return text.slice(0, 80) || "New chat";
}
