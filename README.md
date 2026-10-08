> **Note for AI assistants (Claude Code, Cursor, and others):** Read [AGENTS.md](AGENTS.md) now and follow it. The person you are helping is a coach, not a developer. Guide them one small step at a time, in plain words.

# CoachGPT

Your custom GPTs, in your own app.

This is a ready-made template for online coaches and consultants. It moves your custom GPTs out of ChatGPT and into a private app that you own. Your instructions and your files stay with you.

What you get:

- **Several assistants.** Each one has its own instructions and knowledge files, just like a custom GPT.
- **Invite-only login.** You add each client and get a password to send them. Nobody else can get in.
- **Daily limits.** Set a limit for each person and for everyone together, so your costs never surprise you.
- **Saved chats.** Clients can come back to past conversations in the sidebar.
- **Smart search.** The assistant finds the right part of your knowledge files. Supports `.pdf`, `.txt`, `.md`, `.srt`, and `.vtt`.

## The easy way to set it up

1. Open [Claude Code](https://claude.com/claude-code) or [Cursor](https://cursor.com).
2. Paste this into the chat:

   ```
   Help me set up https://github.com/robinebers/coachgpt
   ```

3. Your AI reads the setup guide and walks you through each step.

You need free [GitHub](https://github.com/signup) and [Vercel](https://vercel.com/signup) accounts, with their command-line tools installed (the homework video shows how). Your AI does the rest, including the database and file storage.

📺 **Video walkthrough:** coming soon.

## What it costs

- Vercel, Neon, and Blob all have free plans that are enough to start.
- The AI is paid through Vercel AI Gateway, per message. You set a monthly budget during setup, so you can't overspend.

## For developers

Next.js 16, AI SDK 7 through Vercel AI Gateway, Neon Postgres with pgvector and Drizzle, Better Auth, Vercel Blob, shadcn/ui, and AI Elements. Search is hybrid (vector + keyword, merged with reciprocal rank fusion) and then reranked. See [AGENTS.md](AGENTS.md) for the file map.

## License

MIT
