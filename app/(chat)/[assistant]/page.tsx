import { nanoid } from "nanoid";
import { notFound } from "next/navigation";
import { getAssistant } from "@/assistants";
import { Chat } from "@/components/chat";
import { getUser } from "@/lib/auth";

export default async function NewChatPage({ params }: PageProps<"/[assistant]">) {
  await getUser();
  const assistant = getAssistant((await params).assistant);
  if (!assistant) notFound();

  const id = nanoid();
  return <Chat key={id} id={id} assistant={assistant} initialMessages={[]} />;
}
