import type { FileUIPart, UIMessage } from "ai";
import { and, eq } from "drizzle-orm";
import { attachments, db } from "@/lib/db";

const imageUrl = (chatId: string, id: string) => `/api/attachments/${chatId}/${id}`;

export function imagePart({ id, chatId, mediaType }: { id: string; chatId: string; mediaType: string }): FileUIPart {
  return { type: "file", mediaType, url: imageUrl(chatId, id) };
}

export async function getImage(chatId: string, id: string) {
  const [image] = await db
    .select({ mediaType: attachments.mediaType, data: attachments.data })
    .from(attachments)
    .where(and(eq(attachments.chatId, chatId), eq(attachments.id, id)));
  return image;
}

// The model can't open the app's image links, so it gets the images themselves.
export async function withImageData(chatId: string, messages: UIMessage[]): Promise<UIMessage[]> {
  const rows = await db.select().from(attachments).where(eq(attachments.chatId, chatId));
  if (rows.length === 0) return messages;
  const dataUrls = new Map(
    rows.map((row) => [imageUrl(chatId, row.id), `data:${row.mediaType};base64,${row.data.toString("base64")}`]),
  );
  return messages.map((message) => ({
    ...message,
    parts: message.parts.map((part) => {
      if (part.type !== "file") return part;
      const url = dataUrls.get(part.url);
      return url ? { ...part, url } : part;
    }),
  }));
}
