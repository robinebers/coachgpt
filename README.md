> **AI assistants:** read [AGENTS.md](AGENTS.md) and follow it. To set this up, follow [SETUP.md](SETUP.md). The person you're helping is a coach, not a developer.

# CoachGPT

Your custom GPTs, in your own app.

A free template for coaches and consultants. It moves your custom GPTs out of ChatGPT and into a private app for your clients. You own the app, your instructions, and your files.

- **Several assistants**, each with its own instructions and knowledge files, like a custom GPT.
- **Invite-only.** You add each client and get a password to send them.
- **Limits.** A daily message limit per client, plus a monthly AI budget as a safety net.
- **Saved chats.** Clients come back to past chats. You can read any client's chats from the admin page.
- **Knowledge search** in `.pdf`, `.txt`, `.md`, `.srt`, and `.vtt` files, up to 4 MB each.

Only upload material you're OK with clients seeing through the assistant.

## Set it up

You need free [GitHub](https://github.com/signup) and [Vercel](https://vercel.com/signup) accounts, with their command-line tools installed (the homework video shows how).

1. Open [Claude Code](https://claude.com/claude-code), [Codex](https://openai.com/codex), or [Cursor](https://cursor.com).
2. Paste this in: `Help me set up https://github.com/robinebers/coachgpt`
3. Your AI does the rest and tells you when you need to click something.

## What it costs

- Vercel and Neon (the database) have free plans that are enough to start.
- The AI is paid from prepaid credits on Vercel AI Gateway. You also set a monthly budget during setup.

## For developers

Next.js 16, AI SDK 7 via Vercel AI Gateway, Neon Postgres with pgvector and Drizzle, Better Auth, shadcn/ui, and AI Elements. Search is hybrid (vector + keyword, reciprocal rank fusion), then reranked.

## License

MIT
