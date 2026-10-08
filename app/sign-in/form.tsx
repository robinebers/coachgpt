"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn } from "./actions";

export function SignInForm({ firstTime }: { firstTime: boolean }) {
  const [error, action, pending] = useActionState(signIn, null);

  return (
    <form action={action} className="flex flex-col gap-3">
      <Input name="email" type="email" placeholder="Email" autoComplete="email" required />
      <Input
        name="password"
        type="password"
        placeholder="Password"
        autoComplete={firstTime ? "new-password" : "current-password"}
        required
      />
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
