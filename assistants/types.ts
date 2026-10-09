import type { StaticImageData } from "next/image";

export type Assistant = {
  name: string;
  description: string;
  starters: string[];
  avatar: StaticImageData;
};

// The same limit as ChatGPT's GPT editor.
export const maxInstructionsLength = 8000;
