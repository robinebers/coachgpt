export const coachConfig: CoachConfig = {
  appName: "My Coaching Assistant",
  tagline: "Pick an assistant to start chatting.",
  // Placeholder. Replace with the coach's email during setup, or anyone can claim admin with it.
  adminEmails: ["test@replace.me"],
  limits: {
    messagesPerPersonPerDay: 50,
    messagesTotalPerDay: 1000,
  },
  knowledge: {
    maxFileSizeMB: 25,
  },
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
  limits: { messagesPerPersonPerDay: number; messagesTotalPerDay: number };
  knowledge: { maxFileSizeMB: number };
  models: {
    chat: string;
    thinking: "low" | "medium" | "high";
    embedding: string;
    reranker: string;
  };
};
