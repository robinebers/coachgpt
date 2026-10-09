"use client";

import { SquarePenIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getAssistant } from "@/assistants";
import { IconButton } from "@/components/icon-button";
import { SidebarTrigger } from "@/components/ui/sidebar";

// `titles` holds the viewer's own chats, so an admin reading a client's chat sees only the assistant.
export function AppHeader({ titles }: { titles: Record<string, string> }) {
  const [slug, chatId] = usePathname().split("/").slice(1);
  const assistant = chatId ? getAssistant(slug) : null;
  const title = titles[chatId];

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 px-3">
      <SidebarTrigger />
      {assistant && (
        <>
          <Image src={assistant.avatar} alt="" width={20} height={20} className="rounded-full" />
          <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
            <span className="shrink-0 font-medium">{assistant.name}</span>
            {title && (
              <>
                <span aria-hidden className="text-muted-foreground">
                  /
                </span>
                <span className="max-w-64 truncate text-muted-foreground">{title}</span>
              </>
            )}
          </div>
          <IconButton label="New chat" nativeButton={false} render={<Link href={`/${assistant.slug}`} />}>
            <SquarePenIcon />
          </IconButton>
        </>
      )}
    </header>
  );
}
