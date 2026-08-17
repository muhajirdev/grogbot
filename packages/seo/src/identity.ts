export const GROGBOT_NAME = "Grogbot";
export const GROGBOT_VERSION = "0.0.1";
export const GROGBOT_LANGUAGE = "en-US";
export const GROGBOT_LICENSE = "Grogbot License (Apache 2.0 plus conditions)";
export const GROGBOT_UPDATED = "2026-08-16";
export const GROGBOT_GITHUB = "https://github.com/muhajirdev/grogbot";
export const GROGBOT_EMAIL = "hello@grogbot.com";
export const GROGBOT_APP = "https://app.grogbot.com";
export const GROGBOT_SUMMARY =
  "Like Grok Bot, for the team: named AI teammates with a real computer. If OpenClaw is for personal use, Grogbot is the office. Self-hostable, fair-code. Gmail, Slack, GitHub, and 1,000+ tools — plus a computer for the rest. Bring your own model keys. Self-host for your organization is free; hosted Grogbot for others is grogbot.com.";

export interface DiscoveryOrigins {
  web: string;
  api: string;
}

export function cloudOrigins(): DiscoveryOrigins {
  return { web: "https://grogbot.com", api: "https://api.grogbot.com" };
}

export function originsFromWeb(webOrigin: string): DiscoveryOrigins {
  try {
    const { hostname } = new URL(webOrigin);
    if (hostname === "grogbot.com" || hostname.endsWith(".grogbot.com")) {
      return cloudOrigins();
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
  "Marketing site: TanStack Start on Cloudflare Workers",
  "oRPC contract in @grogbot/contracts, client in @grogbot/rpc",
  "Postgres + Drizzle for team data",
  "Flue + Pi on Node; one wakeup queue per bot; Postgres for team data",
  "Better Auth (magic-link email, Google, GitHub)",
  "Sandboxes: Docker locally, E2B hosted, desktop on a trusted machine only",
] as const;
