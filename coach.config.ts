// ============================================================
//  YOUR SETTINGS
//  This is the one file you change to make the app yours.
//  Each setting has a short note above it that says what it does.
//  After you change something, save the file and push it to GitHub.
//  Vercel will update your live app in about a minute.
// ============================================================

export const coachConfig: CoachConfig = {
  // Your app's name. People see it in the browser tab and at the top of the sidebar.
  appName: "My Coaching Assistant",

  // One short sentence under the name on the home page.
  tagline: "Pick an assistant to start chatting.",

  // The email addresses of the people who run this app (usually just you).
  // These people can upload knowledge files, add clients, and have no daily limit.
  // Take an email off this list and that person is a normal client again.
  // The first time you sign in, the password you type becomes your password (16+ characters).
  // Example: adminEmails: ["you@gmail.com"],
  adminEmails: [],

  limits: {
    // How many messages ONE client can send in one day.
    messagesPerPersonPerDay: 50,

    // How many messages ALL clients together can send in one day.
    // This protects your wallet if lots of people chat at once.
    messagesTotalPerDay: 1000,
  },

  knowledge: {
    // The biggest file you can upload, in megabytes (MB).
    // If a file is bigger, split it into smaller files first.
    maxFileSizeMB: 25,
  },

  // ----------------------------------------------------------
  //  AI MODELS
  //  These are already set to good choices. Leave them alone
  //  unless you know why you want to change one.
  // ----------------------------------------------------------
  models: {
    // The AI that chats with your clients and reads your uploaded files.
    chat: "openai/gpt-6.1-sol",

    // How hard the AI thinks before answering.
    // "medium" = deeper answers (default). "low" = faster replies.
    thinking: "medium",

    // Turns your knowledge files into numbers so they can be searched.
    // If you change this, you must upload all your files again.
    embedding: "voyage/voyage-4",

    // Picks the best matches from your knowledge files for each question.
    reranker: "voyage/rerank-3",
  },
};

// ------------------------------------------------------------
//  You don't need to change anything below this line.
// ------------------------------------------------------------

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
