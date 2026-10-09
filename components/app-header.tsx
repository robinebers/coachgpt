"use client";

import { SquarePenIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getAssistant } from "@/assistants";
import { IconButton } from "@/components/icon-button";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function AppHeader() {
  const [slug, chatId] = usePathname().split("/").slice(1);
  const assistant = chatId ? getAssistant(slug) : null;

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 px-3">
      <SidebarTrigger />
      {assistant && (
        <>
          <Image src={assistant.avatar} alt="" width={20} height={20} className="rounded-full" />
          <span className="min-w-0 flex-1 truncate font-medium text-sm">{assistant.name}</span>
          <IconButton label="New chat" nativeButton={false} render={<Link href={`/${assistant.slug}`} />}>
            <SquarePenIcon />
          </IconButton>
        </>
      )}
    </header>
  );
}
