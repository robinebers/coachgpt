"use client";

import { Chat as AIChat, useChat } from "@ai-sdk/react";
import { math } from "@streamdown/math";
import { DefaultChatTransport } from "ai";
import { ImagePlusIcon, SearchIcon, XIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
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
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { CopyButton } from "@/components/copy-button";
import { buttonVariants } from "@/components/ui/button";
import type { ChatMessage } from "@/lib/chats";
import { imageTypes, maxImagesPerMessage } from "@/lib/file-types";
import { shrinkImage } from "@/lib/shrink-image";
import { cn } from "@/lib/utils";

type Part = ChatMessage["parts"][number];
type SearchPart = Extract<Part, { type: "tool-searchKnowledge" }>;

type ChatProps = {
  id: string;
  assistant: Assistant & { slug: string };
  initialMessages: ChatMessage[];
  readOnly?: { ownerId: string; ownerName: string };
};

// A new chat hands its running conversation to the chat page it moves to.
let handoff: AIChat<ChatMessage> | undefined;

export function Chat({ id, assistant, initialMessages, readOnly }: ChatProps) {
  const router = useRouter();
  const address = `/${assistant.slug}/${id}`;
  const [{ chat, handedOver }] = useState(() =>
    handoff?.id === id
      ? { chat: handoff, handedOver: true }
      : {
          chat: new AIChat<ChatMessage>({
            id,
            messages: initialMessages,
            transport: new DefaultChatTransport({
              api: "/api/chat",
              prepareSendMessagesRequest: ({ id, messages }) => ({
                body: { id, assistant: assistant.slug, message: messages.at(-1) },
              }),
            }),
            // Only while this chat is on screen: refreshing a new-chat page would replace it, and anything typed there.
            onFinish: () => {
              if (window.location.pathname === address) router.refresh();
            },
          }),
          handedOver: false,
        },
  );
  const { messages, sendMessage, status, stop, error } = useChat({ chat });

  // A new chat moves to its own page once the server has saved it. That page takes over this
  // conversation mid-answer, so nothing reloads and Back and New chat see the real page.
  useEffect(() => {
    if (initialMessages.length === 0 && status === "streaming" && window.location.pathname === address) {
      handoff = chat;
      router.refresh();
    }
  }, [initialMessages.length, status, address, chat, router]);
  useEffect(() => {
    if (handedOver && handoff === chat) handoff = undefined;
  }, [handedOver, chat]);

  function start(message: Parameters<typeof sendMessage>[0]) {
    if (messages.length === 0) window.history.replaceState(null, "", address);
    return sendMessage(message);
  }

  const busy = status === "submitted" || status === "streaming";
  const last = messages.at(-1);
  const lastPart = last?.role === "assistant" ? last.parts.at(-1) : undefined;
  const thinking = busy && lastPart?.type !== "text" && !isSearching(lastPart);

  // Stays true until the answer ends. `busy` lags a render behind, so a quick second Enter would get through.
  const sending = useRef(false);

  // Throwing keeps the text and images in the box, so nothing typed is lost.
  async function send({ text, files }: PromptInputMessage) {
    if (busy || sending.current) throw new Error("Still answering");
    if (!text.trim() && files.length === 0) return;
    sending.current = true;
    const images = await Promise.all(files.map(shrinkImage)).catch((error) => {
      sending.current = false;
      toast.error("That image couldn't be used. Try a PNG or JPEG screenshot.");
      throw error;
    });
    void start(text.trim() ? { text, files: images } : { files: images }).finally(() => {
      sending.current = false;
    });
  }

  const composer = (autoFocus: boolean) => (
    <PromptInputProvider>
      <PromptInput
        accept={imageTypes.join(",")}
        multiple
        maxFiles={maxImagesPerMessage}
        onError={({ code, message }) => toast.error(message, { id: code })}
        onSubmit={send}
      >
        <ImagePreviews />
        <PromptInputBody>
          <PromptInputTextarea placeholder={`Message ${assistant.name}`} autoFocus={autoFocus} />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools>
            <AddImagesButton />
          </PromptInputTools>
          <PromptInputSubmit status={status} onStop={stop} />
        </PromptInputFooter>
      </PromptInput>
    </PromptInputProvider>
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
            <Suggestion key={starter} suggestion={starter} onClick={(text) => void start({ text })} />
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
          // Keeps the cursor in the box while a chat started on this screen gets going.
          composer(initialMessages.length === 0 || handedOver)
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
          ) : part.type === "file" && part.mediaType.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element -- Next's image optimizer can't load these: they need the viewer's sign-in.
            <img key={index} src={part.url} alt="" loading="lazy" className="max-h-64 max-w-full self-start rounded-md" />
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

function AddImagesButton() {
  const attachments = usePromptInputAttachments();
  return (
    <PromptInputButton aria-label="Add images" title="Add images" onClick={attachments.openFileDialog}>
      <ImagePlusIcon />
    </PromptInputButton>
  );
}

function ImagePreviews() {
  const { files, remove } = usePromptInputAttachments();
  if (files.length === 0) return null;
  return (
    <PromptInputHeader className="gap-2 pt-3">
      {files.map((file) => (
        <div key={file.id} className="relative">
          <Image
            src={file.url}
            alt=""
            width={56}
            height={56}
            unoptimized
            className="size-14 rounded-md border object-cover"
          />
          <button
            type="button"
            aria-label="Remove image"
            onClick={() => remove(file.id)}
            className="-top-1.5 -right-1.5 absolute rounded-full border bg-background p-0.5 shadow-sm"
          >
            <XIcon className="size-3" />
          </button>
        </div>
      ))}
    </PromptInputHeader>
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
