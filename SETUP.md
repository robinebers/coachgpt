# Setup (for AI assistants)

Read [AGENTS.md](AGENTS.md) first. You do the technical work. The coach answers questions, clicks a few things, and picks a password. A step is done when its **Check** passes.

**Resuming?** Find their copy, then start at the first step whose check fails.

## 1. Tools

GitHub and Vercel CLIs signed in, git working, Node 22+, Vercel CLI on the latest version (the AI budget commands are new). On Windows, after installing git they must reopen this AI app.

Never ask them to type in a terminal. Run each sign-in yourself, open its page, and tell them the one-time code.

**Check:** `vercel ai-gateway budgets --help` works.

## 2. Ask

- Sign-in email. Read it back: a typo locks them out. Team members can be added as admins any time later.
- App name. It covers all their assistants, so not one assistant's name.
- Their logo and two brand colors, if they have them. A brand guide PDF works.
- Web address, `<name>.vercel.app`. Suggest one from the app name.
- Daily messages per client. Suggest 50.
- Monthly AI budget. Suggest $100: it's a safety net, so set it high.
- Which Vercel team, if they have more than one.

## 3. Create and connect

- A private GitHub repo `<name>` from the template `robinebers/coachgpt`, cloned into the folder they opened, not a new folder inside it. If that folder has files, ask first.
- Commits use their GitHub name and noreply email (`<id>+<login>@users.noreply.github.com`). Vercel blocks deploys from commits it can't match to them.
- A Vercel project `<name>` in their team, connected to the repo so pushes to `main` deploy.
- GitHub connected to their Vercel account under **Account Settings → Authentication**. Vercel blocks deploys it can't match to them.
- A free Neon database, added through Vercel.
- An AI Gateway budget on the project at their limit.
- Env vars pulled into `.env.local`.

Traps:

- Pass the team to every `vercel` command. Some ignore the linked project and use the default team.
- Vercel can't see the repo: they install the Vercel app on GitHub (https://github.com/apps/vercel/installations/new).
- Neon may open a terms page: they click **Accept**.
- Pages they must click through don't always open on their own. Open each one yourself, then say which button to click.

**Check:** the repo is private, and the Vercel project shows the repo connected, `DATABASE_URL` set (names only, never values), and the budget.

## 4. Configure and deploy

In `coach.config.ts`, put their email in `adminEmails` (replacing `test@replace.me`) and set `appName`, `colors` (their two brand colors) and `messagesPerClientPerDay`. If they have a logo, replace `public/logo.png` (256 px), `app/icon.png` (48 px) and `app/apple-icon.png` (180 px) with it. These must be square: if their logo is wide, offer to make a square icon from it. Ship it (see AGENTS.md).

No deployment, or "Deployment Blocked": the commit email is wrong, or GitHub isn't connected to their Vercel account. Fix it and push an empty commit.

**Check:** the deployment is **Ready** and answers at `<name>.vercel.app`. If someone else has that name, ask for another and add it as a domain. From now on, always open the app at this address: client invites copy whatever address is open.

## 5. First sign-in, right away

Until they sign in, anyone with their email can pick the password. The app shows **Welcome! Pick your password**. They enter their email and save a browser-suggested password (15+ characters). If the browser offers to update their Vercel password instead, they say no and save it as a new one.

- "That's not the email this app was set up with": typo in `adminEmails`.
- "Sign in" instead of "Welcome": they already picked one. Check the browser's saved passwords.
- Locked out: delete their `user` row and redo this step at once.

**Check:** they sign out, sign back in, and see themselves marked **Admin** on Admin.

## 6. AI credits

Nothing answers without paid credits. Vercel's free credits only show once a card is added, and may not cover the chat model. Tell them first: it's charged in US dollars, and tax may be added. Then open **AI Gateway** in the Vercel dashboard. They add a card, buy $10, and turn on auto-reload below $5, with a monthly maximum at their budget.

If a chat shows an error, have them try it themselves. Admins see the full error. Clients only see a short note.

**Check:** the example assistant replies.

## 7. First assistant

Ask: move a ChatGPT GPT over, or create a new one together? Then follow "Add an assistant".

## Add an assistant

1. Get the content.
   - **New:** ask who it's for and what problem it solves. Don't guess from the name. Draft the name, description, starters and instructions, and refine them together.
   - **From ChatGPT:** in **My GPTs**, they edit the GPT, open **Configure**, and paste its name, description, starters and instructions here. Flag what this app can't do: web browsing, making images, code, Actions, naming sources.
2. Pick a slug: the name in small letters with dashes, like `sales-coach`. It's the address and can never change.
3. Copy `assistants/example-coach/` to `assistants/<slug>/`, fill it in, and register it in `assistants/index.ts`. Replace `avatar.png` with a square image of their choice (offer to make one). Offer to remove the example coach.
4. Ship it.
5. On Admin, they paste the instructions under **Instructions**, then upload knowledge files.

**Check:** a question about their material gets a sensible answer.

Tell them:

- Only upload what you're OK with clients seeing through the assistant.
- ChatGPT won't give knowledge files back. They need the originals.
- `.pdf`, `.txt`, `.md`, `.srt`, `.vtt`, up to 4 MB each. Scanned PDFs have no text and fail.
- Clients can paste or attach up to 3 images per message, like screenshots.
