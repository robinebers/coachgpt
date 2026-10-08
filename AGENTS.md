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
- The **admin page** (`/admin`) is where the coach uploads knowledge files, adds clients, resets passwords, and sees today's usage. Only admin emails can open it. Those are in `ADMIN_EMAILS` in Vercel, filled in on the Deploy screen.
- It runs on **Vercel**, with **Neon** (database, which also keeps the logins), **Vercel Blob** (file storage), and **Vercel AI Gateway** (the AI).

## Setup checklist

Go in this order. You do all the technical work. They only click buttons, tell you their email, and pick a password.

Before every step, tell them in one sentence what will happen and what they'll see: a new page, a login, or a popup. Never send them anywhere without saying why first.

If they started before, ask how far they got. Clues: they know their app's web address (steps 1 and 2 are done). They can sign in and see **Admin** (step 3 is done). `.vercel/project.json` exists (step 5 is done).

### 1. Make a Vercel account

Send them to https://vercel.com/signup. Tell them to click **Continue with GitHub**. No GitHub account yet? It helps them make one for free. Their app's code will live there.

### 2. Put the app online

Ask which email they want to sign in with. Read it back to them, because a typo here locks them out.

Give them this link, with `EMAIL` replaced by their email, URL-encoded (`@` becomes `%40`):

https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Frobinebers%2Fcoachgpt&project-name=my-coaching-assistant&repository-name=my-coaching-assistant&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22neon%22%2C%22productSlug%22%3A%22neon%22%2C%22protocol%22%3A%22storage%22%7D%2C%7B%22type%22%3A%22blob%22%2C%22access%22%3A%22private%22%7D%5D&env=ADMIN_EMAILS&envDescription=Your%20email.%20You%20will%20use%20it%20to%20sign%20in%20as%20the%20admin.&envDefaults=%7B%22ADMIN_EMAILS%22%3A%22EMAIL%22%7D

First tell them what it does: it copies the app into their GitHub, adds a database and file storage, and puts the app online. Their email is already filled in. Then tell them:

- Keep **Create private Git repository** checked. Their instructions are their work.
- On each **Add** screen, pick the free plan and click through.
- Don't change anything else.
- It takes a few minutes. When it says **Congratulations**, they click the picture of their app. That opens their app. Ask them to paste its web address into the chat.

### 3. First sign-in

Do this right away. Their app shows **Welcome! Pick your password**.

1. They type the email from step 2.
2. They let their browser suggest a strong password, and save it. That password is now theirs. It needs at least 15 characters.
3. They land on the home page, with **Admin** at the bottom of the sidebar.

If it goes wrong:

- **"That's not the email this app was set up with"**: a typo in step 2. They open their project in Vercel, then **Settings** → **Environment Variables** → `ADMIN_EMAILS`, and fix it. Then **Deployments** → **⋯** on the top one → **Redeploy**. Wait for it, and try again.
- **It says "Sign in", not "Welcome"**: they already picked a password before. Their browser may have saved it.
- **They're signed in but didn't save the password**: they open `/admin`, click **Reset password** on their own row, save the new one, and sign in again.
- **They can't get in at all**: do step 5 first. Then delete their row from the `user` table (a one-off query with `.env.local` pulled; their own chats go too). Then they do this step again.

### 4. Set a spending limit

Every AI message costs a tiny bit of money, paid through Vercel AI Gateway. A budget is the hard stop.

1. In the Vercel dashboard, open **AI Gateway**.
2. Add credits. Set a monthly budget they're comfortable with.

The daily limits in `coach.config.ts` protect them too. The budget is the real safety net.

### 5. Get the code onto their computer

You need this before you can change anything. Check which tools are there (`git`, `node`, `pnpm`, `gh`, `vercel`), and install only what's missing. Warn them before each of these, so nothing surprises them:

- For `git`, the Mac may pop up a box about "command line developer tools". They click **Install** and wait a few minutes.
- `gh auth login --web` and `vercel login` each open a page in their browser. They click to approve.
- If the Mac asks for their computer password, that's normal.

Then:

```bash
gh repo clone <their-github-username>/my-coaching-assistant
cd my-coaching-assistant
pnpm install
vercel link --yes --project my-coaching-assistant
vercel env pull .env.local
```

