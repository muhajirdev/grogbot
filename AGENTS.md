# AGENTS.md

- Public repo: never commit secrets, `.env`, or real user data.
- Keep domain logic in `packages/*`. Apps wire adapters.
- The executor must not import `fs`, `dockerode`, Graphile, or cloud vendor SDKs.
- Auth, secrets, sandbox, and host commands are security-sensitive.
- Tests stay offline: `AGENT_RUNTIME=scripted`, `SANDBOX_PROVIDER=fake`, in-memory or Postgres Testcontainers — no live OpenRouter/E2B.
- v1 surfaces: web + API + worker. Consider Electron/mobile only when changing contracts.
- Desktop sandbox is owner opt-in on a trusted machine. Never enable it when the provider is `e2b`.
