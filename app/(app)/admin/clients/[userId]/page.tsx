import { eq } from "drizzle-orm";
import { ArrowLeftIcon, ChevronRightIcon, MessagesSquareIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAssistant } from "@/assistants";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item";
import { isAdminEmail, requireAdmin } from "@/lib/auth";
import { listChats } from "@/lib/chats";
import { db, user } from "@/lib/db";
import { cn } from "@/lib/utils";

export default async function ClientChatsPage({ params }: PageProps<"/admin/clients/[userId]">) {
  await requireAdmin();
  const { userId } = await params;
  const [person] = await db.select().from(user).where(eq(user.id, userId));
  if (!person) notFound();

  const chats = (await listChats(userId)).flatMap((chat) => {
    const assistant = getAssistant(chat.assistantSlug);
    return assistant ? [{ ...chat, assistantName: assistant.name }] : [];
  });
  const updated = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 pt-8 pb-16">
      <div className="flex flex-col gap-4">
        <Link href="/admin" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "self-start")}>
          <ArrowLeftIcon data-icon="inline-start" />
          Admin
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-lg">{person.name}</h1>
            {isAdminEmail(person.email) && <Badge variant="secondary">Admin</Badge>}
          </div>
          <p className="text-muted-foreground">{person.email}</p>
        </div>
      </div>

      {chats.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessagesSquareIcon />
            </EmptyMedia>
            <EmptyTitle>No chats yet</EmptyTitle>
            <EmptyDescription>{person.name} hasn’t started a chat.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Card className="py-0">
          <ItemGroup className="gap-0 divide-y">
            {chats.map((chat) => (
              <Item key={chat.id} render={<Link href={`/${chat.assistantSlug}/${chat.id}`} />}>
                <ItemContent>
                  <ItemTitle>{chat.title}</ItemTitle>
                  <ItemDescription>
                    {chat.assistantName} · {updated.format(chat.updatedAt)}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <ChevronRightIcon />
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        </Card>
      )}
    </main>
  );
}
