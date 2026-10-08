# Setup guide (for AI assistants)

Read [AGENTS.md](AGENTS.md) first: it says who you're helping and how to talk to them. This guide puts their app online and moves their GPTs over. You run every command. They answer four questions, accept a page or two, add AI credits, and pick a password.

A step is done only when its **Check** passes. A file existing is not proof. If a check fails, fix it before moving on.

## Picking up where they left off

If they started before, first find their copy: a `my-coaching-assistant` folder, or `gh repo clone my-coaching-assistant`. Work inside it. Then run the checks below in order, and start from the first step whose check fails. For step 2, read their answers back from `coach.config.ts` and `vercel ai-gateway budgets inspect`.

## 1. Tools

Run `gh auth status` and `vercel whoami`. If one isn't signed in, run `gh auth login --web` or `vercel login`. Then:

- **git:** if `git --version` fails (likely on Windows), run `winget install --id Git.Git -e`. They click **Yes** if Windows asks, then quit and reopen this AI app so it finds git.
- Run `gh auth setup-git`, so git uses their GitHub login.
- If `pnpm` is missing, run `npm install -g pnpm`.
- Update the Vercel CLI, since the commands below are new: `npm install -g vercel@latest` (or `brew upgrade vercel-cli` if Homebrew installed it).

**Check:** both accounts show as signed in, `git --version` and `pnpm --version` work, `node --version` is 22 or newer, and `vercel ai-gateway budgets --help` lists `set` and `inspect`.

## 2. Ask four things

- The email they'll sign in with. Read it back: a typo locks them out.
- What to call the app.
- How many messages each client may send per day. Suggest 50.
- A monthly AI budget for the whole app. Suggest $100. It's a safety net, so set it high. The daily message limit is what keeps normal costs down.

## 3. Make their copy and connect it

```bash
gh repo create my-coaching-assistant --private --clone --template robinebers/coachgpt
cd my-coaching-assistant
gh api user --jq '.id, .login, .name'
git config user.name "<their name, or login if name is empty or null>"
git config user.email "<id>+<login>@users.noreply.github.com"
pnpm install
vercel link --yes
vercel git connect --yes
vercel install neon --plan free_v3
vercel ai-gateway budgets set project my-coaching-assistant --limit <their budget>
vercel env pull .env.local
```

The two `git config` lines tie their commits to their GitHub account. Vercel's free plan won't deploy a private repo otherwise.

If `vercel git connect` says "Failed to connect", Vercel can't see their GitHub yet. Open https://github.com/apps/vercel/installations/new. They pick their account and click **Install**. Then run it again.

The first time Neon is added, a page may open to accept its terms. They click **Accept**.

**Check:**

- `gh repo view --json visibility` says `PRIVATE`, and `git config user.email` ends in `@users.noreply.github.com`.
- `vercel git connect --yes` says the repo is already connected.
- `vercel env ls production` lists `DATABASE_URL` and `DATABASE_URL_UNPOOLED`. Show names only, never values.
- `vercel ai-gateway budgets inspect project my-coaching-assistant` shows their limit, refreshing monthly.

## 4. Set their details and deploy

In `coach.config.ts`, replace `test@replace.me` in `adminEmails` with their email, and set `appName` and `messagesPerClientPerDay`. Then ship it as in "Shipping a change" in AGENTS.md.

**Check:**

- `coach.config.ts` no longer contains `test@replace.me`, and `git status` shows nothing left to push.
- `vercel inspect <newest deployment url> --wait` says **Ready**. No new deployment, or "Deployment Blocked"? The commit identity from step 3 is wrong. Fix it, then `git commit --allow-empty -m "Redeploy"` and push. Still blocked? They connect GitHub in Vercel under **Account Settings → Authentication**.
- Note the app's address: the `my-coaching-assistant….vercel.app` one under `Aliases` without `-git-` in it. Always open the app at this address, because client invites copy whatever address the coach has open.

## 5. First sign-in

Do this as soon as step 4 is Ready. Until they sign in, anyone who knows their email could pick the password first.

Open their app at the address from step 4. It shows **Welcome! Pick your password**.

1. They type the email from step 2.
2. They let their browser suggest a strong password (at least 15 characters) and save it. That password is now theirs.
3. They land on the home page, with **Admin** at the bottom of the sidebar.

**Check:** ask them to:

- sign out, then sign back in with the saved password,
- open **Admin** and see their own email in the list, marked **Admin**.

If it goes wrong:

- **"That's not the email this app was set up with":** a typo. Fix `adminEmails`, ship it, try again.
- **It says "Sign in", not "Welcome":** they already picked a password. Their browser may have saved it.
- **Signed in, but the password wasn't saved:** on `/admin`, they click **⋯** on their own row, then **Reset password**, save the new one, and sign in again.
- **They can't get in at all:** delete their row from the `user` table (a one-off query using `.env.local`). Their own chats go too. Then redo this step right away.

## 6. Add AI credits

Open the Vercel dashboard for them. They go to **AI Gateway** and add credits. The app can't answer anything without them.

**Check:** they send one message to the example assistant and get a reply. If not, check the credits, then the budget check from step 3.

## Move a custom GPT over

Do this once per GPT. In ChatGPT, they open **Explore GPTs → My GPTs**, click the pencil (Edit) on a GPT, then open **Configure**.

| In ChatGPT | In this app |
| --- | --- |
| Name, Description, Conversation starters | `name`, `description`, `starters` in `assistants/<slug>/assistant.ts` |
| Instructions | all of `assistants/<slug>/instructions.md` |
| Knowledge files | uploaded on `/admin` after the update is live |

1. Pick a slug: the GPT's name in small letters with dashes, like `sales-coach`. It becomes the web address (`/sales-coach`) and can't change later.
2. Copy `assistants/example-coach/` to `assistants/<slug>/`.
3. They paste each field into the chat. Instructions are their work, not a secret, so pasting is fine. Keep them word for word. If they rely on things this app doesn't have (web browsing, images, code, Actions, naming source files), tell them those parts won't work.
4. In `assistants/index.ts`, import it and add it with the slug as its key (`"sales-coach": salesCoach`). Remove the example coach if it's not needed, and delete its folder.
5. Ship it as in "Shipping a change" in AGENTS.md.
6. They upload the knowledge files on `/admin`.

**Check:** they open the new assistant, its files show **ready** on `/admin`, and a question about their material gets a sensible answer.

Tell them plainly:

- **ChatGPT doesn't let you download knowledge files.** They need the originals from their computer, Google Drive, or wherever they made them.
- **Only upload material you're OK with clients seeing through the assistant.**
- Supported: `.pdf`, `.txt`, `.md`, `.srt`, `.vtt`, up to 4 MB each. Split bigger files.
- They can drop files onto an assistant or click **Add files**. A file shows **Reading**, then **Ready**. If it shows **Failed**, hover over it to see why.
- Scanned PDFs (photos of pages) fail: there's no text to read. Images and charts inside PDFs are skipped.
