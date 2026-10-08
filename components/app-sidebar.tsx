import { LogOutIcon, MessageSquarePlusIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/sign-in/actions";
import { assistants } from "@/assistants";
import { coachConfig } from "@/coach.config";
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
  const chats = await listChats(user.id);

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/" className="px-2 py-1 font-semibold">
          {coachConfig.appName}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Assistants</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {Object.entries(assistants).map(([slug, assistant]) => (
                <SidebarMenuItem key={slug}>
                  <SidebarMenuButton render={<Link href={`/${slug}`} />}>
                    <MessageSquarePlusIcon />
                    <span>{assistant.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chats.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton render={<Link href={`/${chat.assistantSlug}/${chat.id}`} />}>
                    <span>{chat.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {user.isAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href="/admin" />}>
                <SettingsIcon />
                <span>Admin</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <form action={signOut}>
              <SidebarMenuButton type="submit">
                <LogOutIcon />
                <span>Sign out ({user.name})</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
