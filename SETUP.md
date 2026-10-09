# Setup (for AI assistants)

Read [AGENTS.md](AGENTS.md) first. You do the technical work. The coach answers questions, clicks a few things, and picks a password. A step is done when its **Check** passes.

**Resuming?** Find their copy, then start at the first step whose check fails.

## 1. Tools

GitHub and Vercel CLIs signed in, git working, Node 22+, Vercel CLI on the latest version (the AI budget commands are new). On Windows, after installing git they must reopen this AI app.

**Check:** `vercel ai-gateway budgets --help` works.

## 2. Ask

- Sign-in email. Read it back: a typo locks them out.
- App name.
- Web address, `<name>.vercel.app`. Suggest one from the app name.
- Daily messages per client. Suggest 50.
- Monthly AI budget. Suggest $100: it's a safety net, so set it high.
- Which Vercel team, if they have more than one.

## 3. Create and connect

- A private GitHub repo `<name>` from the template `robinebers/coachgpt`, cloned into the folder they opened, not a new folder inside it. If that folder has files, ask first.
- Commits use their GitHub name and noreply email (`<id>+<login>@users.noreply.github.com`). Vercel blocks deploys from commits it can't match to them.
- A Vercel project `<name>` in their team, connected to the repo so pushes to `main` deploy.
- A free Neon database, added through Vercel.
- An AI Gateway budget on the project at their limit.
- Env vars pulled into `.env.local`.

Traps:

- Pass the team to every `vercel` command. Some ignore the linked project and use the default team.
- Vercel can't see the repo: they install the Vercel app on GitHub (https://github.com/apps/vercel/installations/new).
- Neon may open a terms page: they click **Accept**.

**Check:** the repo is private, and the Vercel project shows the repo connected, `DATABASE_URL` set (names only, never values), and the budget.

## 4. Configure and deploy

In `coach.config.ts`, put their email in `adminEmails` (replacing `test@replace.me`) and set `appName` and `messagesPerClientPerDay`. Ship it (see AGENTS.md).

No deployment, or "Deployment Blocked": the commit email is wrong. Fix it and push an empty commit. Still blocked: they connect GitHub in Vercel under **Account Settings → Authentication**.

**Check:** the deployment is **Ready** and answers at `<name>.vercel.app`. If someone else has that name, ask for another and add it as a domain. From now on, always open the app at this address: client invites copy whatever address is open.

## 5. First sign-in, right away

Until they sign in, anyone with their email can pick the password. The app shows **Welcome! Pick your password**. They enter their email and save a browser-suggested password (15+ characters).

- "That's not the email this app was set up with": typo in `adminEmails`.
- "Sign in" instead of "Welcome": they already picked one. Check the browser's saved passwords.
- Locked out: delete their `user` row and redo this step at once.

**Check:** they sign out, sign back in, and see themselves marked **Admin** on Admin.

## 6. AI credits

They add credits under **AI Gateway** in the Vercel dashboard. Nothing answers without them.

**Check:** the example assistant replies.

## 7. First assistant

Ask: move a ChatGPT GPT over, or create a new one together? Then follow "Add an assistant".

## Add an assistant

1. Get the content.
   - **New:** ask who it's for and what it should do. Draft the name, description, starters and instructions, and refine them together.
   - **From ChatGPT:** in **My GPTs**, they edit the GPT, open **Configure**, and paste its name, description, starters and instructions here. Flag what this app can't do: web browsing, images, code, Actions, naming sources.
2. Pick a slug: the name in small letters with dashes, like `sales-coach`. It's the address and can never change.
3. Copy `assistants/example-coach/` to `assistants/<slug>/`, fill it in, and register it in `assistants/index.ts`. Offer to remove the example coach.
4. Ship it.
5. On Admin, they paste the instructions under **Instructions**, then upload knowledge files.

**Check:** a question about their material gets a sensible answer.

Tell them:

- Only upload what you're OK with clients seeing through the assistant.
- ChatGPT won't give knowledge files back. They need the originals.
- `.pdf`, `.txt`, `.md`, `.srt`, `.vtt`, up to 4 MB each. Scanned PDFs have no text and fail.
