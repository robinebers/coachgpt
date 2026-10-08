"use client";

import { ChevronsUpDownIcon, LogOutIcon } from "lucide-react";
import { signOut } from "@/app/sign-in/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";

export function NavUser({ name, email }: { name: string; email: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<SidebarMenuButton size="lg" />}>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-medium">{name}</span>
          <span className="truncate text-muted-foreground text-xs">{email}</span>
        </div>
        <ChevronsUpDownIcon className="ml-auto" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-(--anchor-width)">
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOutIcon />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
