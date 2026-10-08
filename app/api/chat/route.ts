import {
  consumeStream,
  convertToModelMessages,
  createUIMessageStreamResponse,
  generateId,
  isStepCount,
  streamText,
  tool,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { assistants, getAssistant } from "@/assistants";
import { coachConfig } from "@/coach.config";
import { getUser } from "@/lib/auth";
import { getChat, getMessages, saveMessage, titleFrom } from "@/lib/chats";
import { chats, db } from "@/lib/db";
import { searchKnowledge } from "@/lib/knowledge";
import { countMessage } from "@/lib/limits";

export async function POST(request: Request) {
  const user = await getUser();
  const body = (await request.json()) as { id: string; assistant: string; message: UIMessage };

  const chat = await getChat(body.id, user.id);
  const assistant = getAssistant(chat?.assistantSlug ?? body.assistant);
  if (!assistant) return new Response("Unknown assistant", { status: 404 });

  const limitMessage = user.isAdmin ? null : await countMessage(user.id);
  if (limitMessage) return new Response(limitMessage, { status: 429 });

  const text = body.message.parts
    .flatMap((part) => (part.type === "text" ? [part.text] : []))
    .join("\n")
    .slice(0, 8000);
  const message: UIMessage = { id: body.message.id, role: "user", parts: [{ type: "text", text }] };

  if (!chat) {
    await db.insert(chats).values({
      id: body.id,
      userId: user.id,
      assistantSlug: assistant.slug,
      title: titleFrom(message),
    });
  }
  const allMessages = [...(chat ? await getMessages(chat.id) : []), message];
  await saveMessage(body.id, message);

  const result = streamText({
    model: coachConfig.models.chat,
    reasoning: coachConfig.models.thinking,
    system: assistants[assistant.slug].instructions,
    messages: await convertToModelMessages(allMessages),
    tools: {
      searchKnowledge: tool({
        description:
          "Search this assistant's knowledge files. Use it whenever the answer could be in the coach's materials.",
        inputSchema: z.object({ query: z.string().describe("What to look for, in plain words") }),
        execute: ({ query }) => searchKnowledge(assistant.slug, query),
      }),
    },
    stopWhen: isStepCount(5),
    providerOptions: { gateway: { user: user.id } },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      originalMessages: allMessages,
      generateMessageId: generateId,
      onEnd: ({ responseMessage }) => saveMessage(body.id, responseMessage),
    }),
    consumeSseStream: consumeStream,
  });
}
