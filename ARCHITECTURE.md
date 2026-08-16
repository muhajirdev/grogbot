# Architecture

**Grogbot** is fair-code **Grok Bot**: named teammates with a real computer. Message them like people. Composio for Gmail/Slack/GitHub. Workspace-shared context and skills. BYOK models. Self-host for your organization is free; grogbot.com is the hosted cloud.

UI: copy Grok Bot simplicity — [docs/grok-bot-ui.md](./docs/grok-bot-ui.md). Rooms later: [docs/rooms-plan.md](./docs/rooms-plan.md).

## Product

Each **bot** (teammate) has:

- a home **office** thread (v1 is 1:1; extra humans later)
- a bound **computer** (sandbox) — workspace **default computer** by default, or a new isolated computer
- memory, routines, history

A **Rivet actor is the bot**. Serial queue + cron + named delayed schedules. One brain, one Pi at a time.

**Computers** are a separate primitive. Many bots can share the default computer (files and logins). GUI computer-use is one mouse (`control_holder`); brains still run on their own actors. A bot created with a new computer gets its own VM.

The **workspace** (Better Auth org) also has:

- **Shared context** — team markdown (how we work). Every bot can read it.
- **Shared skills** — `skills/*.md` for every bot.
- **Composio plugins** — optional `COMPOSIO_API_KEY`. No key = computer-only still works.

**Postgres** is the team source of truth (auth, bots, threads, messages, skills, artifact index). **Rivet** is wakeup and serial execution. They do not share that work.

## Locked decisions

| Topic | Choice |
| --- | --- |
| Product | Grok Bot-shaped teammates + Composio + team context/skills |
| UI | Messaging app. **Web first** (SPA). Marketing is **TanStack Start** at grogbot.com. Packaged desktop loads app.grogbot.com (API: api.grogbot.com). Dev desktop loads local Vite. Mobile = Expo later |
| API | **oRPC** — contract in `@grogbot/contracts`, client in `@grogbot/rpc` |
| Web | **Vite + React 19 + TanStack Router** (SPA). oRPC queries via `@orpc/tanstack-query`. Not TanStack Start — API stays Hono so Electron can load the same origin. |
| Landing | **TanStack Start** on **Cloudflare Workers** (`apps/landing/wrangler.jsonc`). SSR for grogbot.com. CTAs go to the office SPA. |
| Actor | **One Rivet actor per bot** |
| Computer | **Workspace default computer.** New computer = isolated sandbox. GUI serialized per computer. |
| Shared data | **One Postgres** — auth, bots, threads, messages, skills, artifacts |
| Wakeup | Rivet queue / `schedule` / cron on that actor |
| First cloud | **Fly or Railway** — Node API + actor host (worker) |
| Cloudflare later | **Rivet’s Durable Object driver** |
| ORM | **Drizzle** + Postgres |
| Auth | **Better Auth** — magic-link email (Cloudflare Email Sending REST), Google, GitHub. Organizations = workspaces |
| Models | **Flue + Pi** (`AGENT_RUNTIME=flue`, default). Flue starts the Node harness; Pi is the loop. **AI Gateway** (`gateway` / `cloudflare` / `openrouter`) remains a single-shot chat loop. Default DeepSeek v4 Flash on Cloudflare. `scripted` / `flue-echo` stay offline for tests |
| Sandbox | `docker` local · `e2b` hosted · `desktop` trusted machine only · `fake` tests |
| Homes | Disk v1 · `HomeStore` → R2 later |
| Realtime | oRPC event iterator now · actor WebSocket later if needed |
| Plugins | **Composio** (optional) |
| Rooms v1 | Bot’s office. Multi-bot rooms: plan only |
| Hosted billing | **Later.** Polar research: [docs/polar-integration.md](./docs/polar-integration.md). Self-host stays free. Not v1. |
| License | **Fair-code** (Apache 2.0 + no competing hosted cloud). [LICENSE](./LICENSE). Not MIT. |

## Wakeup (Rivet)

The API must not wait on Pi. Waking a bot is: chat now, routine at 9:00, sleep the VM after idle.

- **One actor per `botId`.** Never key the actor on `threadId`.
- Immediate work goes on that actor’s queue (`run.continue`).
- Routines are cron on that actor (`routine.wakeup`). Postgres `routines` is metadata (prompt, cron string, last/next); Rivet fires it.
- Idle sleep is a named delayed schedule (`computer.sleep`). Same `jobKey` replaces the previous timer.
- Two humans in one office share **one** actor queue.
- Two bots in one room (later) are **two** actors.

