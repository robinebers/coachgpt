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
import { withImageData } from "@/lib/attachments";
import { getUser } from "@/lib/auth";
import {
  excerptCount,
  getChatFor,
  getMessages,
  nameChat,
  readUserMessage,
  saveMessage,
  saveUserMessage,
  searchKnowledgeInput,
  withSearchCounts,
} from "@/lib/chats";
import { maxImageMB, maxImagesPerMessage } from "@/lib/file-types";
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

  const input = readUserMessage(body.message.parts);
  if (!input) {
    return new Response(
      `Send a message, or up to ${maxImagesPerMessage} PNG, JPEG, WebP or GIF images of ${maxImageMB} MB each.`,
      { status: 400 },
    );
  }

  const limitMessage = user.isAdmin ? null : await countMessage(user.id);
  if (limitMessage) return new Response(limitMessage, { status: 429 });

  const [history, instructions, searchFirst] = await Promise.all([
    chat ? getMessages(chat.id) : [],
    getInstructions(assistant.slug),
    hasReadyFiles(assistant.slug),
  ]);
  const message = await saveUserMessage(
    { id: body.id, userId: user.id, assistantSlug: assistant.slug },
    body.message.id,
    input,
  );
  const allMessages = [...history, message];
  const naming = !chat && input.text ? nameChat(body.id, input.text, user.id) : undefined;

  const result = streamText({
    model: coachConfig.models.chat,
    reasoning: coachConfig.models.thinking,
    system: [`You are ${assistant.name}, an assistant in ${coachConfig.appName}.`, instructions, knowledgeRules]
      .filter(Boolean)
      .join("\n\n"),
    messages: pruneMessages({
      messages: await convertToModelMessages(withSearchCounts(await withImageData(body.id, allMessages))),
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
      onError: (error) =>
        user.isAdmin && error instanceof Error
          ? error.message
          : "The assistant can't answer right now. Try again in a minute. If it keeps happening, tell your coach.",
      // The stream closes after this, and the browser then refreshes the sidebar, so the new title shows right away.
      onEnd: async ({ responseMessage }) => {
        await Promise.all([saveMessage(body.id, responseMessage), naming]);
      },
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
