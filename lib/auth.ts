import { auth, currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { coachConfig } from "@/coach.config";

const adminEmails = coachConfig.adminEmails.map((email) => email.toLowerCase());

export async function getUser() {
  await auth.protect();
  const user = (await currentUser())!;
  const email = user.primaryEmailAddress?.emailAddress.toLowerCase() ?? "";
  return { id: user.id, email, isAdmin: adminEmails.includes(email) };
}

export async function requireAdmin() {
  const user = await getUser();
  if (!user.isAdmin) notFound();
  return user;
}
