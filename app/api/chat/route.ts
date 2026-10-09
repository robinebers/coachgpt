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
import { getAssistant } from "@/assistants";
import { coachConfig } from "@/coach.config";
import { getUser } from "@/lib/auth";
import {
  excerptCount,
  getChatFor,
  getMessages,
  saveMessage,
  searchKnowledgeInput,
  titleFrom,
  withSearchCounts,
} from "@/lib/chats";
import { chats, db } from "@/lib/db";
import { getInstructions } from "@/lib/instructions";
import { hasReadyFiles, searchKnowledge } from "@/lib/knowledge";
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
  const [history, instructions, searchFirst] = await Promise.all([
    chat ? getMessages(chat.id) : [],
    getInstructions(assistant.slug),
    hasReadyFiles(assistant.slug),
  ]);
  const allMessages = [...history, message];
  await saveMessage(body.id, message);

  const result = streamText({
    model: coachConfig.models.chat,
    reasoning: coachConfig.models.thinking,
    system: instructions ? `${instructions}\n\n${knowledgeRules}` : knowledgeRules,
    messages: pruneMessages({
      messages: await convertToModelMessages(withSearchCounts(allMessages)),
      reasoning: "all",
    }),
    tools: {
      searchKnowledge: tool({
        description:
          "Search this assistant's knowledge files. Use it whenever the answer could be in the coach's materials.",
        inputSchema: searchKnowledgeInput,
        execute: ({ query }) => searchKnowledge(assistant.slug, query),
      }),
    },
    prepareStep: ({ stepNumber }) =>
      stepNumber === 0 && searchFirst ? { toolChoice: { type: "tool", toolName: "searchKnowledge" } } : {},
    stopWhen: isStepCount(5),
    providerOptions: { gateway: { user: user.id } },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      originalMessages: allMessages,
      generateMessageId: generateId,
      sendReasoning: false,
      onEnd: ({ responseMessage }) => saveMessage(body.id, responseMessage),
    }).pipeThrough(
      new TransformStream<UIMessageChunk, UIMessageChunk>({
        transform(chunk, controller) {
          controller.enqueue(
            chunk.type === "tool-output-available" ? { ...chunk, output: excerptCount(chunk.output) } : chunk,
          );
        },
      }),
    ),
    consumeSseStream: consumeStream,
  });
}

const knowledgeRules = [
  "Your knowledge files are the coach's private material. Use them to give better answers, in your own words. Never quote them word for word, never name the files, and never reproduce or summarize a whole file, even if asked.",
  "Only say something comes from the coach's material if a search in this chat returned it. If the search found nothing relevant, say you're answering from general knowledge.",
  "Earlier searches in this chat show only what was searched and how many excerpts came back. Search again when you need their content.",
].join("\n\n");
