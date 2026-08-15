import { CLOUD_API_ORIGIN, CLOUD_WEB_ORIGIN } from "@grogbot/contracts";

export type OAuthProviderId = "google" | "github";

export interface Env {
  databaseUrl: string;
  authSecret: string;
  authUrl: string;
  webOrigin: string;
  corsOrigins: string[];
  sandboxProvider: string;
  agentRuntime: string;
  workerUrl?: string;
  googleClientId?: string;
  googleClientSecret?: string;
  githubClientId?: string;
  githubClientSecret?: string;
}

function pair(
  id: string | undefined,
  secret: string | undefined,
): { clientId: string; clientSecret: string } | undefined {
  const clientId = id?.trim();
  const clientSecret = secret?.trim();
  if (!clientId || !clientSecret) return undefined;
  return { clientId, clientSecret };
}

type OAuthEnv = Pick<
  Env,
  | "googleClientId"
  | "googleClientSecret"
  | "githubClientId"
  | "githubClientSecret"
>;

export function oauthCredentials(env: OAuthEnv) {
  return {
    google: pair(env.googleClientId, env.googleClientSecret),
    github: pair(env.githubClientId, env.githubClientSecret),
  };
}

export function oauthProviders(env: OAuthEnv): OAuthProviderId[] {
  const creds = oauthCredentials(env);
  const list: OAuthProviderId[] = [];
  if (creds.google) list.push("google");
  if (creds.github) list.push("github");
  return list;
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
      CLOUD_WEB_ORIGIN,
      CLOUD_API_ORIGIN,
      "http://127.0.0.1:5173",
      "http://localhost:5173",
      "http://127.0.0.1:8081",
      "http://localhost:8081",
    ]),
    sandboxProvider: source.SANDBOX_PROVIDER ?? "fake",
    agentRuntime: source.AGENT_RUNTIME ?? "scripted",
    workerUrl: source.WORKER_URL,
    googleClientId: source.GOOGLE_CLIENT_ID,
    googleClientSecret: source.GOOGLE_CLIENT_SECRET,
    githubClientId: source.GITHUB_CLIENT_ID,
    githubClientSecret: source.GITHUB_CLIENT_SECRET,
  };
}
