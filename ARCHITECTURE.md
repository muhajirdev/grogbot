# Architecture

**Grogbot** is open-core **Grok Bot**: named teammates with a real computer. Message them like people. Composio for Gmail/Slack/GitHub. Workspace-shared context and skills. BYOK models.

UI: copy Grok Bot simplicity — [docs/grok-bot-ui.md](./docs/grok-bot-ui.md). Rooms later: [docs/rooms-plan.md](./docs/rooms-plan.md).

## Product

Each **bot** (teammate) has:

- a home **office** thread (v1 is 1:1; extra humans later)
- one **computer** (sandbox) — on the bot, not the room
- memory, routines, history

A **Rivet actor is the bot**. Serial queue + cron + named delayed schedules. One body, one VM, one Pi at a time.

The **workspace** (Better Auth org) also has:

- **Shared context** — team markdown (how we work). Every bot can read it.
- **Shared skills** — `skills/*.md` for every bot.
- **Composio plugins** — optional `COMPOSIO_API_KEY`. No key = computer-only still works.

**Postgres** is the team source of truth (auth, bots, threads, messages, skills, artifact index). **Rivet** is wakeup and serial execution. They do not share that work.

## Locked decisions

| Topic | Choice |
| --- | --- |
| Product | Grok Bot-shaped teammates + Composio + team context/skills |
| UI | Messaging app: Bot list, thread, computer pane. **Web first.** Desktop = Electron around web. Mobile = Expo later |
| API | **oRPC** — contract in `@grogbot/contracts`, client in `@grogbot/rpc` |
| Actor | **One Rivet actor per bot** |
| Shared data | **One Postgres** — auth, bots, threads, messages, skills, artifacts |
| Wakeup | Rivet queue / `schedule` / cron on that actor |
| First cloud | **Fly or Railway** — Node API + actor host (worker) |
| Cloudflare later | **Rivet’s Durable Object driver** |
| ORM | **Drizzle** + Postgres |
| Auth | **Better Auth** — email/password, Google, GitHub. Organizations = workspaces |
| Models | **Pi** catalog + BYOK |
| Sandbox | `docker` local · `e2b` hosted · `desktop` trusted machine only · `fake` tests |
| Homes | Disk v1 · `HomeStore` → R2 later |
| Realtime | oRPC event iterator now · actor WebSocket later if needed |
| Plugins | **Composio** (optional) |
| Rooms v1 | Bot’s office. Multi-bot rooms: plan only |

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
      Pi (BYOK)         Sandbox            Composio
      + workspace       docker/e2b         (if key set)
        skills
```

Clients share **one contract**. Web is what we build against now. Desktop loads that same web app. Expo is a later shell on the same `@grogbot/rpc` client.

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

Executor must not import `fs`, `dockerode`, or Cloudflare bindings. The **actor host** (worker) may import Rivet. The Pi loop still talks only to ports.

## Build order

1. Monorepo, schema, auth, health, Rivet wakeup stub, oRPC contract *(this)*
2. `threads.send` → bot actor → scripted runtime
3. Docker computer
4. Pi + BYOK
5. Thin **web** shell — [docs/grok-bot-ui.md](./docs/grok-bot-ui.md)
6. Workspace context + skills in the system prompt
7. Composio plugins UI
8. E2B for Fly
9. Desktop window (Electron around web), never on hosted cloud
10. Extra humans, then multi-bot rooms — [docs/rooms-plan.md](./docs/rooms-plan.md)
11. Expo mobile (same oRPC client, RN chrome)

## Out of v1

Gadgets, Gatekeepers, Cloudflare Workers as the host, D1, Turso, Prisma, PGlite as product DB, store signing / Electron-builder / EAS submit, Pi subscription OAuth, Discord UI, agentOS as the default computer, multi-bot rooms.
