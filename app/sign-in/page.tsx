import Image from "next/image";
import { connection } from "next/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db, user } from "@/lib/db";
import { SignInForm } from "./form";

export default async function SignInPage() {
  await connection();
  // No accounts yet means this is the coach's very first sign-in.
  const firstTime = !(await db.$count(user));

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <Image src="/logo.svg" alt="" width={40} height={40} className="mb-2 rounded-lg" />
          <CardTitle>{firstTime ? "Welcome! Pick your password" : "Sign in"}</CardTitle>
          <CardDescription>
            {firstTime
              ? "Use the email this app was set up with. The password you type now becomes your password. Let your browser suggest a strong one and save it."
              : "Use the email and password your coach gave you."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignInForm firstTime={firstTime} />
        </CardContent>
      </Card>
    </main>
  );
}
