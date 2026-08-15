import type { Env } from "./env.js";

export function healthPayload(
  env: Pick<Env, "agentRuntime" | "sandboxProvider" | "workerUrl">,
) {
  return {
    ok: true as const,
    version: "0.0.1",
    runtime: env.agentRuntime,
    sandbox: env.sandboxProvider,
    wakeup: env.workerUrl ? "rivet-http" : "rivet",
  };
}
