import Image from "next/image";
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
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { getUser } from "@/lib/auth";
import type { listChats } from "@/lib/chats";

const dayMs = 24 * 60 * 60 * 1000;

// Days follow the server clock (UTC on Vercel).
function groupByDate<T extends { updatedAt: Date }>(chats: T[]) {
  const today = new Date().setUTCHours(0, 0, 0, 0);
  const groups = [
    { label: "Today", from: today, chats: [] as T[] },
    { label: "Yesterday", from: today - dayMs, chats: [] as T[] },
    { label: "Previous 7 days", from: today - 7 * dayMs, chats: [] as T[] },
    { label: "Older", from: -Infinity, chats: [] as T[] },
  ];
  for (const chat of chats) groups.find((group) => chat.updatedAt.getTime() >= group.from)?.chats.push(chat);
  return groups.filter((group) => group.chats.length > 0);
}

export async function AppSidebar({ chats }: { chats: Awaited<ReturnType<typeof listChats>> }) {
  const user = await getUser();

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <NavLink href="/" size="lg">
              <Image src="/logo.png" alt="" width={32} height={32} className="rounded-full" />
              <span className="truncate font-semibold">{coachConfig.appName}</span>
            </NavLink>
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
                    <Image src={assistant.avatar} alt="" width={20} height={20} className="rounded-full" />
                    <span>{assistant.name}</span>
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {groupByDate(chats).map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.chats.map((chat) => (
                  <ChatItem key={chat.id} chat={chat} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <NavUser name={user.name} email={user.email} isAdmin={user.isAdmin} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
