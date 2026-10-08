import {
  convertToModelMessages,
  createIdGenerator,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  tool,
  toUIMessageStream,
  validateUIMessages,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { getAssistant, getInstructions } from "@/assistants";
import { coachConfig } from "@/coach.config";
import { getUser } from "@/lib/auth";
import { getChat, getMessages, saveMessages, titleFrom } from "@/lib/chats";
import { chats, db } from "@/lib/db";
import { searchKnowledge } from "@/lib/knowledge";
import { checkLimits, recordUsage } from "@/lib/limits";

export async function POST(request: Request) {
  const user = await getUser();
  const body = (await request.json()) as { id: string; assistant: string; message: UIMessage };

  const assistant = getAssistant(body.assistant);
  if (!assistant) return Response.json({ error: "Unknown assistant" }, { status: 404 });

  const limitMessage = user.isAdmin ? null : await checkLimits(user.id);
  if (limitMessage) return new Response(limitMessage, { status: 429 });

  const chat = await getChat(body.id, user.id);
  if (!chat) {
    await db.insert(chats).values({
      id: body.id,
      userId: user.id,
      assistantSlug: assistant.slug,
      title: titleFrom(body.message),
    });
  }

  const history = chat ? await getMessages(chat.id) : [];
  const allMessages = await validateUIMessages({ messages: [...history, body.message] });
  await saveMessages(body.id, [body.message]);

  const result = streamText({
    model: coachConfig.models.chat,
    reasoning: coachConfig.models.thinking,
    system: await getInstructions(assistant.slug),
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
    onFinish: ({ totalUsage }) => recordUsage(user.id, totalUsage),
  });
  result.consumeStream();

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      originalMessages: allMessages,
      generateMessageId: createIdGenerator({ prefix: "msg", size: 16 }),
      onEnd: ({ responseMessage }) => saveMessages(body.id, [responseMessage]),
    }),
  });
}
