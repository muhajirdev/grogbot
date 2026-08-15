# Architecture

Open-core product: AI teammates with a real computer. Inspired by [Rakazo](https://github.com/elie222/rakazo) and [Paperclip](https://github.com/paperclipai/paperclip). Not a clone of either.

## Product (v1)

Each bot has:

- one thread (v1 behaves 1:1 human; schema allows more members later)
- one computer (sandbox)
- memory (markdown documents)
- routines (schedules)
- history (messages + events)

v1 is **computer + BYOK models**. Plugins (Composio etc.) are a later `ConnectorProvider`. Subagents / spawn-bot come after the seams work.

## Locked decisions

| Topic | Choice |
| --- | --- |
| First cloud | **Fly or Railway** — stateful Node API + worker |
| Cloudflare | Later adapter, not v1 |
| ORM | **Drizzle** + Postgres |
| Jobs | **`jobs` table** + poller (`FOR UPDATE SKIP LOCKED`) |
| Auth | **Better Auth**, email/password, organizations = workspaces |
| Models | BYOK: OpenRouter, OpenAI, Anthropic |
| System of record | **One Postgres**, `workspace_id` everywhere. Not D1/Turso per customer |
| Sandbox | `docker` (local default) · `e2b` (hosted) · `desktop` (trusted machine only) · `fake` (tests) |
| Homes | Local disk v1 · `HomeStore` interface so R2 can replace it |
| Realtime | Events in Postgres + SSE from the API. `RealtimeFanout` interface |
| Plugins | Out of v1 |
| Multiplayer | Not v1 UX. Schema has `thread_members` and message `actor_*` so group chat is not a rewrite |

## Why not Rakazo’s Graphile + Prisma

Graphile Worker is Postgres `LISTEN` + a vendor runner. Workers cannot `LISTEN`. Prisma’s engine is awkward on Workers.

A job table + Drizzle is the same Fly app, and the three job names can later be invoked from Cloudflare Queues. See the conversation that led here: **agnostic means four ports, not two runtimes.**

## Processes (v1, stateful)

```
Web (Vite :5173) ──► API (Hono :3100) ──► Postgres
                           │
                           │ enqueue job
                           ▼
                     Worker (poller)
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         AgentRuntime   Sandbox      HomeStore
         (later: Pi)    docker/e2b   disk
```

Job names:

- `run.continue`
- `routine.wakeup`
- `computer.sleep`

## Ports (keep the executor free of Fly/CF)

| Port | v1 | Later Cloudflare |
| --- | --- | --- |
| `WakeupDriver` | Postgres poller | Queue + Durable Object alarm |
| `RealtimeFanout` | Postgres events + SSE | Durable Object WebSocket |
| `HomeStore` | filesystem | R2 |
| `SandboxProvider` | Docker / E2B / desktop / fake | E2B / CF sandbox |

The executor must not import `fs`, `dockerode`, Graphile, or Cloudflare bindings.

Do **not** implement Fly and Workers in v1. Do **not** add Redis “for Cloudflare.”

## Multiplayer later (do not build now)

Cheap leftovers already in schema:

- workspace membership (Better Auth org)
- `thread_members`
- messages: `actor_type` + `actor_id`
- computer `control_holder` lease
- realtime by `thread_id`, not `user_id`

Not now: Discord UI, channels, presence, voice.

## Cloud later

1. **Hosted on Fly/Railway** — same processes, `SANDBOX_PROVIDER=e2b`. Easy.
2. **Control plane on Cloudflare** — swap wakeup, fanout, home. Agent loop stays E2B/Container, not a vanilla Worker. Medium, only if these ports stay clean.

## Build order

1. This monorepo, schema, jobs, auth, health
2. `threads.send` → enqueue → worker stub
3. Fake sandbox + scripted runtime (tests)
4. Docker computer
5. BYOK OpenRouter / OpenAI
6. Thin web shell
7. E2B for Fly
8. Desktop provider (Electron), never on hosted cloud
9. Plugins / group threads / Cloudflare adapters — after the product works

## Explicitly out of v1

Composio, Electron packagers, Expo, Pi OAuth (ChatGPT/Copilot device code), Cloudflare Workers, D1, Turso, Graphile, Prisma, per-tenant databases.
