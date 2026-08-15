# Architecture

**Grogbot** is open-core **Grok Bot**: AI teammates with a real computer. Composio for app integrations. Team-shared context and skills (the one idea we take from [Cloudflare OS](https://github.com/cloudflare/cloudflare-os)). Not an office suite, not gadgets, not Gatekeepers, not Workers-first.

Job queue follows [Paperclip](https://github.com/paperclipai/paperclip)’s table + poller. Cloudflare OS is a source only for **workspace knowledge + skills**.

## Product

Grok Bot simplicity. You create a bot, message it like a person, it has a computer, it keeps working.

Each bot has:

- one thread (v1 is 1:1; schema allows more people later)
- one computer (sandbox)
- memory
- routines
- history

The **workspace** (Better Auth org) also has:

- **Shared context** — markdown the whole team curates (how we work, voice, policies). Every bot in the workspace can read it.
- **Shared skills** — markdown how-tos (`skills/*.md`) loaded for every bot. Same idea as company skills in Cloudflare OS; stored as files we own, not a CF kernel.
- **Composio plugins** — connect Gmail, Slack, GitHub, etc. Optional `COMPOSIO_API_KEY`. No key = computer-only still works.

We do **not** build: gadgets, blueprints-as-apps, code-mode Dynamic Workers, Cap’n Web office docs, Gatekeeper workers.

### Memory scopes

| Scope | Who sees it |
| --- | --- |
| `bot` | That teammate only |
| `user` | That human, across their bots |
| `workspace` | Everyone in the org — shared context + skills |

### Composio

`ConnectorProvider`. Catalog + OAuth + tool execute. Personal accounts (my Gmail) stay on the user. Company tools (shared Slack) are workspace-visible so every bot can use them once connected. We pay Composio on hosted cloud; self-hosters paste their own key.

Not a replacement for the computer. APIs where they exist; browser when they don’t.

### Multiplayer (later, not v1 UX)

Several humans in one thread, shared computer lease. Schema already has `thread_members` and message `actor_*`. No Discord clone now.

## Locked decisions

| Topic | Choice |
| --- | --- |
| Product | Grok Bot-shaped teammates + Composio + team context/skills |
| First cloud | **Fly or Railway** — stateful Node API + worker |
| Cloudflare | Later adapter, not v1 |
| ORM | **Drizzle** + Postgres |
| Jobs | **`jobs` table** + poller (`FOR UPDATE SKIP LOCKED`) |
| Auth | **Better Auth**, organizations = workspaces |
| Models | **Pi** catalog + BYOK (OpenRouter, OpenAI, Anthropic) |
| Database | **One Postgres**, `workspace_id` everywhere |
| Sandbox | `docker` (local) · `e2b` (hosted) · `desktop` (trusted machine only) · `fake` (tests) |
| Homes | Disk v1 · `HomeStore` → R2 later |
| Realtime | Postgres events + SSE · `RealtimeFanout` |
| Plugins | **Composio** (optional key) |
| Team knowledge | Workspace memory + skills markdown |
| Multiplayer | Not v1. Keep membership/actors/leases |

## Why a job table, not Graphile + Prisma

Graphile is Postgres `LISTEN`. Prisma is awkward on Workers. A job table + Drizzle is the same Fly app; job names can later be invoked from Cloudflare Queues. **Agnostic means four ports, not two runtimes.**

## Processes (v1, stateful)

```
Web (Vite :5173) ──► API (Hono :3100) ──► Postgres
                           │
                           │ enqueue job
                           ▼
                     Worker (poller)
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
    Pi (BYOK)         Sandbox            Composio
    + workspace       docker/e2b         (if key set)
      skills/context
```

Job names: `run.continue` · `routine.wakeup` · `computer.sleep`

## Ports

| Port | v1 | Later Cloudflare |
| --- | --- | --- |
| `WakeupDriver` | Postgres poller | Queue + DO alarm |
| `RealtimeFanout` | Postgres events + SSE | DO WebSocket |
| `HomeStore` | filesystem | R2 |
| `SandboxProvider` | Docker / E2B / desktop / fake | E2B / CF sandbox |
| `ConnectorProvider` | Composio or no-op | same |

Executor must not import `fs`, `dockerode`, Graphile, or Cloudflare bindings.

## Build order

1. Monorepo, schema, jobs, auth, health *(done)*
2. `threads.send` → enqueue → scripted runtime
3. Docker computer
4. Pi + BYOK
5. Thin web shell (Grok Bot-simple: bot list, thread, computer pane)
6. Workspace context + skills in the system prompt
7. Composio plugins UI
8. E2B for Fly
9. Desktop (Electron), never on hosted cloud
10. Group threads — after the above works

## Out of v1

Gadgets, Gatekeepers, Cloudflare Workers as the host, D1, Turso, Graphile, Prisma, Electron/Expo packagers, Pi subscription OAuth (ChatGPT/Copilot device code), Discord UI.
