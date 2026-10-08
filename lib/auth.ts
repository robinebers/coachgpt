import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";

export const auth = betterAuth({
  // Reuses the database password, so there is no extra secret to set up.
  secret: process.env.DATABASE_URL,
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true, disableSignUp: true },
  // 30 days instead of 7, because only the coach can hand out a new password.
  session: { expiresIn: 60 * 60 * 24 * 30 },
  plugins: [nextCookies()],
});

const adminEmails = process.env.ADMIN_EMAILS!.toLowerCase().split(",").map((email) => email.trim());
export const isAdminEmail = (email: string) => adminEmails.includes(email);

// Sign-up is off, so this is the only way accounts get made.
export async function createAccount(email: string, name: string, password: string) {
  const ctx = await auth.$context;
  const { id } = await ctx.internalAdapter.createUser({ email, name }, { method: "admin" });
  await ctx.internalAdapter.linkAccount({
    userId: id,
    providerId: "credential",
    accountId: id,
    password: await ctx.password.hash(password),
  });
}

// Also signs them out everywhere, so an old password stops working right away.
export async function setPassword(userId: string, password: string) {
  const ctx = await auth.$context;
  await ctx.internalAdapter.updatePassword(userId, await ctx.password.hash(password));
  await ctx.internalAdapter.deleteUserSessions(userId);
}

export async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  const { id, name, email } = session.user;
  return { id, name, isAdmin: isAdminEmail(email) };
}

export async function requireAdmin() {
  const user = await getUser();
  if (!user.isAdmin) notFound();
  return user;
}
