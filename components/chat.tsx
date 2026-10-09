"use client";

import { useChat } from "@ai-sdk/react";
import { math } from "@streamdown/math";
import { DefaultChatTransport } from "ai";
import { SearchIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Assistant } from "@/assistants/types";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageActions, MessageContent, MessageResponse } from "@/components/ai-elements/message";
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
import { CopyButton } from "@/components/copy-button";
import { buttonVariants } from "@/components/ui/button";
import type { ChatMessage } from "@/lib/chats";
import { cn } from "@/lib/utils";

type Part = ChatMessage["parts"][number];
type SearchPart = Extract<Part, { type: "tool-searchKnowledge" }>;

type ChatProps = {
  id: string;
  assistant: Assistant & { slug: string };
  initialMessages: ChatMessage[];
  readOnly?: { ownerId: string; ownerName: string };
};

export function Chat({ id, assistant, initialMessages, readOnly }: ChatProps) {
  const router = useRouter();
  const { messages, sendMessage, status, stop, error } = useChat<ChatMessage>({
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
  const lastPart = last?.role === "assistant" ? last.parts.at(-1) : undefined;
  const thinking = busy && lastPart?.type !== "text" && !isSearching(lastPart);

  function send(text: string) {
    if (!text.trim() || busy) return;
    if (messages.length === 0) window.history.replaceState(null, "", `/${assistant.slug}/${id}`);
    void sendMessage({ text });
  }

  const composer = (autoFocus: boolean) => (
    <PromptInput onSubmit={({ text }) => send(text)}>
      <PromptInputBody>
        <PromptInputTextarea placeholder={`Message ${assistant.name}`} autoFocus={autoFocus} />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputTools />
        <PromptInputSubmit status={status} onStop={stop} />
      </PromptInputFooter>
    </PromptInput>
  );

  if (messages.length === 0 && !readOnly) {
    return (
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center gap-6 p-4 pb-[12vh]">
        <div className="flex flex-col items-center gap-3 text-center">
          <Image src={assistant.avatar} alt="" width={64} height={64} className="rounded-full" />
          <div className="flex flex-col gap-1">
            <h1 className="font-semibold text-2xl">{assistant.name}</h1>
            <p className="text-muted-foreground">{assistant.description}</p>
          </div>
        </div>
        {composer(true)}
        <Suggestions className="w-full flex-wrap justify-center">
          {assistant.starters.map((starter) => (
            <Suggestion key={starter} suggestion={starter} onClick={send} />
          ))}
        </Suggestions>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <Conversation className="flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl">
          {messages.map((message) => (
            <MessageRow key={message.id} message={message} streaming={busy && message === last} />
          ))}
          {thinking && <Shimmer className="text-sm">Thinking...</Shimmer>}
          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-destructive text-sm">{error.message}</p>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="mx-auto w-full max-w-3xl p-4 pt-0">
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
          composer(false)
        )}
      </div>
    </div>
  );
}

const plugins = { math };

function MessageRow({ message, streaming }: { message: ChatMessage; streaming: boolean }) {
  const text = message.parts.flatMap((part) => (part.type === "text" ? [part.text] : [])).join("\n\n");

  return (
    <Message from={message.role}>
      <MessageContent className="group-[.is-user]:text-secondary-foreground">
        {message.parts.map((part, index) =>
          part.type === "text" ? (
            <MessageResponse key={index} plugins={plugins}>
              {withMathDelimiters(part.text)}
            </MessageResponse>
          ) : part.type === "tool-searchKnowledge" ? (
            <KnowledgeSearch key={index} part={part} streaming={streaming} />
          ) : null,
        )}
      </MessageContent>
      {message.role === "assistant" && !streaming && text && (
        <MessageActions className="-ml-2">
          <CopyButton text={text} label="Copy" />
        </MessageActions>
      )}
    </Message>
  );
}

function isSearching(part: Part | undefined) {
  return part?.type === "tool-searchKnowledge" && (part.state === "input-streaming" || part.state === "input-available");
}

function KnowledgeSearch({ part, streaming }: { part: SearchPart; streaming: boolean }) {
  if (part.state === "output-available") {
    const { excerpts } = part.output;
    return (
      <SearchLine>
        <span className="truncate">Searched for “{part.input.query}”</span>
        <span className="shrink-0 tabular-nums">
          · {excerpts === 0 ? "nothing found" : `${excerpts} ${excerpts === 1 ? "excerpt" : "excerpts"}`}
        </span>
      </SearchLine>
    );
  }
  if (part.state === "output-error") return <SearchLine>Couldn’t search the coach’s knowledge</SearchLine>;
  if (!streaming) return null;
  return <Shimmer className="text-sm">Searching the coach’s knowledge...</Shimmer>;
}

function SearchLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex min-w-0 items-center gap-2 text-muted-foreground text-sm">
      <SearchIcon className="size-4 shrink-0" />
      {children}
    </p>
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
