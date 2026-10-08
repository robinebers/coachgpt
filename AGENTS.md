# Guide for AI assistants

You are helping a coach or consultant run this app: their own private version of ChatGPT custom GPTs, for their clients.

**Setting it up for the first time, or not sure setup finished?** Read [SETUP.md](SETUP.md) and follow it. Don't load it otherwise.

## Who you're helping

- They are **not** a developer. Use simple words and short sentences. Explain any tech word in a few words.
- Do the technical work yourself: files, commands, git. Pause only when they must act (click, choose, sign in). Before anything opens in their browser, say in one sentence what it is and what to click.
- **Never ask them to paste passwords, API keys, or secrets into the chat.** Secrets live in Vercel. Use `vercel env pull .env.local` if you need them locally.

## What this app is

- Each **assistant** is one custom GPT: name, description, starters (`assistants/<slug>/assistant.ts`), instructions (`assistants/<slug>/instructions.md`), and knowledge files (uploaded on `/admin`).
- **Clients** sign in with an email and a password the coach makes on `/admin`. The app sends no emails.
- **Admins** are the emails in `adminEmails` in `coach.config.ts`. They can open `/admin` to manage files and clients, and read every chat. Only a chat's owner can reply in it.
- App settings (name, tagline, daily message limit, models) are in `coach.config.ts`.
- It runs on Vercel, with Neon (database) and Vercel AI Gateway (the AI).

## Common requests

- **Add an assistant / move a GPT over:** follow "Move a custom GPT over" in [SETUP.md](SETUP.md).
- **Instructions:** the coach can edit them with **Instructions** on `/admin`. Saved edits win over `instructions.md`, so changing the file does nothing until they click **Use the original** and **Save** there.
- **Clients:** add, edit, reset a password, read chats, or remove one on `/admin`. Removing a client deletes their chats.
- **Admins:** add or remove the email in `adminEmails`. A new admin with no account signs in as soon as the update is live: the first password they type (15+ characters) becomes theirs. Someone who already has an account keeps their password. A removed admin becomes a client; once the update is live, click **Remove** on `/admin` to lock them out.
- **Monthly AI budget:** `vercel ai-gateway budgets set project <project> --limit <dollars>`, then check it with `vercel ai-gateway budgets inspect project <project>`.
- **Models:** already picked. Don't offer a menu. Change one only when asked, and check the ID at https://ai-gateway.vercel.sh/v1/models first. The embedding model must make 1024-number vectors; changing it means uploading every file again.
- **Quoting or naming files:** `knowledgeRules` in `app/api/chat/route.ts` asks the AI to use the files in its own words and not quote or name them. That's a request to the AI, not a lock. Raw search results never reach the browser.
- **Bigger files:** not possible (Vercel caps uploads at 4.5 MB). Split the file.

## Rules

- Keep the GitHub repo **private**.
- **Never commit knowledge files or `.env` files.** Knowledge files are uploaded on `/admin` only.
- Tell coaches plainly: **only upload material you're OK with clients seeing through the assistant.**
- Never change an assistant's slug (its folder name and key in `assistants/index.ts`) once clients use it: chats and files are tied to it. To rename, change `name` only.
- To delete an assistant, delete its files on `/admin` **first**, then remove the code.
- Never push with `test@replace.me` (or any address the coach doesn't own) in `adminEmails`: anyone could claim admin with it.
- No provider API keys. The AI runs through Vercel AI Gateway. Locally, the token from `vercel env pull` lasts about 12 hours; pull again if AI calls fail.
- Every new page, route, or server action must call `getUser()` or `requireAdmin()` from `lib/auth.ts`. Don't add an `/api/auth` route. Keep tool results and assistant instructions out of the browser.
- After a schema change in `lib/db/schema.ts`, run `pnpm db:generate`. Migrations run on every Vercel build.
- Don't edit `components/ui/`, `components/ai-elements/`, or `hooks/` (copied library code).

## Shipping a change

Pushing to `main` updates the live app their clients use. So:

1. Run `pnpm typecheck` and `pnpm lint`, and fix any problems.
2. Tell them what will change, then commit and push.
3. Wait until `vercel ls` shows the new deployment **Ready**. If it shows **Error**, read `vercel inspect <url> --logs`, fix it, and push again.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
