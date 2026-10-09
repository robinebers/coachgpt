import { isToolUIPart, type UIDataTypes, type UIMessage } from "ai";
import { asc, desc, eq, getTableColumns } from "drizzle-orm";
import { z } from "zod";
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

type SearchCount = { excerpts: number };

export const searchKnowledgeInput = z.object({ query: z.string().describe("What to look for, in plain words") });

export type ChatMessage = UIMessage<
  unknown,
  UIDataTypes,
  { searchKnowledge: { input: z.infer<typeof searchKnowledgeInput>; output: SearchCount } }
>;

// Search results hold the coach's knowledge files word for word. Only the query and the
// excerpt count go to the browser or back to the model on later turns.
export function withSearchCounts(messages: UIMessage[]): ChatMessage[] {
  return messages.map((message) => ({
    ...message,
    parts: message.parts.flatMap((part): UIMessage["parts"] => {
      if (!isToolUIPart(part)) return [part];
      if (part.state !== "output-available") return [];
      return [{ ...part, output: excerptCount(part.output), callProviderMetadata: undefined }];
    }),
  })) as ChatMessage[];
}

export function excerptCount(output: unknown): SearchCount {
  return { excerpts: Array.isArray(output) ? output.length : 0 };
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
