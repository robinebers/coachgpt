import { assistants } from "@/assistants";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getUser } from "@/lib/auth";
import { listChats } from "@/lib/chats";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getUser();
  const chats = (await listChats(user.id, 100)).filter((chat) => chat.assistantSlug in assistants);

  return (
    <SidebarProvider>
      <AppSidebar chats={chats} />
      <SidebarInset className="h-svh">
        <AppHeader titles={Object.fromEntries(chats.map((chat) => [chat.id, chat.title]))} />
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
