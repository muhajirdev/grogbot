# Architecture

**Grogbot** is fair-code **Grok Bot**: named teammates with a real computer. Message them like people. Composio for Gmail/Slack/GitHub. Workspace-shared context and skills. BYOK models. Self-host for your organization is free; grogbot.com is the hosted cloud.

UI: copy Grok Bot simplicity — [docs/grok-bot-ui.md](./docs/grok-bot-ui.md). Rooms later: [docs/rooms-plan.md](./docs/rooms-plan.md).

## Product

Each **bot** (teammate) has:

- a home **office** thread (v1 is 1:1; extra humans later)
- a bound **computer** (sandbox) — workspace **default computer** by default, or a new isolated computer
- memory, routines, history

A **bot actor is the bot**. Serial queue + delayed jobs + cron, one brain at a time. v1 is the Node worker’s `InProcessWakeupDriver` — not Rivet, not the Cloudflare Agents SDK.

**Computers** are a separate primitive. Many bots can share the default computer (files and logins). GUI computer-use is one mouse (`control_holder`); brains still run on their own actors. A bot created with a new computer gets its own VM.

The **workspace** (Better Auth org) also has:

- **Shared context** — team markdown (how we work). Every bot can read it.
- **Shared skills** — `skills/*.md` for every bot.
- **Composio plugins** — optional `COMPOSIO_API_KEY`. No key = computer-only still works.

**Postgres** is the team source of truth (auth, bots, threads, messages, skills, artifact index). The **Node worker** is wakeup and serial execution. They do not share that work.

## Two deployments

Same product, same Node apps. grogbot.com is hosted on Cloudflare; a private company runs the same API + worker themselves.

| | **grogbot.com** (hosted cloud) | **Self-host** (private company) |
| --- | --- | --- |
| Who | We run it for customers | Their infra; no Cloudflare account required |
| Marketing | Cloudflare Workers (`apps/landing`) | Skip, or host however they want |
| API + worker | Node (Hono + oRPC + Flue). Landing is the Worker; the office is still Node. | Same Node processes |
| Brain | Flue + Pi, **Node target** (`@flue/runtime/node`) | Same |
| Wakeup | `InProcessWakeupDriver` on the worker | Same |
| Data | Postgres | Postgres |
| Computer | E2B | Docker / fake; desktop only on a trusted machine |
| Auth email | Cloudflare Email Sending | Log the magic link, or their SMTP later |

Rivet, Agents SDK, Project Think, agentOS, and Cloudflare Sandbox stay out of **v1**. Flue’s Cloudflare target stays out of v1. The actor port (`WakeupDriver`, key = `botId`) is how hosted can move to Agents SDK later without a rewrite.

## Locked decisions

| Topic | Choice |
| --- | --- |
| Product | Grok Bot-shaped teammates + Composio + team context/skills |
| UI | Messaging app. **Web first** (SPA). Marketing is **TanStack Start** at grogbot.com. Packaged desktop loads app.grogbot.com (API: api.grogbot.com). Dev desktop loads local Vite. Mobile = Expo later |
| API | **oRPC** — contract in `@grogbot/contracts`, client in `@grogbot/rpc` |
| Web | **Vite + React 19 + TanStack Router** (SPA). oRPC queries via `@orpc/tanstack-query`. Not TanStack Start — API stays Hono so Electron can load the same origin. |
| Landing | **TanStack Start** on **Cloudflare Workers** (`apps/landing/wrangler.jsonc`). SSR for grogbot.com. CTAs go to the office SPA. |
| Actor | **One queue per bot** on the Node worker — never key on `threadId` |
| Computer | **Workspace default computer.** New computer = isolated sandbox. GUI serialized per computer. |
| Shared data | **One Postgres** — auth, bots, threads, messages, skills, artifacts |
| Wakeup | `InProcessWakeupDriver` — serial queue + named delayed jobs |
| Schedules | Postgres `routines` (cron string, timezone, `next_run_at`). Worker fires with **croner**, then enqueues `routine.wakeup` so it shares the bot queue. Flue has no scheduler. |
| Hosted cloud | **Cloudflare** for grogbot.com landing/email. Office API + worker stay **Node + Flue**. |
| Self-host | **Node + Postgres + Docker.** Same code. No Cloudflare account. |
| ORM | **Drizzle** + Postgres |
| Auth | **Better Auth** — magic-link email (Cloudflare Email Sending REST), Google, GitHub. Organizations = workspaces |
| Models | **BYOK in the office** (Settings → Models). Workspace keys + default model only — not `.env`. A bot may override. Encrypted at rest. **Flue + Pi** (`AGENT_RUNTIME=flue`) is the loop for every provider, including **Cloudflare AI Gateway** (Pi `cloudflare-ai-gateway`). `scripted` / `flue-echo` stay offline for tests |
| Sandbox | `docker` local · `e2b` hosted · `desktop` trusted machine only · `fake` tests |
| Homes | Disk v1 · `HomeStore` → R2 later |
| Realtime | oRPC event iterator now · actor WebSocket later if needed |
| Plugins | **Composio** (optional) |
| Rooms v1 | Bot’s office. Multi-bot rooms: plan only |
| Hosted billing | **Later.** Polar research: [docs/polar-integration.md](./docs/polar-integration.md). Self-host stays free. Not v1. |
| License | **Fair-code** (Apache 2.0 + no competing hosted cloud). [LICENSE](./LICENSE). Not MIT. |

