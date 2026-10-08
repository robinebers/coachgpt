import { notFound } from "next/navigation";
import { getAssistant } from "@/assistants";
import { Chat } from "@/components/chat";
import { getUser } from "@/lib/auth";
import { getChat, getMessages } from "@/lib/chats";

export default async function ChatPage({ params }: PageProps<"/[assistant]/[chatId]">) {
  const { assistant: slug, chatId } = await params;
  const assistant = getAssistant(slug);
  const user = await getUser();
  const chat = await getChat(chatId, user.id);
  if (!assistant || !chat || chat.assistantSlug !== assistant.slug) notFound();

  return <Chat id={chat.id} assistant={assistant} initialMessages={await getMessages(chat.id)} />;
}
