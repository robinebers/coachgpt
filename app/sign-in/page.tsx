"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { signIn } from "./actions";

export default function SignInPage() {
  const [error, action, pending] = useActionState(signIn, null);

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Use the email and password your coach gave you.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="flex flex-col gap-3">
            <Input name="email" type="email" placeholder="Email" autoComplete="email" required />
            <Input name="password" type="password" placeholder="Password" autoComplete="current-password" required />
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" disabled={pending}>
              {pending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
