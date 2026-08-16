import { type GatewayEnv, resolveAgentRuntimeKind } from "@grogbot/adapters";
import {
  CLOUD_API_ORIGIN,
  CLOUD_LANDING_ORIGIN,
  CLOUD_WEB_ORIGIN,
} from "@grogbot/contracts";

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
  apiUrl?: string;
  guestUrl?: string;
  googleClientId?: string;
  googleClientSecret?: string;
  githubClientId?: string;
  githubClientSecret?: string;
  aiGatewayProvider?: string;
  aiGatewayModel?: string;
  cloudflareAccountId?: string;
  cloudflareApiToken?: string;
  cloudflareAiGatewayId?: string;
  openrouterApiKey?: string;
  grogbotModel?: string;
  anthropicApiKey?: string;
  openaiApiKey?: string;
  emailFrom?: string;
  cloudflareEmailToken?: string;
  production: boolean;
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
      CLOUD_LANDING_ORIGIN,
      CLOUD_WEB_ORIGIN,
      CLOUD_API_ORIGIN,
      "http://127.0.0.1:5173",
      "http://localhost:5173",
      "http://127.0.0.1:5174",
      "http://localhost:5174",
      "http://127.0.0.1:8081",
      "http://localhost:8081",
    ]),
    sandboxProvider: source.SANDBOX_PROVIDER ?? "fake",
    agentRuntime: resolveAgentRuntimeKind(source.AGENT_RUNTIME),
    workerUrl: source.WORKER_URL,
    apiUrl: source.API_URL ?? "http://127.0.0.1:3100",
    guestUrl: source.GUEST_URL,
    googleClientId: source.GOOGLE_CLIENT_ID,
    googleClientSecret: source.GOOGLE_CLIENT_SECRET,
    githubClientId: source.GITHUB_CLIENT_ID,
    githubClientSecret: source.GITHUB_CLIENT_SECRET,
    aiGatewayProvider: source.AI_GATEWAY_PROVIDER,
    aiGatewayModel: source.AI_GATEWAY_MODEL,
    cloudflareAccountId: source.CLOUDFLARE_ACCOUNT_ID,
    cloudflareApiToken:
      source.CLOUDFLARE_API_TOKEN ?? source.CLOUDFLARE_AUTH_TOKEN,
    cloudflareAiGatewayId: source.CLOUDFLARE_AI_GATEWAY_ID,
    openrouterApiKey: source.OPENROUTER_API_KEY,
    grogbotModel: source.GROGBOT_MODEL,
    anthropicApiKey: source.ANTHROPIC_API_KEY,
    openaiApiKey: source.OPENAI_API_KEY,
    emailFrom: source.EMAIL_FROM,
    cloudflareEmailToken: source.CLOUDFLARE_EMAIL_API_TOKEN,
    production: source.NODE_ENV === "production",
  };
}

export function gatewaySource(env: Env): GatewayEnv {
  return {
    AI_GATEWAY_PROVIDER: env.aiGatewayProvider,
    AI_GATEWAY_MODEL: env.aiGatewayModel,
    CLOUDFLARE_ACCOUNT_ID: env.cloudflareAccountId,
    CLOUDFLARE_API_TOKEN: env.cloudflareApiToken,
    CLOUDFLARE_AI_GATEWAY_ID: env.cloudflareAiGatewayId,
    OPENROUTER_API_KEY: env.openrouterApiKey,
    WEB_ORIGIN: env.webOrigin,
  };
}

export function agentRuntimeSource(env: Env): NodeJS.ProcessEnv {
  return {
    ...gatewaySource(env),
    GROGBOT_MODEL: env.grogbotModel,
    ANTHROPIC_API_KEY: env.anthropicApiKey,
    OPENAI_API_KEY: env.openaiApiKey,
  };
}
