export const coachConfig: CoachConfig = {
  appName: "My Coaching Assistant",
  tagline: "Pick an assistant to start chatting.",
  // Placeholder. Replace with the coach's email during setup, or anyone can claim admin with it.
  adminEmails: ["test@replace.me"],
  messagesPerClientPerDay: 50,
  models: {
    chat: "openai/gpt-6.1-sol",
    thinking: "medium",
    embedding: "voyage/voyage-4",
    reranker: "voyage/rerank-3",
  },
};

type CoachConfig = {
  appName: string;
  tagline: string;
  adminEmails: string[];
  messagesPerClientPerDay: number;
  models: {
    chat: string;
    thinking: "low" | "medium" | "high";
    embedding: string;
    reranker: string;
  };
};