Next: ask what to call the app (`appName` in `coach.config.ts`). Then move their GPTs over.

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
- Very long PDFs (a whole book) may fail. Split them into smaller files.
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
| "Make someone else an admin" | add their email to `ADMIN_EMAILS` in Vercel, with commas between emails: `vercel env update ADMIN_EMAILS --value "coach@x.com,them@y.com" --yes`. Then redeploy: `git commit --allow-empty -m "Update admins" && git push`. If they have no account yet, they sign in right after, and the password they type becomes theirs. |
| "Take away someone's admin" | remove their email from `ADMIN_EMAILS` the same way, and redeploy. They become a normal client. To lock them out too, the coach clicks **Remove** on `/admin` after the update. |
| "Let people send more messages" | `limits` in `coach.config.ts` |
| "Allow bigger files" | `knowledge.maxFileSizeMB` in `coach.config.ts` |
| "Change how the assistant talks" | `assistants/<slug>/instructions.md` |
| "Change the starter buttons" / "the description" | `assistants/<slug>/assistant.ts` |
| "Add an assistant" | follow "Move a custom GPT over" |
| "Add a client" | they do it on the `/admin` page. They get a password to send the client. |
| "A client forgot their password" | they click **Reset password** on `/admin` and send the new one. The old one stops working right away. |
| "Remove a client" | they click **Remove** on `/admin`. That client's chats are deleted too. |
| "Send 'forgot password' emails" | not built in. It needs an email sender: their Gmail with an app password (no website needed), or Resend from the Vercel Marketplace (needs their own website address and DNS records). Then use `sendResetPassword` in `lib/auth.ts` with a link you build from its `token` (there's no `/api/auth` route), plus a reset page whose server action calls `auth.api.resetPassword`. |
| "Change colors" | the CSS variables in `app/globals.css` |
| "Change the sidebar" | `components/app-sidebar.tsx` |
| "Change the chat screen" | `components/chat.tsx` |

After any change: run `pnpm typecheck` and `pnpm lint`, fix any problems, then commit and push to `main`. Vercel updates the live app in about a minute.

## Guardrails

- Keep the GitHub repo **private**.
- **Never commit knowledge files** or `.env` files. Knowledge files are uploaded on `/admin` only.
- Never ask for secrets in chat. Never print secrets in your replies.
- No provider API keys (like an OpenAI key). The AI runs through Vercel AI Gateway, which logs in by itself on Vercel. Locally, `vercel env pull .env.local` gets a token. It expires after about 12 hours, so pull again if AI calls start failing.
- Prefer changing `coach.config.ts` and `assistants/` over the engine room below. Only change the engine room when they ask for something new.
- To delete an assistant, delete its knowledge files on `/admin` **first**, then remove the code.

## Running it on their computer (only if needed)

Most changes don't need this. Push, and Vercel builds it. If you need to see changes before pushing:

```bash
vercel env pull .env.local
pnpm dev
```

Then open http://localhost:3000.

## Engine room (for you, not for them)

- `app/(chat)/`: the sidebar layout, the home page (assistant picker), and the chat pages
- `app/admin/`: upload, file status, clients (add, reset password, remove), today's usage, plus server actions
- `app/sign-in/`: the sign-in page. While there are no accounts at all, it shows the coach's first-time screen. An admin's first sign-in creates their account (`actions.ts`).
- `assistants/index.ts`: the list of assistants. Each key is the web address. Instructions are imported as text (see the `*.md` rule in `next.config.ts`) and never sent to the browser.
- `app/api/chat/route.ts`: counts the message against the limits, streams the reply, saves messages. Admin messages are not counted.
- `app/api/upload/route.ts`: issues upload tokens for private Blob (admin only)
- `lib/knowledge.ts`: reads files (text as-is, PDFs through the chat model), chunks, embeds, and runs hybrid search (vector + keyword, RRF, then rerank)
- `lib/file-types.ts`: allowed file types
- `lib/limits.ts`, `lib/chats.ts`: daily limits, chat storage
- `lib/auth.ts`: Better Auth with email + password. Sign-up is off, and there is no `/api/auth` route on purpose: accounts are only made by `createAccount()` (from `addClient` or an admin's first sign-in). Admin means "email is in the `ADMIN_EMAILS` env var" (filled in on the Deploy screen, commas between emails), checked on every request. Its secret is `DATABASE_URL`, so there's no secret to set up. The "Base URL is not set" warning is expected; leave it. Also `getUser()` (sends signed-out people to sign-in) and `requireAdmin()`. Every new page, route, or server action must call one of them.
- `lib/db/schema.ts`: database tables. Better Auth's tables (`user`, `session`, `account`, `verification`) are generated into `lib/db/auth-schema.ts`. After a change, run `pnpm db:generate` (files land in `drizzle/`; don't hand-edit them). Migrations run automatically on each Vercel build.
- `components/ui/`, `components/ai-elements/`, `hooks/`: copied-in library code (shadcn, AI Elements). Don't hand-edit or "fix" lint inside them.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
