import { eq, sql, sum } from "drizzle-orm";
import { coachConfig } from "@/coach.config";
import { db, usage } from "@/lib/db";

// Days are counted in UTC.
function today() {
  return new Date().toISOString().slice(0, 10);
}

export async function getUsageToday() {
  const [row] = await db
    .select({
      messages: sum(usage.messages).mapWith(Number),
      people: sql<number>`count(*)`.mapWith(Number),
    })
    .from(usage)
    .where(eq(usage.day, today()));
  return { messages: row?.messages ?? 0, people: row?.people ?? 0 };
}

// Counts one message. Returns a friendly message if a daily limit is reached.
export async function countMessage(userId: string) {
  const { messagesPerPersonPerDay, messagesTotalPerDay } = coachConfig.limits;
  if ((await getUsageToday()).messages >= messagesTotalPerDay) {
    return "The assistant is very busy today. Please come back tomorrow.";
  }
  const counted = await db
    .insert(usage)
    .values({ userId, day: today(), messages: 1 })
    .onConflictDoUpdate({
      target: [usage.userId, usage.day],
      set: { messages: sql`${usage.messages} + 1` },
      setWhere: sql`${usage.messages} < ${messagesPerPersonPerDay}`,
    })
    .returning({ messages: usage.messages });
  if (counted.length === 0) return "You reached today's message limit. Please come back tomorrow.";
  return null;
}
