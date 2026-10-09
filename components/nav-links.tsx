"use client";

import { MoreHorizontalIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { deleteChat } from "@/app/(app)/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuAction, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";

export function NavLink({
  href,
  children,
  size,
}: {
  href: string;
  children: React.ReactNode;
  size?: React.ComponentProps<typeof SidebarMenuButton>["size"];
}) {
  const { setOpenMobile } = useSidebar();
  return (
    <SidebarMenuButton
      size={size}
      isActive={usePathname() === href}
      render={<Link href={href} onClick={() => setOpenMobile(false)} />}
    >
      {children}
    </SidebarMenuButton>
  );
}

export function ChatItem({ chat }: { chat: { id: string; title: string; assistantSlug: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const href = `/${chat.assistantSlug}/${chat.id}`;

  return (
    <SidebarMenuItem>
      <NavLink href={href}>
        <span>{chat.title}</span>
      </NavLink>
      <DropdownMenu>
        <DropdownMenuTrigger render={<SidebarMenuAction showOnHover aria-label="Chat actions" />}>
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-36">
          <DropdownMenuItem variant="destructive" onClick={() => setConfirming(true)}>
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Delete this chat?"
        description="The whole conversation is deleted. This can't be undone."
        action="Delete"
        onConfirm={async () => {
          await deleteChat(chat.id);
          if (pathname === href) router.push(`/${chat.assistantSlug}`);
        }}
      />
    </SidebarMenuItem>
  );
}
