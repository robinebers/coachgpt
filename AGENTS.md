# Guide for AI assistants

You are helping a coach or consultant set up and run this app. It is their own private version of ChatGPT custom GPTs.

## Who you're helping

- They are **not** a developer. Talk like you would to a smart friend who has never coded.
- Use simple words a 5th grader knows. Short sentences. No jargon. If you must use a tech word, explain it in a few words.
- Give **one step at a time.** Wait until they say it's done before the next step.
- Before you do something, say what you're about to do and why, in one sentence.
- Do the technical work yourself (editing files, running commands, git). Only ask them to click things you can't click for them.
- **Never ask them to paste passwords, API keys, or secrets into the chat.** Secrets live in Vercel. Use `vercel env pull` if you need them locally.

## What this app is

- Each **assistant** is like one custom GPT. It has a name, a short description, conversation starters, instructions, and knowledge files.
- **Clients** sign in with an email and a password the coach gives them. Only people the coach adds can get in. The app sends no emails: if a client forgets their password, the coach makes a new one on `/admin`.
- The **admin page** (`/admin`) is where the coach uploads knowledge files, adds and edits clients, and resets passwords. Only emails in `adminEmails` in `coach.config.ts` can open it.
- It runs on **Vercel**, with **Neon** (database, which also keeps the logins and the knowledge) and **Vercel AI Gateway** (the AI).

## Setup checklist

You run every step in the terminal. They only answer four questions, add AI credits, and pick a password. They already have the GitHub CLI (`gh`) and the Vercel CLI (`vercel`) from the homework video.

Before anything opens in their browser, tell them in one sentence what it is and what to click.

If they started before, ask how far they got. Clues: a `my-coaching-assistant` folder with `.vercel/project.json` means step 3 is done. If they can sign in and see **Admin**, step 5 is done.

### 1. Check the tools

Run `gh auth status` and `vercel whoami`. If one isn't logged in, run `gh auth login --web` or `vercel login`. If `pnpm` is missing, run `npm install -g pnpm`.

### 2. Ask four things

- The email they'll sign in with. Read it back, because a typo locks them out.
- What to call the app.
- How many messages each client may send per day. Suggest 50.
- A monthly AI budget for the whole app. Suggest $100. It's a safety net, so it should be high: the daily message limit is what keeps normal costs down. When it runs out, the AI stops for everyone until next month.

### 3. Make their copy and put it online

```bash
gh repo create my-coaching-assistant --private --clone --template robinebers/coachgpt
cd my-coaching-assistant
pnpm install
vercel link --yes
vercel git connect --yes
vercel install neon --plan free_v3
vercel ai-gateway budgets set project my-coaching-assistant --limit <their budget>
vercel env pull .env.local
```

The first time Neon is added, a page may open to accept its terms. They click **Accept**.

