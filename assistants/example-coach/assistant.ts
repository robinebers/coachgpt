import type { Assistant } from "../types";

// This is one assistant. It is like one custom GPT.
// The folder name ("example-coach") is its web address: yoursite.com/example-coach
// The AI's instructions live next to this file, in instructions.md.

export default {
  // The name people see on the home page and at the top of the chat.
  name: "Example Coach",

  // One sentence that says what this assistant helps with.
  description: "Helps clients set goals and plan their week.",

  // Buttons people can tap to start a chat. Keep them short. Up to 4 is best.
  starters: [
    "Help me set a goal for this month",
    "Plan my week with me",
    "I feel stuck. Where do I start?",
  ],
} satisfies Assistant;