## Wakeup and schedules

The API must not wait on Pi. Waking a bot is: chat now, routine at 9:00, sleep the VM after idle.

Flue runs a **turn**. It does not serialize two chats, delay `computer.sleep`, or fire cron. That is the worker:

- **One queue per `botId`.** Never key it on `threadId`.
- Immediate work: `run.continue` on `InProcessWakeupDriver`.
- Idle sleep: named delayed job (`computer.sleep`). Same `jobKey` replaces the previous timer.
- Routines: Postgres `routines` is the source of truth (prompt, cron string, timezone, last/next). The worker uses **croner** (what Flue’s own Node example uses) and enqueues `routine.wakeup` onto that bot’s queue. Do not `dispatch()` Flue from cron directly — that would skip the serial queue.
- Two humans in one office share **one** queue.
- Two bots in one room (later) are **two** queues.

In-process cron misses fires while the worker is down. `next_run_at` is already on the row; a later poller can catch up. Do not add Rivet, BullMQ, or Cloudflare Cron Triggers for v1.

v1 code: `InProcessWakeupDriver` (serial queue + `setTimeout` per `jobKey`). The worker hosts it. The API enqueues over HTTP (`WORKER_URL`).

## Later — Cloudflare Agents SDK (hosted only)

v1 is already the actor model: **one mailbox per `botId`**. Agents SDK later is a new `WakeupDriver` body, not a new product.

| v1 (Node) | Later (grogbot.com) |
| --- | --- |
| `InProcessWakeupDriver` keyed by `botId` | `class BotAgent extends Agent`, instance name = `botId` |
| `enqueue` immediate | `onRequest` / DO invocation (serial) |
| `setTimeout` + `jobKey` | `this.schedule(...)`; cancel+replace for `computer.sleep` |
| croner → `routine.wakeup` | `this.schedule("0 9 * * *", ...)` then the same handler |
| Flue Node inside the worker | Flue **Cloudflare target** inside that Agent (Agents SDK under the hood) |

Self-host keeps the in-process driver. Do not import `agents` from `packages/core` or the Pi loop. Do not key the Agent on `threadId` (`teammateInstanceId` may stay `botId:threadId` for Flue session state). Do not put threads/messages in DO SQLite — Postgres stays truth. Do not `dispatch()` Flue from cron; always enqueue on the bot actor.

agentOS is **not** the v1 computer — Docker / E2B / desktop are.

## Processes (v1)

```
Web (Vite :5173) ─┐
Desktop (Electron)─┼──► API oRPC (Hono :3100) ──► Postgres (truth)
Mobile (Expo) ────┘          │
                             │ POST /wakeup
                             v
                       Worker (wakeup + Flue Node)
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
| `WakeupDriver` | In-process on the worker; HTTP from API | Cloudflare Agents SDK `Agent` per `botId` (hosted). Self-host stays in-process. |
| Product API | **oRPC** `POST /rpc/*` (Hono). `GET /health` for probes | same contract |
| `RealtimeFanout` | oRPC event iterator (`threads.subscribe`) | actor WebSocket or DO |
| `HomeStore` | filesystem | R2 |
| `SandboxProvider` | Docker / E2B / desktop / fake | E2B / CF sandbox |
| `ConnectorProvider` | Composio or no-op | same |
| Guest runtime | Off. Opt-in: Hermes/OpenClaw dial `/guest/*` | same protocol |

Executor must not import `fs`, `dockerode`, or Cloudflare bindings. The **worker** may import Node and Flue’s Node target. The Pi loop still talks only to ports.

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
3. Docker computer
4. AI Gateway (Cloudflare / OpenRouter) + DeepSeek v4 Flash (optional, no Pi loop)
4b. One `Teammate` agent, instances keyed by `botId:threadId`
5. Thin **web** shell — [docs/grok-bot-ui.md](./docs/grok-bot-ui.md)
6. Workspace context + skills in the system prompt
7. Composio plugins UI
8. E2B for hosted computers
9. Desktop window (Electron around web), never on hosted cloud
10. Extra humans, then multi-bot rooms — [docs/rooms-plan.md](./docs/rooms-plan.md)
11. Expo mobile (same oRPC client, RN chrome)

## Out of v1

Gadgets, Gatekeepers, Rivet/rivetkit, Cloudflare Agents SDK, Cloudflare Workers as the Flue host, D1, Turso, Prisma, PGlite as product DB, store signing / Electron-builder / EAS submit, Pi subscription OAuth, Discord UI, agentOS as the default computer, Project Think, multi-bot rooms, Polar hosted billing.

Hosted grogbot.com billing research (Polar as MoR, workspace as Polar customer, not v1): [docs/polar-integration.md](./docs/polar-integration.md).