Then, in `coach.config.ts`, replace `test@replace.me` in `adminEmails` with their email, and set `appName` and `messagesPerClientPerDay`. Never push it with `test@replace.me` still there: anyone could sign in as admin with it. Commit and push. Vercel builds the app in about two minutes (`vercel ls` shows when it's Ready).

### 4. Add AI credits

In the Vercel dashboard, they open **AI Gateway** and add credits. The budget from step 2 caps what gets spent.

### 5. First sign-in

Open their live app for them (`vercel inspect` on the newest deployment lists its address). It shows **Welcome! Pick your password**.

1. They type the email from step 2.
2. They let their browser suggest a strong password, and save it. That password is now theirs. It needs at least 15 characters.
3. They land on the home page, with **Admin** at the bottom of the sidebar.

If it goes wrong:

- **"That's not the email this app was set up with"**: a typo. Fix `adminEmails`, push, wait for the build, and try again.
- **It says "Sign in", not "Welcome"**: they already picked a password before. Their browser may have saved it.
- **They're signed in but didn't save the password**: they open `/admin`, click **Reset password** on their own row, save the new one, and sign in again.
- **They can't get in at all**: delete their row from the `user` table (a one-off query using `.env.local`; their own chats go too). Then they do this step again.

Next: move their GPTs over.

## Move a custom GPT over

Do this once per GPT. In ChatGPT, have them open **Explore GPTs → My GPTs**, click the pencil (Edit) on a GPT, then open the **Configure** tab.

| In ChatGPT (Configure tab) | In this app |
| --- | --- |
| Name | `name` in `assistants/<slug>/assistant.ts` |
| Description | `description` in the same file |
| Conversation starters | `starters` in the same file |
| Instructions | all of `assistants/<slug>/instructions.md` |
| Knowledge files | uploaded on the `/admin` page (after deploy) |

Steps:

1. Pick a slug: the GPT's name in small letters with dashes, like `sales-coach`. It becomes the web address (`/sales-coach`).
2. Copy `assistants/example-coach/` to `assistants/<slug>/`.
3. Ask them to paste each field into the chat (Name, Description, Starters, Instructions). Instructions are their work, not a secret, so pasting them is fine. Put each field in the right file. Keep the instructions word for word.
4. Add the assistant to `assistants/index.ts`: import it, then add it to the `assistants` list with the slug as its key (`"sales-coach": salesCoach`).
5. If the example coach isn't needed anymore, remove it from `assistants/index.ts` and delete its folder.
6. Run `pnpm typecheck`, then commit and push.
7. Once the live app has updated, they open `/admin` and upload the knowledge files for that assistant.

Tell them plainly:

- **ChatGPT doesn't let you download knowledge files.** They need the original files from their computer, Google Drive, or wherever they first made them.
- Supported files: `.pdf`, `.txt`, `.md`, `.srt`, `.vtt`.
- After upload, a file shows "reading…" for a little while, then "ready". If it shows "failed", hover over it to see why.
- Each file can be up to 4 MB. Split bigger files into smaller ones.
- Scanned PDFs (photos of pages) fail, because there's no text in them to read. Images and charts inside PDFs are skipped.
- GPT extras like web browsing, image making, code running, and Actions are not part of this app.

## Models

The models in `coach.config.ts` are already picked. Do **not** offer them a menu of models or ask which one they want.

Change a model only if they ask for it. Before you change it:

- Check the new model ID exists at https://ai-gateway.vercel.sh/v1/models.
- The embedding model must make 1024-number vectors. If you change it, every knowledge file must be uploaded again.
- `thinking` can be `"low"`, `"medium"`, or `"high"`. Lower is faster and cheaper.

## Where to change things

| They say… | You change… |
| --- | --- |
| "Change the app name" / "the text on the home page" | `appName` / `tagline` in `coach.config.ts` |
| "Make someone else an admin" | add their email to `adminEmails` in `coach.config.ts`. If they have no account yet, they sign in right after the update, and the password they type becomes theirs. |
| "Take away someone's admin" | remove their email from `adminEmails`. They become a normal client. To lock them out too, the coach clicks **Remove** on `/admin` after the update. |
| "Let people send more messages" | `messagesPerClientPerDay` in `coach.config.ts` |
| "Change the monthly AI budget" | `vercel ai-gateway budgets set project my-coaching-assistant --limit <dollars>` |
| "Allow bigger files" | not possible: Vercel caps uploads at 4.5 MB. They split the file into smaller ones. |
| "Change how the assistant talks" | `assistants/<slug>/instructions.md` |
| "Change the starter buttons" / "the description" | `assistants/<slug>/assistant.ts` |
| "Add an assistant" | follow "Move a custom GPT over" |
| "Add a client" | they do it on the `/admin` page. They get a password to send the client. |
| "A client forgot their password" | on `/admin`, they click **⋯** on the client's row, then **Reset password**, and send the new one. The old one stops working right away. |
| "Change a client's name or email" | on `/admin`, **⋯** then **Edit**. |
| "Remove a client" | on `/admin`, **⋯** then **Remove**. That client's chats are deleted too. |
| "Send 'forgot password' emails" | not built in. It needs an email sender: their Gmail with an app password (no website needed), or Resend from the Vercel Marketplace (needs their own website address and DNS records). Then use `sendResetPassword` in `lib/auth.ts` with a link you build from its `token` (there's no `/api/auth` route), plus a reset page whose server action calls `auth.api.resetPassword`. |
| "Change colors" | the CSS variables in `app/globals.css` |
| "Use my logo" | replace `public/logo.svg` (sidebar and sign-in page) and `app/icon.svg` (browser tab icon: keep it simple and bold, it shows at 16 pixels). Square images. For a `.png`, save `public/logo.png` and update `src="/logo.svg"` in `components/app-sidebar.tsx` and `app/sign-in/page.tsx`, or save `app/icon.png` and delete `app/icon.svg`. |
| "Change the sidebar" | `components/app-sidebar.tsx` |
| "Change the chat screen" | `components/chat.tsx` |

After any change: run `pnpm typecheck` and `pnpm lint`, fix any problems, then commit and push to `main`. Vercel updates the live app in about a minute.

## Guardrails

- Keep the GitHub repo **private**.
- **Never commit knowledge files** or `.env` files. Knowledge files are uploaded on `/admin` only.
- Never ask for secrets in chat. Never print secrets in your replies.
- No provider API keys (like an OpenAI key). The AI runs through Vercel AI Gateway, which logs in by itself on Vercel. Locally, `vercel env pull .env.local` gets a token. It expires after about 12 hours, so pull again if AI calls start failing.
- Prefer changing `coach.config.ts` and `assistants/` over the engine room below. Only change the engine room when they ask for something new.
- To delete an assistant, delete its knowledge files on `/admin` **first**, then remove the code. Its old chats disappear from the sidebar.
- Never change an assistant's slug once clients use it: its chats and knowledge files are tied to it. To rename it, change `name` only.

## Running it on their computer (only if needed)

Most changes don't need this. Push, and Vercel builds it. If you need to see changes before pushing:

```bash
vercel env pull .env.local
pnpm dev
```

Then open http://localhost:3000.

## Engine room (for you, not for them)

- `app/(app)/`: the one sidebar layout, the home page (assistant picker), the chat pages, `actions.ts` (delete a chat), and `admin/` (`files.tsx`, `clients.tsx`, server actions in `actions.ts`). New passwords show once in a dialog with copy buttons, never in a toast.
- `components/app-sidebar.tsx`, `nav-links.tsx`, `nav-user.tsx`: the sidebar, its links and chat "⋯" menu, and the account menu. `confirm-dialog.tsx`: the "are you sure?" dialog.
- `app/sign-in/`: the sign-in page. While there are no accounts at all, it shows the coach's first-time screen. An admin's first sign-in creates their account (`actions.ts`).
- `assistants/index.ts`: the list of assistants. Each key is the web address. Instructions are imported as text (see the `*.md` rule in `next.config.ts`) and never sent to the browser.
- `app/api/chat/route.ts`: counts the message against the limits, streams the reply, saves messages. Admin messages are not counted.
- `lib/knowledge.ts`: reads uploaded files right away (text as-is, PDF text with `unpdf`), chunks, embeds, and runs hybrid search (vector + keyword, RRF, then rerank). The original files are not kept.
- `lib/file-types.ts`: allowed file types and the 4 MB size limit (also the server action body limit in `next.config.ts`)
- `lib/limits.ts`, `lib/chats.ts`: daily limits, chat storage
- `lib/auth.ts`: Better Auth with email + password. Sign-up is off, and there is no `/api/auth` route on purpose: accounts are only made by `createAccount()` (from `saveClient` or an admin's first sign-in). Admin means "email is in `adminEmails`", checked on every request. Its secret is `DATABASE_URL`, so there's no secret to set up. The "Base URL is not set" warning is expected; leave it. Also `getUser()` (sends signed-out people to sign-in) and `requireAdmin()`. Every new page, route, or server action must call one of them.
- `lib/db/schema.ts`: database tables. Better Auth's tables (`user`, `session`, `account`, `verification`) are generated into `lib/db/auth-schema.ts`. After a change, run `pnpm db:generate` (files land in `drizzle/`; don't hand-edit them). Migrations run automatically on each Vercel build.
- `components/ui/`, `components/ai-elements/`, `hooks/`: copied-in library code (shadcn, AI Elements). Don't hand-edit or "fix" lint inside them.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
