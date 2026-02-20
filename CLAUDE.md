# Bloxr — Claude Context

## Project Overview
Bloxr is a monorepo for an AI-powered Roblox development tool.

## Structure
- `web/` — Next.js 14 (App Router, Tailwind CSS, TypeScript)
- `server/` — Node.js + Express (TypeScript, nodemon)
- `plugin/` — Luau Studio plugin (no Node setup)

## Key Conventions
- Use TypeScript everywhere in `web/` and `server/`
- App Router only in `web/` — no Pages Router
- Keep `web/` and `server/` as npm workspaces managed from root
- Never commit `.env` files — use `.env.example` as the template

## Commands
```bash
npm run dev:web       # Start Next.js dev server
npm run dev:server    # Start Express dev server with nodemon
```
