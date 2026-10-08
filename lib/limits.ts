import type { LanguageModelUsage } from "ai";
import { and, eq, sql, sum } from "drizzle-orm";
import { coachConfig } from "@/coach.config";
import { db, usage } from "@/lib/db";

// Days are counted in UTC.
export function today() {
  return new Date().toISOString().slice(0, 10);
}

export async function getUsageToday() {
  const [row] = await db
    .select({
      messages: sum(usage.messages).mapWith(Number),
      inputTokens: sum(usage.inputTokens).mapWith(Number),
      outputTokens: sum(usage.outputTokens).mapWith(Number),
      people: sql<number>`count(*)`.mapWith(Number),
    })
    .from(usage)
    .where(eq(usage.day, today()));
  return {
    messages: row?.messages ?? 0,
    inputTokens: row?.inputTokens ?? 0,
    outputTokens: row?.outputTokens ?? 0,
    people: row?.people ?? 0,
  };
}

export async function checkLimits(userId: string) {
  const { messagesPerPersonPerDay, messagesTotalPerDay } = coachConfig.limits;
  const [[mine], total] = await Promise.all([
    db
      .select({ messages: usage.messages })
      .from(usage)
      .where(and(eq(usage.userId, userId), eq(usage.day, today()))),
    getUsageToday(),
  ]);
  if ((mine?.messages ?? 0) >= messagesPerPersonPerDay) {
    return "You reached today's message limit. Please come back tomorrow.";
  }
  if (total.messages >= messagesTotalPerDay) {
    return "The assistant is very busy today. Please come back tomorrow.";
  }
  return null;
}

export async function recordUsage(userId: string, tokens: LanguageModelUsage) {
  const inputTokens = tokens.inputTokens ?? 0;
  const outputTokens = tokens.outputTokens ?? 0;
  await db
    .insert(usage)
    .values({ userId, day: today(), messages: 1, inputTokens, outputTokens })
    .onConflictDoUpdate({
      target: [usage.userId, usage.day],
      set: {
        messages: sql`${usage.messages} + 1`,
        inputTokens: sql`${usage.inputTokens} + ${inputTokens}`,
        outputTokens: sql`${usage.outputTokens} + ${outputTokens}`,
      },
    });
}
