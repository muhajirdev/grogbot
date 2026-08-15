# Grogbot

Open-source **Grok Bot** — Grok, then grog. Teammates with a real computer. Composio for Gmail/Slack/GitHub. Shared workspace context and skills for the whole team. Bring your own model keys.

Packages live under `@grogbot/*`.

This is an early scaffold: contracts, Postgres schema, job queue, and a Fly/Railway-shaped API + worker. The chat UI and live computers come next.

## Stack (locked)

- TypeScript, pnpm, Hono, React, Vite
- Postgres + Drizzle (not Prisma)
- Job table + poller (not Graphile)
- Better Auth
- Stateful deploy: local Compose, then Fly or Railway
- Computers: Docker locally, E2B when hosted, desktop only on a trusted machine
- Plugins: Composio (optional)
- Team: workspace-shared context and skills
- Cloudflare later via adapters — not v1

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
- Web: http://127.0.0.1:5173 (placeholder)

## Layout

```
apps/web api worker
packages/contracts adapter-kit core db auth adapters
infra/compose
```

## License

MIT
