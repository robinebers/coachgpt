export type Assistant = {
  name: string;
  description: string;
  starters: string[];
  instructions: string;
};

// The same limit as ChatGPT's GPT editor.
export const maxInstructionsLength = 8000;
