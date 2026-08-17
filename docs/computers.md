# Computers (Flue `useSandbox`)

**Locked:** the desk is a Grogbot product row. The hands are Flue’s builtin sandbox adapters. Do not add a Grogbot `@cloudflare/computer` Worker or a `SANDBOX_PROVIDER=cloudflare` port.

`Teammate` attaches a factory with `useSandbox(...)`. Postgres `computers` (bind-on-hire, `control_holder`, computer pane) stays ours. Flue does not own the lease.

## Light vs heavy

Same hook, different factories:

| Work | Factory | Provider |
| --- | --- | --- |
| Light (files, grep, edit, JS shell) | `flue add sandbox cloudflare-computer` → `getComputerSandbox()` | [`@cloudflare/computer`](https://github.com/cloudflare/computer) `Workspace` |
| Heavy hosted Linux | `cloudflareSandbox(getSandbox(...))` from `@flue/runtime/cloudflare` | [`@cloudflare/sandbox`](https://developers.cloudflare.com/sandbox/) |
| Heavy self-host | Docker adapter, or Node `local()` on a trusted machine | Docker / host |
| Heavy alternate | `flue add sandbox e2b` | E2B |
| Tests | in-memory `bash()` / `SANDBOX_PROVIDER=fake` | none |

Cloudflare Computer and Cloudflare Sandbox are different products. Computer is the cheap durable workspace. Sandbox / Docker / E2B is the full Linux box. Flue already models that; Grogbot should not wrap the SDKs again.

## Key on `computerId`

Flue’s Cloudflare Computer blueprint puts the `Workspace` on **the agent’s Durable Object**. Grogbot desks are **workspace-scoped**. Several bots share the default computer.

Pass the bound `computerId` into the factory (or a host Durable Object named by that id). Do not key the filesystem on `botId` or `botId:threadId`. Isolated hire = another computer row = another Workspace.

`control_holder` still serializes who may mutate a shared desk. `computer.sleep` is still the bot actor’s delayed job; it does not replace Flue’s sandbox lifecycle.

## Node vs Cloudflare target

Grogbot’s brain stays `@flue/runtime/node`. Flue’s `getComputerSandbox({ loader })` and `cloudflareSandbox(...)` are **Cloudflare-target** helpers (Worker Loader, container bindings).

Until the actor moves to the Cloudflare target (later):

- Tests / scaffold: no `useSandbox()` yet, or in-memory `bash()`.
- Self-host heavy: Docker / `local()` via Flue’s Node adapters.
- Hosted Computer / Cloudflare Sandbox: a Flue `SandboxFactory` that talks to those Workers. Do not import `@cloudflare/computer` or `@cloudflare/sandbox` from `packages/core` or Pi.

Do not move Flue onto Workers just to get Computer. Do not put `@cloudflare/think` on the computer DO.

## What `SandboxProvider` is for

`createSandboxProvider` stays a fake (and later Docker/desktop) scaffold for anything outside the agent loop. Agent file/shell tools go through `useSandbox`. `SANDBOX_PROVIDER=fake` remains the test default.

## Not yet

`Teammate` still only calls `useModel` / `useInstruction`. Wiring `useSandbox` is the next computer step, not a second SDK.
