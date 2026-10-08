import type { UIMessage } from "ai";
import { asc, desc, eq, getTableColumns } from "drizzle-orm";
import { chats, db, messages, user } from "@/lib/db";

export async function listChats(userId: string, limit?: number) {
  const query = db
    .select({ id: chats.id, title: chats.title, assistantSlug: chats.assistantSlug, updatedAt: chats.updatedAt })
    .from(chats)
    .where(eq(chats.userId, userId))
    .orderBy(desc(chats.updatedAt))
    .$dynamic();
  return limit ? query.limit(limit) : query;
}

// Owners read and write their own chats. Admins can read everyone else's, never write them.
export async function getChatFor(chatId: string, viewer: { id: string; isAdmin: boolean }) {
  const [chat] = await db
    .select({ ...getTableColumns(chats), ownerName: user.name })
    .from(chats)
    .innerJoin(user, eq(chats.userId, user.id))
    .where(eq(chats.id, chatId));
  if (!chat) return null;
  if (chat.userId === viewer.id) return { ...chat, access: "owner" as const };
  if (viewer.isAdmin) return { ...chat, access: "reader" as const };
  return "forbidden";
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
