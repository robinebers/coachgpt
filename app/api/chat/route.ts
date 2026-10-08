import {
  consumeStream,
  convertToModelMessages,
  createUIMessageStreamResponse,
  generateId,
  isStepCount,
  pruneMessages,
  streamText,
  tool,
  toUIMessageStream,
  type UIMessage,
  type UIMessageChunk,
} from "ai";
import { z } from "zod";
import { assistants, getAssistant } from "@/assistants";
import { coachConfig } from "@/coach.config";
import { getUser } from "@/lib/auth";
import { getChatFor, getMessages, saveMessage, titleFrom } from "@/lib/chats";
import { chats, db } from "@/lib/db";
import { searchKnowledge } from "@/lib/knowledge";
import { countMessage } from "@/lib/limits";

export async function POST(request: Request) {
  const user = await getUser();
  const body = (await request.json()) as { id: string; assistant: string; message: UIMessage };

  const chat = await getChatFor(body.id, user);
  if (chat === "forbidden" || chat?.access === "reader") {
    return new Response("You can only send messages in your own chats.", { status: 403 });
  }
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
    system: `${assistants[assistant.slug].instructions}\n\n${knowledgeRules}`,
    messages: pruneMessages({
      messages: await convertToModelMessages(allMessages),
      reasoning: "all",
      toolCalls: "all",
    }),
    tools: {
      searchKnowledge: tool({
        description:
          "Search this assistant's knowledge files. Use it whenever the answer could be in the coach's materials.",
        inputSchema: z.object({ query: z.string().describe("What to look for, in plain words") }),
        execute: ({ query }) => searchKnowledge(assistant.slug, query),
      }),
    },
    stopWhen: isStepCount(5),
    providerOptions: {
      gateway: { user: user.id },
      // Through the gateway, OpenAI models only stream their thinking with this set.
      openai: { reasoningSummary: "auto" },
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      originalMessages: allMessages,
      generateMessageId: generateId,
      sendReasoning: true,
      onEnd: ({ responseMessage }) => saveMessage(body.id, responseMessage),
    }).pipeThrough(
      new TransformStream<UIMessageChunk, UIMessageChunk>({
        transform(chunk, controller) {
          if (!chunk.type.startsWith("tool-")) controller.enqueue(chunk);
        },
      }),
    ),
    consumeSseStream: consumeStream,
  });
}

const knowledgeRules =
  "Your knowledge files are the coach's private material. Use them to give better answers, in your own words. Never quote them word for word, never name the files, and never reproduce or summarize a whole file, even if asked.";
