# Architecture

**Grogbot** is fair-code **Grok Bot**: named teammates with a real computer. Message them like people. Composio for Gmail/Slack/GitHub. Workspace-shared context and skills. BYOK models. Self-host for your organization is free; grogbot.com is the hosted cloud.

UI: copy Grok Bot simplicity — [docs/grok-bot-ui.md](./docs/grok-bot-ui.md). Rooms later: [docs/rooms-plan.md](./docs/rooms-plan.md).

## Product

Each **bot** (teammate) has:

- a home **office** thread (v1 is 1:1; extra humans later)
- a bound **computer** (sandbox) — workspace **default computer** by default, or a new isolated computer
- memory, routines, history

A **bot actor is the bot**. Serial queue + delayed jobs + cron, one brain at a time. Product path is `DurableObjectWakeupDriver` (`BotActor`, one DO per `botId`). Not Rivet, not the Cloudflare Agents SDK. Node `InProcessWakeupDriver` is leftover for a later self-host port.

**Computers** are a separate primitive. Many bots can share the default computer (files and logins). GUI computer-use is one mouse (`control_holder`); brains still run on their own actors. A bot created with a new computer gets its own isolated sandbox.

The **workspace** (Better Auth org) also has:

- **Shared context** — team markdown (how we work). Every bot can read it.
- **Shared skills** — `skills/*.md` for every bot.
- **Composio plugins** — optional `COMPOSIO_API_KEY`. No key = computer-only still works.

**Postgres** is the team source of truth (auth, bots, threads, messages, skills, artifact index). Wakeup and serial execution live on a Durable Object. They do not share that work with Postgres.

## Two deployments

Product is **Cloudflare Workers**. Self-host is later (Node or workerd) — do not dual-optimize.

| | **grogbot.com** (now) | **Self-host** (later) |
| --- | --- | --- |
| Who | We run it for customers | Their infra |
| Marketing | Cloudflare Worker (`apps/landing`) | Skip, or host however they want |
| Office SPA | Cloudflare Worker (`apps/web`); local Vite | Same |
| API | Cloudflare Worker (`apps/api` + Neon HTTP). Local: `wrangler dev` | TBD |
| Brain | Gateway if model keys exist, else scripted | TBD (Flue Node or Flue CF target) |
| Wakeup | Durable Object `BotActor` per `botId` | TBD |
| Data | Neon Postgres | TBD |
| Computer | `SANDBOX_PROVIDER=fake` until Computer/Sandbox factories | TBD |
| Auth email | Cloudflare Email Sending | TBD |

Rivet, Agents SDK, Project Think, and agentOS stay out of **v1**. Flue’s Cloudflare target stays out of v1 (hosted brains are gateway/scripted). Hands are Flue sandbox factories, keyed by Grogbot `computerId`. Wiring: [docs/computers.md](./docs/computers.md). The actor port (`WakeupDriver`, key = `botId`) is how hosted can move to Agents SDK later without a rewrite.

## Locked decisions

