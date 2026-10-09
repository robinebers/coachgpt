import { z } from "zod";
import { getImage } from "@/lib/attachments";
import { getUser } from "@/lib/auth";
import { getChatFor } from "@/lib/chats";

export async function GET(_request: Request, ctx: RouteContext<"/api/attachments/[chatId]/[id]">) {
  const user = await getUser();
  const { chatId, id } = await ctx.params;
  const chat = await getChatFor(chatId, user);
  const image = chat && chat !== "forbidden" && z.uuid().safeParse(id).success ? await getImage(chatId, id) : undefined;
  if (!image) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.mediaType,
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
