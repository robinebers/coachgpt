"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, createAccount, isAdminEmail } from "@/lib/auth";
import { db, user } from "@/lib/db";

export async function signIn(_: string | null, formData: FormData) {
  const email = String(formData.get("email")).toLowerCase();
  const password = String(formData.get("password"));
  // An admin's first sign-in creates their account with the password they typed.
  if (isAdminEmail(email) && !(await db.$count(user, eq(user.email, email)))) {
    if (password.length < 16) return "Pick a password with at least 16 characters.";
    await createAccount(email, email.split("@")[0], password);
  }
  try {
    await auth.api.signInEmail({ body: { email, password } });
  } catch {
    return "Wrong email or password.";
  }
  redirect("/");
}

export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/sign-in");
}
