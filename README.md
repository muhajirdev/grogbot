# Grogbot

Open-source **Grok Bot** — Grok, then grog. Teammates with a real computer. Composio for Gmail/Slack/GitHub. Shared workspace context and skills. Bring your own model keys.

Packages live under `@grogbot/*`.

Early scaffold: contracts, Postgres (team data), Rivet-shaped **one actor per bot** for wakeup, Fly/Railway API + worker. Chat UI and live computers next.

## Stack (locked)

- TypeScript, pnpm, Hono, React, Vite, TanStack Router
- **oRPC** — one contract for web, desktop, and mobile
- Postgres + Drizzle — workspaces, threads, skills
- **Rivet actor per bot** — wakeup, serial runs, cron, idle sleep
- Better Auth (email/password, Google, GitHub)
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
- Web: http://127.0.0.1:5173 — `/` welcome, `/login`, `/onboarding`, `/{botId}` office
- Landing: http://127.0.0.1:5174 — marketing (TanStack Start)

Google / GitHub need client IDs in `.env`. Use **127.0.0.1**, not localhost:

- Google redirect: `http://127.0.0.1:5173/api/auth/callback/google`
- GitHub callback: `http://127.0.0.1:5173/api/auth/callback/github`

Email/password still works with no OAuth keys.

The scripted runtime echoes so you can test the loop without model keys.

Landing (marketing site, TanStack Start):

```bash
pnpm dev:landing
```

Advanced, off by default: a bot can let **Hermes** or **OpenClaw** connect outbound (`pnpm guest -- --url http://127.0.0.1:3101 --token … --kind hermes`). Enable it under Profile → Advanced. Default teammates still use the scripted/Pi runtime.

Desktop (same web UI in a window):

```bash
pnpm dev:desktop
```

That loads local Vite. A **packaged** desktop build opens **https://app.grogbot.com**, which talks to **https://api.grogbot.com**. Override with `WEB_ORIGIN` if you self-host. The marketing site is **https://grogbot.com**.

Production OAuth callbacks:

- `https://api.grogbot.com/api/auth/callback/google`
- `https://api.grogbot.com/api/auth/callback/github`

Mobile (Expo stub, later):

```bash
pnpm dev:mobile
```

On a device, set `EXPO_PUBLIC_API_URL` to this machine’s LAN address.

## Layout

```
apps/web desktop mobile landing guest api worker
packages/contracts rpc adapter-kit core db auth adapters
infra/compose
docs/
```

## License

MIT
