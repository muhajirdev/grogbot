# Contributing

See [ARCHITECTURE.md](./ARCHITECTURE.md) for locked decisions (Rivet actor per bot, Postgres for team data, oRPC, web-first clients).

```bash
pnpm install
pnpm test
pnpm check
```

`pnpm dev` is API + worker + **web**. Landing: `pnpm dev:landing`. Desktop: `pnpm dev:desktop`. Mobile: `pnpm dev:mobile`.

CI should run `pnpm test` and `pnpm check`. Default tests stay offline (`fake` sandbox, `scripted` runtime).
