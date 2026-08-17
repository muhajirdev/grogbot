import {
  CLOUD_API_ORIGIN,
  CLOUD_LANDING_ORIGIN,
  CLOUD_WEB_ORIGIN,
  isGrogbotStagingOrigin,
  STAGING_API_ORIGIN,
  STAGING_LANDING_ORIGIN,
  STAGING_WEB_ORIGIN,
} from "@grogbot/contracts";

export const GROGBOT_NAME = "Grogbot";
export const GROGBOT_VERSION = "0.0.1";
export const GROGBOT_LANGUAGE = "en-US";
export const GROGBOT_LICENSE = "Grogbot License (Apache 2.0 plus conditions)";
export const GROGBOT_UPDATED = "2026-08-17";
export const GROGBOT_GITHUB = "https://github.com/muhajirdev/grogbot";
export const GROGBOT_EMAIL = "hello@grogbot.com";
export const GROGBOT_APP = CLOUD_WEB_ORIGIN;
export const GROGBOT_SUMMARY =
  "Like Grok Bot, for the team: named AI teammates with a real computer. If OpenClaw is for personal use, Grogbot is the office. Self-hostable, fair-code. Gmail, Slack, GitHub, and 1,000+ tools — plus a computer for the rest. Bring your own model keys. Self-host for your organization is free; hosted Grogbot for others is grogbot.com.";

export interface DiscoveryOrigins {
  web: string;
  api: string;
  office?: string;
}

export function officeOrigin(origins: DiscoveryOrigins): string {
  return origins.office ?? GROGBOT_APP;
}

export function cloudOrigins(): DiscoveryOrigins {
  return {
    web: CLOUD_LANDING_ORIGIN,
    api: CLOUD_API_ORIGIN,
    office: GROGBOT_APP,
  };
}

export function stagingOrigins(): DiscoveryOrigins {
  return {
    web: STAGING_LANDING_ORIGIN,
    api: STAGING_API_ORIGIN,
    office: STAGING_WEB_ORIGIN,
  };
}

export function originsFromWeb(webOrigin: string): DiscoveryOrigins {
  try {
    const { hostname } = new URL(webOrigin);
    if (hostname === "grogbot.com" || hostname.endsWith(".grogbot.com")) {
      return cloudOrigins();
    }
    if (isGrogbotStagingOrigin(webOrigin)) {
      return stagingOrigins();
    }
  } catch {
    // fall through to local origins
  }
  return { web: webOrigin.replace(/\/$/, ""), api: "http://127.0.0.1:3100" };
}

export const GROGBOT_ALTERNATE_NAMES = [
  "Grog Bot",
  "Grok Bot (self-hostable)",
  "grogbot.com",
] as const;

export const GROGBOT_SERVICES = [
  "Named AI teammates (bots) you message like coworkers",
  "A shared workspace Desk computer, or an isolated computer per bot",
  "Shared office knowledge and skills — the organization improves",
  "oRPC product API for web, desktop, and mobile",
  "Plugins for Gmail, Slack, GitHub, and 1,000+ tools",
  "Bring-your-own model keys — Claude, GPT, Grok, Kimi, DeepSeek; not locked to one vendor",
  "Who is putting Bots to work is on the board — so the rest of the team starts",
  "Opt-in guest runtimes (Hermes or OpenClaw) that dial out to Grogbot",
] as const;

export const GROGBOT_NOT_SERVICES = [
  "A visual workflow builder or agent graph editor",
  "A Discord-style community product",
  "Hosted model inference you do not bring keys for",
  "A competing multi-tenant Grogbot cloud (that is grogbot.com)",
] as const;

export const GROGBOT_STACK = [
  "TypeScript, pnpm, Hono, React, Vite, TanStack Router",
  "Marketing, office SPA, and API: Cloudflare Workers",
  "oRPC contract in @grogbot/contracts, client in @grogbot/rpc",
  "Postgres + Drizzle for team data (Neon on hosted Cloudflare)",
  "Flue + Pi on Node for local/self-host; hosted API uses gateway/scripted until Flue’s Cloudflare target",
  "One wakeup queue per bot — Node worker locally, Durable Object hosted",
  "Better Auth (magic-link email, Google, GitHub)",
  "Sandboxes: Flue useSandbox — Cloudflare Computer light, Docker / Cloudflare Sandbox / E2B heavy, desktop on a trusted machine only",
] as const;
