import exampleCoach from "./example-coach/assistant";

export const assistants = {
  "example-coach": exampleCoach,
};

export type AssistantSlug = keyof typeof assistants;

// Everything except the instructions, which stay on the server.
export function getAssistant(slug: string) {
  if (!Object.hasOwn(assistants, slug)) return null;
  const { name, description, starters } = assistants[slug as AssistantSlug];
  return { slug: slug as AssistantSlug, name, description, starters };
}
