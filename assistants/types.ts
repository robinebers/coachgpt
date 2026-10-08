export type Assistant = {
  name: string;
  description: string;
  starters: string[];
};

// The same limit as ChatGPT's GPT editor.
export const maxInstructionsLength = 8000;
