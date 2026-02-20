# Bloxr

**Roblox development, reimagined through AI.**

Build anything you can imagine in Roblox — no coding required. Just describe what you want, and Bloxr writes the code and puts it directly into your game.

---

## What Is Bloxr?

Bloxr is a tool that lets you build Roblox games by talking to an AI. You describe what you want — like *"add a shop where players can buy speed boosts"* or *"make a leaderboard that shows the top 10 players"* — and Bloxr writes the code and places it into Roblox Studio automatically.

No programming experience needed. No copying and pasting code. It just works.

---

## How It Works

1. **Sign in with your Roblox account** — one click, no new passwords
2. **Open Roblox Studio** — Bloxr connects to it automatically
3. **Type what you want to build** — in plain English
4. **Watch it appear in your game** — live, in real time

That's it. You can keep chatting to refine it: *"now make the speed boost cost 50 coins instead of 10"* — and it updates.

---

## What Can You Build?

- Shops where players spend in-game coins
- Leaderboards and score trackers
- Health bars, stamina bars, XP systems
- Enemy AI that chases players
- Checkpoints and respawning
- Trading systems between players
- Full game templates (obby, tycoon, simulator, RPG)
- And much more — if you can describe it, Bloxr can build it

---

## What's Inside This Project

This is the full Bloxr codebase. You probably don't need to touch most of it — but here's what's here:

```
bloxr/
├── web/       The Bloxr website (what users see at bloxr.dev)
├── server/    The backend that handles accounts and saves your games
└── plugin/    The Roblox Studio plugin (coming soon)
```

---

## Running It Locally (For Developers)

> If you just want to use Bloxr, you don't need to do any of this.
> This section is for people who want to run the code on their own computer.

**What you'll need first:**
- [Node.js](https://nodejs.org) (version 18 or higher) — free to download
- A terminal (on Mac: search "Terminal" in Spotlight; on Windows: search "Command Prompt")

**Step 1 — Download the code:**
```bash
git clone https://github.com/levihgibbons1/bloxr.git
cd bloxr
```

**Step 2 — Install everything:**
```bash
npm install
```

**Step 3 — Start the website:**
```bash
npm run dev:web
```
Then open your browser and go to: **http://localhost:3000**

**Step 4 — Start the backend (in a second terminal window):**
```bash
npm run dev:server
```

That's it! Both are now running on your computer.

---

## Setting Up Your Environment

Before running the server, you'll need to create a `.env` file in the `server/` folder. Copy the example file to get started:

```bash
cp server/.env.example server/.env
```

Open `server/.env` and fill in your details. At minimum you'll need a `DATABASE_URL` if you want the waitlist form to save emails.

The web app also has an environment file:

```bash
cp web/.env.example web/.env.local
```

---

## Tech Stack

| Part | What It's Built With |
|---|---|
| Website | Next.js 14, Tailwind CSS, TypeScript |
| Backend | Node.js, Express, PostgreSQL, TypeScript |
| Studio Plugin | Luau (coming soon) |

---

## Questions?

If something isn't working or you have a question, [open an issue](https://github.com/levihgibbons1/bloxr/issues) and we'll help you out.

---

*Built with the belief that anyone should be able to make a Roblox game — not just people who can code.*