| Topic | Choice |
| --- | --- |
| Product | Grok Bot-shaped teammates + Composio + team context/skills |
| UI | Messaging app. **Web first** (SPA). Marketing is **TanStack Start** at grogbot.com. Packaged desktop loads app.grogbot.com (API: api.grogbot.com). Dev desktop loads local Vite. Mobile = Expo later |
| API | **oRPC** — contract in `@grogbot/contracts`, client in `@grogbot/rpc` |
| Web | **Vite + React 19 + TanStack Router** (SPA). oRPC queries via `@orpc/tanstack-query`. Not TanStack Start — API stays Hono so Electron can load the same origin. |
| Landing | **TanStack Start** on **Cloudflare Workers** (`apps/landing/wrangler.jsonc`). SSR for grogbot.com. CTAs go to the office SPA. |
| Actor | **One queue per bot** — never key on `threadId`. Durable Object `BotActor`. |
| Computer | **Workspace default computer.** New computer = isolated sandbox. GUI serialized per computer. |
| Shared data | **One Postgres** — auth, bots, threads, messages, skills, artifacts |
| Wakeup | `DurableObjectWakeupDriver` — serial queue + named delayed jobs (DO alarms) |
| Schedules | Postgres `routines` (cron string, timezone, `next_run_at`). Enqueue `routine.wakeup` on the bot actor. Do not run Flue from cron directly. |
| Hosted cloud | **Cloudflare first.** Workers for landing, office SPA, and API. Neon Postgres. Durable Object wakeup. Brains are gateway/scripted until Flue’s Cloudflare target. Local loop is `wrangler dev`. |
| Self-host | **Later.** Do not add Node-only product features. |
| ORM | **Drizzle** + Postgres |
| Auth | **Better Auth** — magic-link email (Cloudflare Email Sending REST), Google, GitHub. Organizations = workspaces |
| Models | **BYOK in the office** (Settings → Models). Workspace keys + default model only — not `.env`. A bot may override. Encrypted at rest. Hosted loop is gateway / scripted (`AGENT_RUNTIME=flue` maps to that on the Worker). `scripted` / `flue-echo` stay offline for tests |
| Sandbox | Flue `useSandbox`: `fake` / in-memory tests · Cloudflare Computer light · Cloudflare Sandbox / `docker` / `e2b` heavy · `desktop` trusted machine only |
| Homes | Disk v1 · `HomeStore` → R2 later |
| Realtime | oRPC event iterator now · actor WebSocket later if needed |
| Plugins | **Composio** (optional) |
| Rooms v1 | Bot’s office. Multi-bot rooms: plan only |
| Hosted billing | **Later.** Polar research: [docs/polar-integration.md](./docs/polar-integration.md). Self-host stays free. Not v1. |
| License | **Fair-code** (Apache 2.0 + no competing hosted cloud). [LICENSE](./LICENSE). Not MIT. |

## Wakeup and schedules

The API must not wait on Pi. Waking a bot is: chat now, routine at 9:00, sleep the computer after idle.

Flue runs a **turn**. It does not serialize two chats, delay `computer.sleep`, or fire cron. That is the actor:

- **One queue per `botId`.** Never key it on `threadId`.
- Immediate work: `run.continue` on `DurableObjectWakeupDriver`.
- Idle sleep: named delayed job (`computer.sleep`). Same `jobKey` replaces the previous timer.
- Routines: Postgres `routines` is the source of truth (prompt, cron string, timezone, last/next). Enqueue `routine.wakeup` onto that bot’s queue. Do not `dispatch()` Flue from cron directly — that would skip the serial queue.
- Two humans in one office share **one** queue.
- Two bots in one room (later) are **two** queues.

v1 code: `DurableObjectWakeupDriver` + `BotActor` alarms. Node `InProcessWakeupDriver` is not the product loop.

## Later — Flue Cloudflare target + Agents SDK

v1 is already the actor model: **one mailbox per `botId`**. Hosted already uses a Durable Object (`BotActor`). Agents SDK / Flue Cloudflare target later is a new brain inside that actor, not a new product.

| v1 Node (self-host) | v1 hosted | Later (grogbot.com) |
| --- | --- | --- |
| `InProcessWakeupDriver` keyed by `botId` | `BotActor` Durable Object, name = `botId` | `class BotAgent extends Agent` |
| `enqueue` immediate | DO `fetch` (serial) | `onRequest` / DO invocation |
| `setTimeout` + `jobKey` | DO alarm + storage | `this.schedule(...)`; cancel+replace for `computer.sleep` |
| croner → `routine.wakeup` | same handlers on the DO | `this.schedule("0 9 * * *", ...)` then the same handler |
| Flue Node inside the worker | gateway / scripted | Flue **Cloudflare target** inside that Agent |

Self-host is later. Do not import `agents` from `packages/core` or the Pi loop. Do not key the Agent on `threadId` (`teammateInstanceId` may stay `botId:threadId` for Flue session state). Do not put threads/messages in DO SQLite — Postgres stays truth. Do not `dispatch()` Flue from cron; always enqueue on the bot actor.

agentOS is **not** the v1 computer. The desk is Grogbot’s `computers` row; the hands are Flue `useSandbox` factories.

## Processes (v1)

Local and hosted are the same Worker:

