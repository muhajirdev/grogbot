# AGENTS.md

- Public repo: never commit secrets, `.env`, or real user data.
- Keep domain logic in `packages/*`. Apps wire adapters. Product API is oRPC (`@grogbot/contracts` + `@grogbot/rpc`).
- One queue per bot. Local/self-host: Node worker. Hosted Cloudflare: Durable Object `BotActor` (`WAKEUP_KIND=durable-object`). Computers are workspace-scoped: bots bind to a computer (the default computer, or a new isolated one). Shared team data lives in Postgres, not in the worker.
- The Pi/executor must not import `fs`, `dockerode`, or Cloudflare bindings. The Node worker may import Node and Flue’s Node target (`@flue/runtime/node`). The API Worker uses `@grogbot/adapters/edge` (scripted / gateway). Flue sandbox adapters may import their SDKs.
- Auth, secrets, sandbox, and host commands are security-sensitive.
- Tests stay offline: `AGENT_RUNTIME=scripted` (or `flue-echo` for the Pi harness), `SANDBOX_PROVIDER=fake`, in-process wakeup — no live OpenRouter / Cloudflare Computer / Cloudflare Sandbox / E2B.
- Teammate loop: Flue + Pi (`AGENT_RUNTIME=flue`, product default). Flue boots the process; Pi is `useModel`, providers, and the tool loop. Hands are `useSandbox(factory)` keyed by `computerId`. One `Teammate` function; hires are `botId`, not new agent modules. Gateway remains a simpler chat-completions path.
- Guest runtimes (Hermes/OpenClaw) are opt-in per bot, off by default. They dial out to Grogbot; tests use a fake guest, not live Hermes/OpenClaw.
- v1 surface is **web** (Vite + TanStack Router). Desktop is Electron around web. Mobile is Expo later. All three call **oRPC** via `@grogbot/rpc`.
- See `docs/grok-bot-ui.md` and `docs/computers.md`.
- Desktop sandbox is owner opt-in on a trusted machine. Never enable it for hosted Computer / Sandbox / E2B.
