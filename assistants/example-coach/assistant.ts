import type { Assistant } from "../types";
import avatar from "./avatar.png";

export default {
  name: "Example Coach",
  description: "Helps clients set goals and plan their week.",
  starters: [
    "Help me set a goal for this month",
    "Plan my week with me",
    "I feel stuck. Where do I start?",
  ],
  avatar,
} satisfies Assistant;