```
Landing Worker ──► CTAs to the office SPA
Vite :5173 (dev) / Web Worker (prod) ──► API Worker (Hono + oRPC + Neon HTTP)
                                              │
                                              v
                                        BotActor Durable Object (one per botId)
                                              │
                                              v
                                        gateway / scripted  (Flue CF target later)
```

Clients share **one contract**. Web is the office we build against now. The **landing** app is marketing only (no oRPC). Desktop loads that same web app. Expo is a later shell on the same `@grogbot/rpc` client.

Wake a bot with:

- `run.continue` — user messaged (immediate, that bot’s queue)
- `routine.wakeup` — cron on that actor
- `computer.sleep` — named delayed schedule, replaced on activity

## Ports

| Port | v1 | Later |
| --- | --- | --- |
| `WakeupDriver` | Durable Object `BotActor` on the API Worker | Cloudflare Agents SDK `Agent` per `botId`. Self-host later. |
| Product API | **oRPC** `POST /rpc/*` (Hono). `GET /health` for probes | same contract |
| `RealtimeFanout` | oRPC event iterator (`threads.subscribe`) | actor WebSocket or DO |
| `HomeStore` | filesystem | R2 |
| `SandboxProvider` | Fake scaffold only. Agent hands = Flue `useSandbox` | same |
| `ConnectorProvider` | Composio or no-op | same |
| Guest runtime | Off. Opt-in: Hermes/OpenClaw dial `/guest/*` | same protocol |

Executor / `packages/core` must not import `fs`, `dockerode`, or Cloudflare bindings. The API Worker uses `@grogbot/adapters/edge`. Flue sandbox adapters (Computer, Sandbox, Docker, E2B) may import their SDKs. The Pi loop still talks only to ports. Do not add a Grogbot Computer Worker behind `SandboxProvider`.

## Advanced — guest agents (off by default)

Grogbot is the **host**. A bot can optionally allow Hermes or OpenClaw to connect **outbound** to this deployment (Multica-style daemon, not ACP-on-the-wire). Default remains Flue+Pi.

1. Profile → Advanced → Hermes or OpenClaw. A one-time token is minted.
2. On the machine that already has that CLI: `pnpm guest -- --url $GUEST_URL --token … --kind hermes`.
3. The guest process dials `/guest/hello`, waits for `run` jobs, replies with events.
4. Locally it may spawn `hermes acp` / `openclaw acp` (ACP stays on that machine). `--runtime fake` is for tests.

The bot actor is still the bot. If the guest is offline, the run stays queued (`waiting for hermes…`). One guest session per bot. Turn off to return to Grogbot’s runtime.

## Build order

1. Monorepo, schema, auth, health, in-process wakeup stub, oRPC contract *(this)*
2. `threads.send` → bot actor → Flue + Pi (`AGENT_RUNTIME=flue`)
3. Docker via Flue `useSandbox` (self-host heavy)
4. AI Gateway (Cloudflare / OpenRouter) + DeepSeek v4 Flash (optional, no Pi loop)
4b. One `Teammate` agent, instances keyed by `botId:threadId`
5. Thin **web** shell — [docs/grok-bot-ui.md](./docs/grok-bot-ui.md)
6. Workspace context + skills in the system prompt
7. Composio plugins UI
8. `Teammate` `useSandbox` — Cloudflare Computer (light), Cloudflare Sandbox / Docker / E2B (heavy) — [docs/computers.md](./docs/computers.md)
9. Desktop window (Electron around web), never on hosted cloud
10. Extra humans, then multi-bot rooms — [docs/rooms-plan.md](./docs/rooms-plan.md)
11. Expo mobile (same oRPC client, RN chrome)

## Out of v1

Gadgets, Gatekeepers, Rivet/rivetkit, Cloudflare Agents SDK, Flue Cloudflare target as the brain host, D1, Turso, Prisma, PGlite as product DB, store signing / Electron-builder / EAS submit, Pi subscription OAuth, Discord UI, agentOS as the default computer, Project Think, multi-bot rooms, Polar hosted billing.

Hosted grogbot.com billing research (Polar as MoR, workspace as Polar customer, not v1): [docs/polar-integration.md](./docs/polar-integration.md). Computers: [docs/computers.md](./docs/computers.md).
