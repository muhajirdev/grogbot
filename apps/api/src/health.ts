import { type Env, oauthProviders } from "./env.js";

export function healthPayload(
  env: Pick<
    Env,
    | "agentRuntime"
    | "sandboxProvider"
    | "workerUrl"
    | "googleClientId"
    | "googleClientSecret"
    | "githubClientId"
    | "githubClientSecret"
  >,
) {
  return {
    ok: true as const,
    version: "0.0.1",
    runtime: env.agentRuntime,
    sandbox: env.sandboxProvider,
    wakeup: env.workerUrl ? "rivet-http" : "rivet",
    oauth: oauthProviders(env),
  };
}
