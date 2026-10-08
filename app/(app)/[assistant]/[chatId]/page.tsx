import { notFound } from "next/navigation";
import { getAssistant } from "@/assistants";
import { Chat } from "@/components/chat";
import { getUser } from "@/lib/auth";
import { chatAccess, getChat, getMessages, withoutToolParts } from "@/lib/chats";

export default async function ChatPage({ params }: PageProps<"/[assistant]/[chatId]">) {
  const { assistant: slug, chatId } = await params;
  const assistant = getAssistant(slug);
  const user = await getUser();
  const chat = await getChat(chatId);
  const access = chat ? chatAccess(chat, user) : null;
  if (!assistant || !chat || !access || chat.assistantSlug !== assistant.slug) notFound();

  return (
    <Chat
      id={chat.id}
      assistant={assistant}
      initialMessages={withoutToolParts(await getMessages(chat.id))}
      readOnly={access === "reader" ? { ownerId: chat.userId, ownerName: chat.ownerName } : undefined}
    />
  );
}
