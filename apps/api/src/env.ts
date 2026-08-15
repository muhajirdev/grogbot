export interface Env {
  databaseUrl: string;
  authSecret: string;
  authUrl: string;
  webOrigin: string;
  sandboxProvider: string;
  agentRuntime: string;
  workerUrl?: string;
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const databaseUrl = source.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  const authSecret = source.BETTER_AUTH_SECRET ?? "";
  if (authSecret.length < 32 && source.NODE_ENV === "production") {
    throw new Error(
      "BETTER_AUTH_SECRET must be at least 32 characters in production",
    );
  }
  return {
    databaseUrl,
    authSecret: authSecret || "development-only-change-me-please-32ch",
    authUrl: source.BETTER_AUTH_URL ?? "http://127.0.0.1:5173",
    webOrigin: source.WEB_ORIGIN ?? "http://127.0.0.1:5173",
    sandboxProvider: source.SANDBOX_PROVIDER ?? "fake",
    agentRuntime: source.AGENT_RUNTIME ?? "scripted",
    workerUrl: source.WORKER_URL,
  };
}
