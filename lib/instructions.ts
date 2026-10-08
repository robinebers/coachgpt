import { eq } from "drizzle-orm";
import { type AssistantSlug, assistants } from "@/assistants";
import { assistantInstructions, db } from "@/lib/db";

export async function getInstructions(slug: AssistantSlug) {
  const [saved] = await db
    .select({ text: assistantInstructions.instructions })
    .from(assistantInstructions)
    .where(eq(assistantInstructions.assistantSlug, slug));
  return saved ? { text: saved.text, edited: true } : { text: assistants[slug].instructions, edited: false };
}
