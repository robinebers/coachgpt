"use client";

import { useChat } from "@ai-sdk/react";
import { math } from "@streamdown/math";
import { DefaultChatTransport, isStaticToolUIPart, type UIMessage } from "ai";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "@/components/ai-elements/tool";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatProps = {
  id: string;
  assistant: { slug: string; name: string; description: string; starters: string[] };
  initialMessages: UIMessage[];
  readOnly?: { ownerId: string; ownerName: string };
};

export function Chat({ id, assistant, initialMessages, readOnly }: ChatProps) {
  const router = useRouter();
  const { messages, sendMessage, status, stop, error } = useChat({
    id,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ id, messages }) => ({
        body: { id, assistant: assistant.slug, message: messages.at(-1) },
      }),
    }),
    onFinish: () => router.refresh(),
  });

  const busy = status === "submitted" || status === "streaming";
  const last = messages.at(-1);
  const thinking = busy && !(last?.role === "assistant" && last.parts.at(-1)?.type === "text");

  function send(text: string) {
    if (!text.trim() || busy) return;
    if (messages.length === 0) window.history.replaceState(null, "", `/${assistant.slug}/${id}`);
    void sendMessage({ text });
  }

  return (
    <div className="flex h-full flex-col">
      <Conversation className="flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl">
          {messages.length === 0 ? (
            <ConversationEmptyState title={assistant.name} description={assistant.description} />
          ) : (
            messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))
          )}
          {thinking && <Shimmer className="text-sm">Thinking...</Shimmer>}
          {error && <p className="text-destructive text-sm">{error.message}</p>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 p-4 pt-0">
        {readOnly ? (
          <div className="flex items-center gap-3 rounded-lg border bg-muted px-3 py-2 text-sm">
            <p className="min-w-0 flex-1 text-muted-foreground">
              You’re reading {readOnly.ownerName}’s chat. Only they can reply.
            </p>
            <Link
              href={`/admin/clients/${readOnly.ownerId}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
            >
              All their chats
            </Link>
          </div>
        ) : (
          <>
            {messages.length === 0 && (
              <Suggestions>
                {assistant.starters.map((starter) => (
                  <Suggestion key={starter} suggestion={starter} onClick={send} />
                ))}
              </Suggestions>
            )}
            <PromptInput onSubmit={({ text }) => send(text)}>
              <PromptInputBody>
                <PromptInputTextarea placeholder={`Message ${assistant.name}`} />
              </PromptInputBody>
              <PromptInputFooter>
                <PromptInputTools />
                <PromptInputSubmit status={status} onStop={stop} />
              </PromptInputFooter>
            </PromptInput>
          </>
        )}
      </div>
    </div>
  );
}

const plugins = { math };

function ChatMessage({ message }: { message: UIMessage }) {
  return (
    <Message from={message.role}>
      <MessageContent>
        {message.parts.map((part, index) =>
          part.type === "text" ? (
            <MessageResponse key={index} plugins={plugins}>
              {withMathDelimiters(part.text)}
            </MessageResponse>
          ) : isStaticToolUIPart(part) ? (
            <Tool key={index}>
              <ToolHeader type={part.type} state={part.state} title="Searched the coach's knowledge" />
              <ToolContent>
                <ToolInput input={part.input} />
                <ToolOutput output={part.output} errorText={part.errorText} />
              </ToolContent>
            </Tool>
          ) : null,
        )}
      </MessageContent>
    </Message>
  );
}

// Models often write \[ \] and \( \) math, which remark-math doesn't parse. Code is left alone.
function withMathDelimiters(text: string) {
  return text
    .split(/(```[\s\S]*?```|`[^`\n]*`)/)
    .map((piece, index) =>
      index % 2
        ? piece
        : piece
            .replace(/\\\[([\s\S]+?)\\\]/g, (_, tex: string) => `\n\n$$\n${tex.trim()}\n$$\n\n`)
            .replace(/\\\(([\s\S]+?)\\\)/g, (_, tex: string) => `$$${tex.trim()}$$`),
    )
    .join("");
}
