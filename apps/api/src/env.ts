export interface Env {
  databaseUrl: string;
  authSecret: string;
  authUrl: string;
  webOrigin: string;
  corsOrigins: string[];
  sandboxProvider: string;
  agentRuntime: string;
  workerUrl?: string;
}

function parseOrigins(value: string | undefined, fallback: string[]): string[] {
  const extra =
    value
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean) ?? [];
  return [...new Set([...fallback, ...extra])];
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
  const webOrigin = source.WEB_ORIGIN ?? "http://127.0.0.1:5173";
  return {
    databaseUrl,
    authSecret: authSecret || "development-only-change-me-please-32ch",
    authUrl: source.BETTER_AUTH_URL ?? "http://127.0.0.1:5173",
    webOrigin,
    corsOrigins: parseOrigins(source.CORS_ORIGINS, [
      webOrigin,
      "http://127.0.0.1:5173",
      "http://localhost:5173",
      "http://127.0.0.1:8081",
      "http://localhost:8081",
    ]),
    sandboxProvider: source.SANDBOX_PROVIDER ?? "fake",
    agentRuntime: source.AGENT_RUNTIME ?? "scripted",
    workerUrl: source.WORKER_URL,
  };
}
