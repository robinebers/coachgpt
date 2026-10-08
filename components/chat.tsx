"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
} from "@/components/ai-elements/prompt-input";
import { Source, Sources, SourcesContent, SourcesTrigger } from "@/components/ai-elements/sources";
import { Button } from "@/components/ui/button";

type ChatProps = {
  id: string;
  assistant: { slug: string; name: string; description: string; starters: string[] };
  initialMessages: UIMessage[];
};

export function Chat({ id, assistant, initialMessages }: ChatProps) {
  const router = useRouter();
  const [input, setInput] = useState("");
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

  function send(text: string) {
    if (!text.trim()) return;
    if (messages.length === 0) window.history.replaceState(null, "", `/${assistant.slug}/${id}`);
    void sendMessage({ text });
    setInput("");
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col p-4">
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState>
              <div className="flex flex-col items-center gap-3">
                <h2 className="font-medium text-lg">{assistant.name}</h2>
                <p className="text-muted-foreground text-sm">{assistant.description}</p>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  {assistant.starters.map((starter) => (
                    <Button key={starter} variant="outline" size="sm" onClick={() => send(starter)}>
                      {starter}
                    </Button>
                  ))}
                </div>
              </div>
            </ConversationEmptyState>
          ) : (
            messages.map((message) => <ChatMessage key={message.id} message={message} />)
          )}
          {error && <p className="text-destructive text-sm">{error.message}</p>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <PromptInput onSubmit={({ text }) => send(text)} className="mt-4">
        <PromptInputBody>
          <PromptInputTextarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={`Message ${assistant.name}`}
          />
        </PromptInputBody>
        <PromptInputFooter className="justify-end">
          <PromptInputSubmit status={status} onStop={stop} disabled={!input.trim() && status === "ready"} />
        </PromptInputFooter>
      </PromptInput>
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
