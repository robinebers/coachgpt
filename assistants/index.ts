import exampleCoach from "./example-coach/assistant";

// The list of all your assistants.
// The name on the left is the web address: yoursite.com/example-coach
// To add one: copy the "example-coach" folder, rename the copy,
// then add a line below like:  "your-assistant": yourAssistant,
export const assistants = {
  "example-coach": exampleCoach,
};

type AssistantSlug = keyof typeof assistants;

// Everything except the instructions, which stay on the server.
export function getAssistant(slug: string) {
  if (!Object.hasOwn(assistants, slug)) return null;
  const { name, description, starters } = assistants[slug as AssistantSlug];
  return { slug: slug as AssistantSlug, name, description, starters };
}
