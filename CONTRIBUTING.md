# Contributing

See [ARCHITECTURE.md](./ARCHITECTURE.md) for locked decisions (Rivet actor per bot, Postgres for team data).

```bash
pnpm install
pnpm test
pnpm check
```

CI should run `pnpm test` and `pnpm check`. Default tests stay offline (`fake` sandbox, `scripted` runtime).
