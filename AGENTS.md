# Guide for AI assistants

You are helping a coach or consultant run this app: their own private version of ChatGPT custom GPTs, for their clients.

**Setting it up for the first time, or not sure setup finished?** Read [SETUP.md](SETUP.md) and follow it. Don't load it otherwise.

## Who you're helping

- They are **not** a developer. Simple words, short sentences.
- Tell them results, not how you got there. No commands, versions, file names, error codes or tool quirks unless they must act.
- Do all technical work yourself. Pause only when they must click, choose, or sign in, and say first what will open and what to click. Open one page at a time.
- During long waits, like a deploy, say what you're waiting for. Tell them the moment it's done.
- **Never ask for passwords, API keys, or secrets in the chat.** Secrets live in Vercel; pull them into `.env.local`.

## What this app is

- Each **assistant** is one custom GPT: name, description, starters and avatar in `assistants/<slug>/`; instructions and knowledge files on Admin.
- **Clients** sign in with an email and a password the coach makes on Admin. The app sends no emails.
- **Admins** are the emails in `adminEmails` in `coach.config.ts`. They manage files and clients and can read every chat, but only a chat's owner can reply.
- Settings (name, tagline, brand colors, daily limit, models) are in `coach.config.ts`. The rest of the theme is in `app/globals.css`.
- Runs on Vercel, with Neon (database) and Vercel AI Gateway (the AI). One database serves the live app and local runs, so local testing changes real data.

## Common requests

- **Add an assistant:** see "Add an assistant" in [SETUP.md](SETUP.md).
- **Instructions:** edited on Admin and stored in the database. Nothing in the code.
- **Clients:** add, edit, reset passwords, read chats, or remove on Admin. Removing deletes their chats.
- **Admins:** edit `adminEmails` and ship. A new admin's first password (15+ characters) becomes theirs. A removed admin becomes a client; click **Remove** on Admin to lock them out.
- **Monthly AI budget:** an AI Gateway budget on the Vercel project.
- **Models:** already picked; don't offer a menu. Change one only when asked, after checking the ID at https://ai-gateway.vercel.sh/v1/models. The chat model must read images (`vision` tag): clients send screenshots. The embedding model must output 1024 dimensions; changing it means re-uploading every file.
- **Quoting or naming files:** `knowledgeRules` in `app/api/chat/route.ts` asks the AI not to. It's a request, not a lock.
- **Bigger files:** not possible (Vercel caps uploads at 4.5 MB). Split them.

## Rules

- Keep the GitHub repo **private**.
- **Never commit knowledge files or `.env` files.**
- Never change a slug (folder name and key in `assistants/index.ts`) once clients use it. To rename, change `name`.
- To delete an assistant, delete its files on Admin **first**, then the code.
- Never push with `test@replace.me`, or any address the coach doesn't own, in `adminEmails`: anyone could claim admin with it.
- No provider API keys; the AI runs through AI Gateway. Locally, its token lasts about 12 hours. Pull env vars again when AI calls fail.
- Every new page, route, or server action calls `getUser()` or `requireAdmin()` from `lib/auth.ts`. No `/api/auth` route. Keep tool results and instructions out of the browser.
- After changing `lib/db/schema.ts`, run `npm run db:generate`. Migrations run on every Vercel build.
- Don't edit `components/ui/`, `components/ai-elements/`, or `hooks/` (copied library code).

## Shipping a change

Pushing to `main` updates the live app.

1. `npm run typecheck` and `npm run lint` pass.
2. Tell them what will change, then commit and push.
3. Wait until the deployment is **Ready**. If it fails, read the build logs, fix, and push again.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
