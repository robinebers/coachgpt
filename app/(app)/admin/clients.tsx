"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { removeClient, resetPassword, saveClient } from "./actions";

function showPassword(email: string, password: string) {
  toast.success(`Password for ${email}: ${password}`, {
    id: email,
    description: "Send it to them now. It won't be shown again.",
    duration: Infinity,
    action: { label: "Copy", onClick: () => navigator.clipboard.writeText(password) },
  });
}

type Client = { id: string; name: string; email: string; isAdmin: boolean };

export function ClientRow({ client }: { client?: Client }) {
  async function save(formData: FormData) {
    const { error, password } = await saveClient(client?.id, formData);
    if (error) toast.error(error);
    else if (password) showPassword(String(formData.get("email")), password);
    else toast.success("Saved");
  }

  return (
    <form action={save} className="flex items-center gap-2">
      <Input name="name" defaultValue={client?.name} placeholder="Name" required />
      <Input name="email" type="email" defaultValue={client?.email} placeholder="Email" required />
      <Button type="submit" variant={client ? "ghost" : "default"} size="sm">
        {client ? "Save" : "Add"}
      </Button>
      {client && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={async () => showPassword(client.email, await resetPassword(client.id))}
        >
          Reset password
        </Button>
      )}
      {client && !client.isAdmin && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => confirm(`Remove ${client.email}? Their chats are deleted too.`) && removeClient(client.id)}
        >
          Remove
        </Button>
      )}
    </form>
  );
}
