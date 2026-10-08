"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
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
import { Source, Sources, SourcesContent, SourcesTrigger } from "@/components/ai-elements/sources";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";

type ChatProps = {
  id: string;
  assistant: { slug: string; name: string; description: string; starters: string[] };
  initialMessages: UIMessage[];
};

export function Chat({ id, assistant, initialMessages }: ChatProps) {
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

  function send(text: string) {
    if (!text.trim() || busy) return;
    if (messages.length === 0) window.history.replaceState(null, "", `/${assistant.slug}/${id}`);
    void sendMessage({ text });
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col p-4">
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState title={assistant.name} description={assistant.description} />
          ) : (
            messages.map((message) => <ChatMessage key={message.id} message={message} />)
          )}
          {error && <p className="text-destructive text-sm">{error.message}</p>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="flex flex-col gap-3">
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
      </div>
    </div>
  );
}

function ChatMessage({ message }: { message: UIMessage }) {
  const files = new Set<string>();
  for (const part of message.parts) {
    if (part.type === "tool-searchKnowledge" && part.state === "output-available") {
      for (const result of part.output as { file: string }[]) files.add(result.file);
    }
  }

  return (
    <Message from={message.role}>
      <MessageContent>
        {files.size > 0 && (
          <Sources>
            <SourcesTrigger count={files.size} />
            <SourcesContent>
              {[...files].map((file) => (
                <Source key={file} title={file} />
              ))}
            </SourcesContent>
          </Sources>
        )}
        {message.parts.map((part, index) =>
          part.type === "text" ? <MessageResponse key={index}>{part.text}</MessageResponse> : null,
        )}
      </MessageContent>
    </Message>
  );
}
