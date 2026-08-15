# Contributing

See [ARCHITECTURE.md](./ARCHITECTURE.md) for locked decisions.

```bash
pnpm install
pnpm test
pnpm check
```

CI should run `pnpm test` and `pnpm check`. Default tests stay offline (`fake` sandbox, `scripted` runtime).
