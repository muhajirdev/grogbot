# Grogbot

Open-source **Grok Bot** — Grok, then grog. Teammates with a real computer. Composio for Gmail/Slack/GitHub. Shared workspace context and skills. Bring your own model keys.

Packages live under `@grogbot/*`.

Early scaffold: contracts, Postgres (team data), Rivet-shaped **one actor per bot** for wakeup, Fly/Railway API + worker. Chat UI and live computers next.

## Stack (locked)

- TypeScript, pnpm, Hono, React, Vite
- Postgres + Drizzle — workspaces, threads, skills
- **Rivet actor per bot** — wakeup, serial runs, cron, idle sleep
- Better Auth
- Local Compose Postgres, then Fly or Railway
- Computers: Docker locally, E2B hosted, desktop only on a trusted machine
- Plugins: Composio (optional)
- UI: Grok Bot-simple — [docs/grok-bot-ui.md](./docs/grok-bot-ui.md)
- Cloudflare later: Rivet’s DO driver, not a custom Queue rewrite

See [ARCHITECTURE.md](./ARCHITECTURE.md).

## Requirements

- Node.js 22+
- pnpm 9
- Docker (Postgres)

## Run locally

```bash
cp .env.example .env
docker compose -f infra/compose/docker-compose.yml up postgres -d
pnpm install
pnpm db:migrate
pnpm dev
```

- API: http://127.0.0.1:3100/health
- Worker / actors: http://127.0.0.1:3101/health
- Web: http://127.0.0.1:5173 (placeholder)

## Layout

```
apps/web api worker
packages/contracts adapter-kit core db auth adapters
infra/compose
docs/
```

## License

MIT
