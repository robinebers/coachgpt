import { sql } from "drizzle-orm";
import { coachConfig } from "@/coach.config";
import { db, usage } from "@/lib/db";

export async function countMessage(userId: string) {
  const counted = await db
    .insert(usage)
    // Days are counted in UTC.
    .values({ userId, day: new Date().toISOString().slice(0, 10), messages: 1 })
    .onConflictDoUpdate({
      target: [usage.userId, usage.day],
      set: { messages: sql`${usage.messages} + 1` },
      setWhere: sql`${usage.messages} < ${coachConfig.messagesPerClientPerDay}`,
    })
    .returning({ messages: usage.messages });
  if (counted.length === 0) return "You reached today's message limit. Please come back tomorrow.";
  return null;
}
