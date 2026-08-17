# Grogbot

Source-available **Grok Bot** — Grok, then grog. Teammates with a real computer. Composio for Gmail/Slack/GitHub. Shared workspace context and skills. Bring your own model keys. Self-host for your team is free; hosted Grogbot for others is the cloud business.

Packages live under `@grogbot/*`.

Early scaffold: contracts, Postgres (team data), Node worker wakeup (one queue per bot), Flue + Pi on the **Node target**. Hosted grogbot.com sits on Cloudflare for landing/email and computers; the office is still Node so private companies can self-host. Chat UI and live computers next.

## Stack (locked)

- TypeScript, pnpm, Hono, React, Vite, TanStack Router
- **oRPC** — one contract for web, desktop, and mobile
- Postgres + Drizzle — workspaces, threads, skills
- **Flue + Pi** — Node target. One `Teammate`; hires are `botId`
- **One queue per bot** on the Node worker — wakeup, serial runs, delayed sleep
- **Routines** — Postgres cron metadata; worker fires with croner onto that queue
- Better Auth (magic-link email, Google, GitHub)
- Local Compose Postgres; hosted cloud is Cloudflare (landing/email/computers). API + worker stay Node.
- Computers: Docker locally, Cloudflare Computer hosted, desktop only on a trusted machine. E2B later.
- Plugins: Composio (optional)
- UI: **web first** (Grok Bot-simple) — [docs/grok-bot-ui.md](./docs/grok-bot-ui.md). Desktop = Electron around web. Mobile = Expo later.

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

Public LLM / agent discovery (also on https://grogbot.com):

- `/llms.txt` (and `/llm.txt` → 301)
- `/llms.html`, `/llms-full.txt`, `/index.md`
- `/ai.txt`, `/ai.json`, `/identity.json`, `/brand.txt`, `/faq-ai.txt`, `/developer-ai.txt`, `/robots-ai.txt`
- `/robots.txt`, `/sitemap.xml`
- `/mcp` Streamable HTTP + `/.well-known/mcp.json`


Google / GitHub need client IDs in `.env`. Use **127.0.0.1**, not localhost:

- Google redirect: `http://127.0.0.1:5173/api/auth/callback/google`
- GitHub callback: `http://127.0.0.1:5173/api/auth/callback/github`

Email sign-in sends a magic link through **Cloudflare Email Sending** (REST). There is no `wrangler.toml` — this API is Node, not a Worker. Set `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_EMAIL_API_TOKEN`, and `EMAIL_FROM`. Without those, local dev prints the link in the API terminal.

Office chats run **Flue + Pi** (`AGENT_RUNTIME=flue`). Flue is the Node bootstrap; Pi is the agent loop (`useModel`, providers, compaction). Paste provider keys and pick a default model in the office (**Settings → Models**). Each bot can override the workspace default from its settings pane. Offline Flue: `AGENT_RUNTIME=flue-echo`. Tests stay on `scripted`.

**Cloudflare AI Gateway** is in that same Models tab (account id, API token, gateway id). Pick a Cloudflare model — Flue + Pi uses Pi’s `cloudflare-ai-gateway` provider, so tools and the computer still work. See [Cloudflare’s Pi guide](https://developers.cloudflare.com/ai-gateway/integrations/coding-agents/pi/).

Landing (marketing site, TanStack Start):

```bash
pnpm dev:landing
```

Deploy to Cloudflare Workers (grogbot.com). Config lives in `apps/landing/wrangler.jsonc` — no account IDs. Attach the custom domain in the dashboard.

```bash
pnpm --filter @grogbot/landing exec wrangler login
pnpm deploy:landing
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
packages/contracts rpc adapter-kit core db auth adapters mascot seo
infra/compose
docs/
```

## License

Fair-code (Apache 2.0 plus conditions). See [LICENSE](./LICENSE).

Self-host for your own organization is free. You may not run a hosted Grogbot for third parties without a commercial license — that is grogbot.com. Not OSI-open, not MIT.
