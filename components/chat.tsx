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
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning";
import { Shimmer } from "@/components/ai-elements/shimmer";
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
  const last = messages.at(-1);
  const thinking = busy && !(last?.role === "assistant" && last.parts.at(-1)?.type === "text");

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
            messages.map((message) => (
              <ChatMessage key={message.id} message={message} thinking={thinking && message === last} />
            ))
          )}
          {thinking && !(last?.role === "assistant" && thoughtsOf(last)) && (
            <Shimmer className="text-sm">Thinking...</Shimmer>
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

function thoughtsOf(message: UIMessage) {
  return message.parts.flatMap((part) => (part.type === "reasoning" && part.text ? [part.text] : [])).join("\n\n");
}

function ChatMessage({ message, thinking }: { message: UIMessage; thinking: boolean }) {
  const thoughts = thoughtsOf(message);

  return (
    <Message from={message.role}>
      <MessageContent>
        {thoughts && (
          <Reasoning isStreaming={thinking}>
            <ReasoningTrigger
              getThinkingMessage={(streaming, seconds) =>
                streaming ? (
                  <Shimmer duration={1}>Thinking...</Shimmer>
                ) : seconds && seconds > 1 ? (
                  `Thought for ${seconds} seconds`
                ) : (
                  "Show thinking"
                )
              }
            />
            <ReasoningContent>{thoughts}</ReasoningContent>
          </Reasoning>
        )}
        {message.parts.map((part, index) =>
          part.type === "text" ? <MessageResponse key={index}>{part.text}</MessageResponse> : null,
        )}
      </MessageContent>
    </Message>
  );
}
