"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inviteUser } from "./actions";

export function InviteForm() {
  const [pending, setPending] = useState(false);

  return (
    <form
      className="flex gap-2"
      action={async (formData) => {
        const email = String(formData.get("email"));
        setPending(true);
        try {
          await inviteUser(email);
          toast.success(`Invite sent to ${email}`);
        } catch (error) {
          toast.error((error as Error).message);
        } finally {
          setPending(false);
        }
      }}
    >
      <Input name="email" type="email" placeholder="client@example.com" required />
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send invite"}
      </Button>
    </form>
  );
}
