import exampleCoach from "./example-coach/assistant";

export const assistants = {
  "example-coach": exampleCoach,
};

export type AssistantSlug = keyof typeof assistants;

export function getAssistant(slug: string) {
  if (!Object.hasOwn(assistants, slug)) return null;
  return { slug: slug as AssistantSlug, ...assistants[slug as AssistantSlug] };
}