v1 code: `RivetWakeupDriver` is an in-process stand-in (serial queue + `setTimeout` per `jobKey`). The worker hosts it. The API enqueues over HTTP (`WORKER_URL`). Swap the body for rivetkit (engine, then Cloudflare DO driver) without changing `WakeupDriver`.

agentOS is **not** the v1 computer — Docker / E2B / desktop are.

## Processes (v1)

```
Web (Vite :5173) ─┐
Desktop (Electron)─┼──► API oRPC (Hono :3100) ──► Postgres (truth)
Mobile (Expo) ────┘          │
                             │ POST /wakeup
                             v
                       Worker (Rivet actors)
                             │
           ┌─────────────────┼─────────────────┐
           ▼                 ▼                 ▼
      Flue + Pi         Sandbox            Composio
      (or gateway)      docker/e2b         (if key set)

Landing (Start :5174) ──► CTAs to the web office (no oRPC)
```

Clients share **one contract**. Web is the office we build against now. The **landing** app is marketing only (no oRPC). Desktop loads that same web app. Expo is a later shell on the same `@grogbot/rpc` client.

Wake a bot with:

- `run.continue` — user messaged (immediate, that bot’s queue)
- `routine.wakeup` — cron on that actor
- `computer.sleep` — named delayed schedule, replaced on activity

## Ports

| Port | v1 | Later |
| --- | --- | --- |
| `WakeupDriver` | Rivet actor (in-process on the worker; HTTP from API) | Rivet engine / CF DO driver |
| Product API | **oRPC** `POST /rpc/*` (Hono). `GET /health` for probes | same contract |
| `RealtimeFanout` | oRPC event iterator (`threads.subscribe`) | actor WebSocket or DO |
| `HomeStore` | filesystem | R2 |
| `SandboxProvider` | Docker / E2B / desktop / fake | E2B / CF sandbox |
| `ConnectorProvider` | Composio or no-op | same |
| Guest runtime | Off. Opt-in: Hermes/OpenClaw dial `/guest/*` | same protocol |

Executor must not import `fs`, `dockerode`, or Cloudflare bindings. The **actor host** (worker) may import Rivet. The Pi loop still talks only to ports.

## Advanced — guest agents (off by default)

Grogbot is the **host**. A bot can optionally allow Hermes or OpenClaw to connect **outbound** to this deployment (Multica-style daemon, not ACP-on-the-wire). Default remains Flue+Pi.

1. Profile → Advanced → Hermes or OpenClaw. A one-time token is minted.
2. On the machine that already has that CLI: `pnpm guest -- --url $GUEST_URL --token … --kind hermes`.
3. The guest process dials `/guest/hello`, waits for `run` jobs, replies with events.
4. Locally it may spawn `hermes acp` / `openclaw acp` (ACP stays on that machine). `--runtime fake` is for tests.

The Rivet actor is still the bot. If the guest is offline, the run stays queued (`waiting for hermes…`). One guest session per bot. Turn off to return to Grogbot’s runtime.

## Build order

1. Monorepo, schema, auth, health, Rivet wakeup stub, oRPC contract *(this)*
2. `threads.send` → bot actor → Flue + Pi (`AGENT_RUNTIME=flue`)
3. Docker computer
4. AI Gateway (Cloudflare / OpenRouter) + DeepSeek v4 Flash (optional, no Pi loop)
4b. One `Teammate` agent, instances keyed by `botId:threadId`
5. Thin **web** shell — [docs/grok-bot-ui.md](./docs/grok-bot-ui.md)
6. Workspace context + skills in the system prompt
7. Composio plugins UI
8. E2B for Fly
9. Desktop window (Electron around web), never on hosted cloud
10. Extra humans, then multi-bot rooms — [docs/rooms-plan.md](./docs/rooms-plan.md)
11. Expo mobile (same oRPC client, RN chrome)

## Out of v1

Gadgets, Gatekeepers, Cloudflare Workers as the Flue/Agents SDK host, D1, Turso, Prisma, PGlite as product DB, store signing / Electron-builder / EAS submit, Pi subscription OAuth, Discord UI, agentOS as the default computer, Project Think, multi-bot rooms, Polar hosted billing.

Hosted grogbot.com billing research (Polar as MoR, workspace as Polar customer, not v1): [docs/polar-integration.md](./docs/polar-integration.md).
