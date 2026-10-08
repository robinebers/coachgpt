"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, createAccount, isAdminEmail } from "@/lib/auth";
import { db, user } from "@/lib/db";

type SignInState = { error: string; email: string } | null;

export async function signIn(_: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email")).toLowerCase();
  const password = String(formData.get("password"));
  // An admin's first sign-in creates their account with the password they typed.
  if (isAdminEmail(email) && !(await db.$count(user, eq(user.email, email)))) {
    // 15, because that's the length of the passwords Chrome suggests.
    if (password.length < 15) return { error: "Pick a password with at least 15 characters.", email };
    await createAccount(email, email.split("@")[0], password);
  }
  try {
    await auth.api.signInEmail({ body: { email, password } });
  } catch {
    const error = (await db.$count(user)) ? "Wrong email or password." : "That's not the email this app was set up with.";
    return { error, email };
  }
  redirect("/");
}

export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/sign-in");
}
