import { generateText, isToolUIPart, type UIDataTypes, type UIMessage } from "ai";
import { asc, desc, eq, getTableColumns } from "drizzle-orm";
import { z } from "zod";
import { coachConfig } from "@/coach.config";
import { imagePart } from "@/lib/attachments";
import { attachments, chats, db, messages, user } from "@/lib/db";
import { imageTypes, maxImageMB, maxImagesPerMessage } from "@/lib/file-types";

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

function messageWrites(chatId: string, { id, role, parts }: UIMessage) {
  return [
    db.insert(messages).values({ id, chatId, role, parts }),
    db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, chatId)),
  ] as const;
}

export async function saveMessage(chatId: string, message: UIMessage) {
  await db.batch(messageWrites(chatId, message));
}

export type UserInput = { text: string; images: { mediaType: string; data: Buffer }[] };

// Null when the message is empty, or has anything but up to three small images.
export function readUserMessage(parts: UIMessage["parts"]): UserInput | null {
  const text = parts
    .flatMap((part) => (part.type === "text" ? [part.text] : []))
    .join("\n")
    .trim()
    .slice(0, 8000);
  const files = parts.filter((part) => part.type === "file");
  if (files.length > maxImagesPerMessage) return null;
  const images: UserInput["images"] = [];
  for (const { url } of files) {
    const [, mediaType, base64] = /^data:([^;,]+);base64,(.+)$/.exec(url) ?? [];
    if (!mediaType || !base64 || !imageTypes.includes(mediaType)) return null;
    const data = Buffer.from(base64, "base64");
    if (data.length > maxImageMB * 1024 * 1024) return null;
    images.push({ mediaType, data });
  }
  return text || images.length > 0 ? { text, images } : null;
}

// One batch, so a failed save leaves no empty chat or stray images behind.
export async function saveUserMessage(
  chat: { id: string; userId: string; assistantSlug: string },
  messageId: string,
  { text, images }: UserInput,
): Promise<UIMessage> {
  const rows = images.map((image) => ({ id: crypto.randomUUID(), chatId: chat.id, ...image }));
  const imageParts = rows.map(imagePart);
  const message: UIMessage = {
    id: messageId,
    role: "user",
    parts: text ? [...imageParts, { type: "text", text }] : imageParts,
  };
  await db.batch([
    db
      .insert(chats)
      .values({ ...chat, title: text.slice(0, 80) || "New chat" })
      .onConflictDoNothing(),
    ...(rows.length > 0 ? [db.insert(attachments).values(rows)] : []),
    ...messageWrites(chat.id, message),
  ]);
  return message;
}

// A few words, like chat names in ChatGPT. If this fails, the first message stays the title.
export async function nameChat(chatId: string, firstMessage: string, userId: string) {
  try {
    const { text } = await generateText({
      model: coachConfig.models.chat,
      reasoning: "none",
      maxOutputTokens: 20,
      system:
        "Write a title for a chat that starts with the user's message. 2 to 5 words, in the message's language. Reply with the title only: no quotes, no period.",
      prompt: firstMessage.slice(0, 2000),
      providerOptions: { gateway: { user: userId } },
    });
    const title = text.trim().replace(/^["'“]+|["'”.]+$/g, "").slice(0, 60);
    if (title) await db.update(chats).set({ title }).where(eq(chats.id, chatId));
  } catch (error) {
    console.error("Couldn't name the chat", error);
  }
}
