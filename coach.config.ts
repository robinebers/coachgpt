export const coachConfig: CoachConfig = {
  appName: "Rob's CoachGPT Template",
  tagline: "Pick an assistant to start chatting.",
  // Six-digit hex. Buttons use primary. Client messages and badges use secondary.
  colors: { primary: "#0731f8", secondary: "#ffe25a" },
  // Placeholder. Replace with the coach's email during setup, or anyone can claim admin with it.
  adminEmails: ["test@replace.me"],
  messagesPerClientPerDay: 50,
  models: {
    chat: "anthropic/claude-haiku-5.5",
    thinking: "medium",
    embedding: "voyage/voyage-4",
    reranker: "voyage/rerank-3",
  },
};

type CoachConfig = {
  appName: string;
  tagline: string;
  colors: { primary: string; secondary: string };
  adminEmails: string[];
  messagesPerClientPerDay: number;
  models: {
    chat: string;
    thinking: "low" | "medium" | "high";
    embedding: string;
    reranker: string;
  };
};
