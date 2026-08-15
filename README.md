# Grogbot

Open-source **Grok Bot** — Grok, then grog. Teammates with a real computer. Composio for Gmail/Slack/GitHub. Shared workspace context and skills. Bring your own model keys.

Packages live under `@grogbot/*`.

Early scaffold: contracts, Postgres (team data), Rivet-shaped **one actor per bot** for wakeup, Fly/Railway API + worker. Chat UI and live computers next.

## Stack (locked)

- TypeScript, pnpm, Hono, React, Vite
- **oRPC** — one contract for web, desktop, and mobile
- Postgres + Drizzle — workspaces, threads, skills
- **Rivet actor per bot** — wakeup, serial runs, cron, idle sleep
- Better Auth
- Local Compose Postgres, then Fly or Railway
- Computers: Docker locally, E2B hosted, desktop only on a trusted machine
- Plugins: Composio (optional)
- UI: **web first** (Grok Bot-simple) — [docs/grok-bot-ui.md](./docs/grok-bot-ui.md). Desktop = Electron around web. Mobile = Expo later.
- Cloudflare later: Rivet’s DO driver

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
- oRPC: http://127.0.0.1:3100/rpc
- Worker / actors: http://127.0.0.1:3101/health
- Web: http://127.0.0.1:5173

Desktop (same web UI in a window):

```bash
pnpm dev:desktop
```

Mobile (Expo stub, later):

```bash
pnpm dev:mobile
```

On a device, set `EXPO_PUBLIC_API_URL` to this machine’s LAN address.

## Layout

```
apps/web desktop mobile api worker
packages/contracts rpc adapter-kit core db auth adapters
infra/compose
docs/
```

## License

MIT
