"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addClient, removeClient, resetPassword } from "./actions";

function showPassword(email: string, result: Awaited<ReturnType<typeof addClient>>) {
  if ("error" in result) {
    toast.error(result.error);
    return;
  }
  toast.success(`Password for ${email}: ${result.password}`, {
    id: email,
    description: "Send it to them now. It won't be shown again.",
    duration: Infinity,
    action: { label: "Copy", onClick: () => navigator.clipboard.writeText(result.password) },
  });
}

export function AddClientForm() {
  return (
    <form
      className="grid gap-2 sm:grid-cols-[1fr_1fr_2fr_auto]"
      action={async (formData) => showPassword(String(formData.get("email")), await addClient(formData))}
    >
      <Input name="firstName" placeholder="First name" required />
      <Input name="lastName" placeholder="Last name" required />
      <Input name="email" type="email" placeholder="Email" required />
      <Button type="submit">Add</Button>
    </form>
  );
}

export function ResetPasswordButton({ userId, email }: { userId: string; email: string }) {
  return (
    <Button variant="ghost" size="sm" onClick={async () => showPassword(email, await resetPassword(userId))}>
      Reset password
    </Button>
  );
}

export function RemoveButton({ userId, email }: { userId: string; email: string }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => confirm(`Remove ${email}? Their chats are deleted too.`) && removeClient(userId)}
    >
      Remove
    </Button>
  );
}
