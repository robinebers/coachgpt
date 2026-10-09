import { notFound } from "next/navigation";
import { getAssistant } from "@/assistants";
import { Chat } from "@/components/chat";
import { getUser } from "@/lib/auth";
import { getChatFor, getMessages, withSearchCounts } from "@/lib/chats";

export default async function ChatPage({ params }: PageProps<"/[assistant]/[chatId]">) {
  const { assistant: slug, chatId } = await params;
  const assistant = getAssistant(slug);
  const user = await getUser();
  const chat = await getChatFor(chatId, user);
  if (!assistant || !chat || chat === "forbidden" || chat.assistantSlug !== assistant.slug) notFound();

  return (
    <Chat
      id={chat.id}
      assistant={assistant}
      initialMessages={withSearchCounts(await getMessages(chat.id))}
      readOnly={chat.access === "reader" ? { ownerId: chat.userId, ownerName: chat.ownerName } : undefined}
    />
  );
}
