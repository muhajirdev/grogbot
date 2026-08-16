# AGENTS.md

- Public repo: never commit secrets, `.env`, or real user data.
- Keep domain logic in `packages/*`. Apps wire adapters. Product API is oRPC (`@grogbot/contracts` + `@grogbot/rpc`).
- One Rivet actor per bot. Computers are workspace-scoped: bots bind to a computer (the default computer, or a new isolated one). Shared team data lives in Postgres, not in the actor.
- The Pi/executor must not import `fs`, `dockerode`, or cloud vendor SDKs. The worker (actor host) may import Rivet.
- Auth, secrets, sandbox, and host commands are security-sensitive.
- Tests stay offline: `AGENT_RUNTIME=scripted` (or `flue-echo` for the Pi harness), `SANDBOX_PROVIDER=fake`, in-process Rivet wakeup — no live OpenRouter/E2B/Rivet Cloud.
- Teammate loop: Flue + Pi (`AGENT_RUNTIME=flue`). One `Teammate` function; hires are `botId`, not new agent modules. Gateway remains a simpler chat-completions path.
- Guest runtimes (Hermes/OpenClaw) are opt-in per bot, off by default. They dial out to Grogbot; tests use a fake guest, not live Hermes/OpenClaw.
- v1 surface is **web** (Vite + TanStack Router). Desktop is Electron around web. Mobile is Expo later. All three call **oRPC** via `@grogbot/rpc`.
- See `docs/grok-bot-ui.md`.
- Desktop sandbox is owner opt-in on a trusted machine. Never enable it when the provider is `e2b`.
