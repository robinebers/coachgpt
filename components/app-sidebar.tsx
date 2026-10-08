import { MessageSquarePlusIcon, SettingsIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { assistants } from "@/assistants";
import { coachConfig } from "@/coach.config";
import { ChatItem, NavLink } from "@/components/nav-links";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { getUser } from "@/lib/auth";
import { listChats } from "@/lib/chats";

export async function AppSidebar() {
  const user = await getUser();
  const chats = (await listChats(user.id, 100)).filter((chat) => chat.assistantSlug in assistants);

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />}>
              <Image src="/logo.svg" alt="" width={32} height={32} className="rounded-lg" />
              <span className="truncate font-semibold">{coachConfig.appName}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Assistants</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {Object.entries(assistants).map(([slug, assistant]) => (
                <SidebarMenuItem key={slug}>
                  <NavLink href={`/${slug}`}>
                    <MessageSquarePlusIcon />
                    <span>{assistant.name}</span>
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {chats.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Chats</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {chats.map((chat) => (
                  <ChatItem key={chat.id} chat={chat} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {user.isAdmin && (
            <SidebarMenuItem>
              <NavLink href="/admin">
                <SettingsIcon />
                <span>Admin</span>
              </NavLink>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <NavUser name={user.name} email={user.email} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
