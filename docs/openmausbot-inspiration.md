# OpenMausBot inspiration

[OpenMausBot](https://github.com/milind-soni/OpenMausBot) is an MIT-licensed, screenshotable Grok Bot clone. Use it as a **visual and interaction reference** when Grok Bot itself is paywalled. Product, runtime, and hosting stay ours.

Related: [grok-bot-ui.md](./grok-bot-ui.md) (what to copy from Grok Bot), [rooms-plan.md](./rooms-plan.md) (group chat later).

Look at: [README](https://github.com/milind-soni/OpenMausBot), [product page](https://www.supamaus.com/products/openmausbot), [docs/screenshots](https://github.com/milind-soni/OpenMausBot/tree/main/docs/screenshots).

## Take

These already match Grok Bot, and OpenMausBot ships them as working UI:

| Pattern | Why |
| --- | --- |
| Dark Grok palette | Pixel-sampled in their `src/styles.css`: `#070707` app, `#111111` panel, `#2f2f2f` raised, `#1084fe` accent. Messaging app, not an IDE. |
| Roster as contacts | Search, last-message preview, time, unread, pin. Right-click: pin, unread, edit profile, duplicate, hide, delete. |
| Computer as a pane | Overlay / right slot. Live preview, **Open desktop**, takeover. Closing it does not stop work. Routines live next to the screen. |
| Approvals in chat | Inline Allow / Deny cards for shell, edits, questions. Decision is a message, not a settings page. |
| Tool activity chips | Streaming turn shows `read` / `browser` pills, then the reply. Transcript is the audit log. |
| Connected apps | Composio marketplace: Gmail, Slack, GitHub, Notion, Linear. OAuth when the bot hits a wall. |
| Keys write-only | Settings only ever show “configured”. Secrets never round-trip to the UI. |
| Marketing shape | Hero = “team of AI bots, in a chat app.” Three steps. Feature grid with product chrome, not stock photos. Job chips, not a workflow gallery. |

## Leave

Do **not** copy these. They fight locked Grogbot decisions.

| Theirs | Ours |
| --- | --- |
| Local harness on `127.0.0.1` spawning `claude` / `codex` / `grok` CLIs | Pi + BYOK. One Rivet actor per bot. Postgres is team truth. |
| Data in `~/.openmausbot` | Workspace data in Postgres. Homes on disk, then R2. |
| One computer per bot (Box / this Mac) | Workspace **Desk** shared by default. New computer = isolated sandbox. One mouse per desk. |
| Mascot avatars (SupaMaus) | Geometric color + shape. No photoreal faces, no their mascot. |
| Download a signed `.dmg` as the product | **Web first.** Desktop is Electron around the office. Landing CTAs go to the SPA. |
| Voice / ElevenLabs / call mode | Out of v1. |
| Group rooms, chief of staff, bot-to-bot | [rooms-plan.md](./rooms-plan.md). Office is 1:1 in v1. |
| Driver SPI over local CLIs | oRPC contract + `@grogbot/rpc`. Guest runtimes (Hermes / OpenClaw) are opt-in later, not the default brain. |

## Landing vs office

- **Landing** (`apps/landing`): follow their product-page structure and the sampled dark palette. Sell *our* product (you host it, shared Desk, BYOK).
- **Office** (`apps/web`): still match Grok Bot. Use OpenMausBot when we need a screenshot of context menus, approval cards, activity chips, or the computer + routines slot.

## Not affiliated

OpenMausBot is independent. Do not imply we are them, fork them, or ship their mascot. Cite the repo in docs only.
