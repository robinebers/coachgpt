import { readFile } from "node:fs/promises";
import path from "node:path";
import exampleCoach from "./example-coach/assistant";

// The list of all your assistants.
// To add one: copy the "example-coach" folder, rename the copy,
// then add a line below like:  "your-folder-name": yourAssistant,
export const assistants = {
  "example-coach": exampleCoach,
};

export type AssistantSlug = keyof typeof assistants;

export function getAssistant(slug: string) {
  if (!(slug in assistants)) return null;
  return { slug: slug as AssistantSlug, ...assistants[slug as AssistantSlug] };
}

export async function getInstructions(slug: AssistantSlug) {
  return readFile(path.join(process.cwd(), "assistants", slug, "instructions.md"), "utf8");
}
