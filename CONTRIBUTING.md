# Contributing

See [ARCHITECTURE.md](./ARCHITECTURE.md) for locked decisions (one actor per bot, Postgres for team data, oRPC, web-first clients, Cloudflare Durable Objects when hosted).

Contributions are under the [Grogbot License](./LICENSE): self-host for your organization is free; the authors may use contributions in grogbot.com and may tighten or relax the license.

```bash
pnpm install
pnpm test
pnpm check
```

`pnpm dev` is API + worker + **web**. Landing: `pnpm dev:landing`. Desktop: `pnpm dev:desktop`. Mobile: `pnpm dev:mobile`.

CI should run `pnpm test` and `pnpm check`. Default tests stay offline (`fake` sandbox, `scripted` runtime). Product default is Flue + Pi. `flue-echo` covers that harness without model keys.
