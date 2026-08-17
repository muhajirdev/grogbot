# Cloudflare Computer (hosted computers)

**Locked:** grogbot.com computers use [`@cloudflare/computer`](https://blog.cloudflare.com/cloudflare-computer/). E2B is later, not v1. Self-host stays Docker. Tests stay `fake`.

This is the hosted **computer** (hands). It is not the bot actor and not the Flue + Pi loop.

## Why this, not E2B first

E2B is a full microVM with a desktop stream. That still matches a later “real Linux desktop + VNC takeover” story. For grogbot.com now:

- Hosted cloud is already Cloudflare (landing, email, AI Gateway).
- `@cloudflare/computer` is a workspace filesystem (Durable Object SQLite) plus isolate and container backends — closer to “every teammate has a disk and a shell” than “every teammate has a VM.”
- One box per **computer id**, not per hire. Shared default computer is one Workspace; “new computer” is another.

Keep E2B in `SandboxKind` so a later `E2bSandboxProvider` can sit behind the same port.

## Hands, not brain

Cloudflare’s examples often put `@cloudflare/think` (or another agent loop) **on** the Durable Object next to `Workspace`. Do not copy that.

| Piece | Where it lives |
| --- | --- |
| Bot actor / queue | Node worker (`InProcessWakeupDriver`, key = `botId`) |
| Flue + Pi | Node worker |
| Team data | Postgres |
| Computer FS + exec | Cloudflare Worker + Durable Object named by `computerId` |
| Pi / executor | Ports only — no `fs`, `dockerode`, or Cloudflare bindings |

The Node `SandboxProvider` (`kind: "cloudflare"`) provisions and executes over HTTP to that Worker. Same split as API → worker wakeup. Self-host never starts the computer Worker.

Do not import `@cloudflare/computer` from `packages/core` or the Pi loop. Do not key the computer Durable Object on `threadId` or `botId`. Do not store threads or messages in DO SQLite.

## Shared desk

Unchanged product rules:

- Workspace default computer = one Cloudflare Computer Workspace.
- Several bots bind to it (`bots.computerId`).
- `control_holder` serializes who may mutate the machine.
- `computer.sleep` hibernates the DO / stops the container backend. The SQLite filesystem stays.
- Isolated bot = second Workspace (`providerRef` = that DO id).

Cloudflare Computer is files + shell (+ container when the task needs Linux). It is **not** an E2B desktop stream. The v1 computer pane is files/terminal and takeover (`control_holder`), not dual VNC screens. E2B later if we need that GUI.

Do not enable the local **desktop** sandbox when the provider is `cloudflare` (or later `e2b`).

## Not these Cloudflare products

| Product | Role here |
| --- | --- |
| `@cloudflare/computer` | **v1 hosted computer** |
| `@cloudflare/sandbox` | Not the v1 computer. Older container SDK. |
| Cloudflare Agents SDK / Flue Cloudflare target | Later **actor**, not the computer |
| AI Gateway | Models, already in Settings |

## Implementation sketch (when we build it)

1. A small Worker (`apps/computer` or similar) with one Durable Object class. Instance name = Grogbot `computerId`. Hosts `Workspace`. Optional container backend for real binaries.
2. Authenticated HTTP (or RPC) from the Node worker: `provision` / `exec` / `stop` / `destroy` mapped to `SandboxProvider`.
3. `computers.provider_ref` stores the DO id. `kind = "cloudflare"`.
4. Tests stay offline: fake provider, no live Cloudflare computer.

`SANDBOX_PROVIDER=cloudflare` is the hosted default once that Worker exists. Until then the scaffold stays `fake`.
