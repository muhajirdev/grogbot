export const GROGBOT_NAME = "Grogbot";
export const GROGBOT_VERSION = "0.0.1";
export const GROGBOT_LANGUAGE = "en-US";
export const GROGBOT_LICENSE = "MIT";
export const GROGBOT_UPDATED = "2026-08-16";
export const GROGBOT_GITHUB = "https://github.com/muhajirdev/grogbot";
export const GROGBOT_SUMMARY =
  "Open-source Grok Bot: named AI teammates with a real computer. Message them like people. Composio for Gmail, Slack, and GitHub. Shared workspace context and skills. Bring your own model keys.";

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
  "Grok Bot (open-source)",
  "grogbot.com",
] as const;

export const GROGBOT_SERVICES = [
  "Hosted AI teammates (bots) you message like coworkers",
  "A shared workspace Desk computer, or an isolated computer per bot",
  "oRPC product API for web, desktop, and mobile",
  "Optional Composio plugins for Gmail, Slack, and GitHub",
  "Bring-your-own model keys (Pi catalog)",
  "Opt-in guest runtimes (Hermes or OpenClaw) that dial out to Grogbot",
] as const;

export const GROGBOT_NOT_SERVICES = [
  "A visual workflow builder or agent graph editor",
  "A Discord-style community product",
  "Hosted model inference (bring your own keys)",
  "Cursor Ultra / SuperGrok paywall gating",
] as const;

export const GROGBOT_STACK = [
  "TypeScript, pnpm, Hono, React, Vite, TanStack Router",
  "oRPC contract in @grogbot/contracts, client in @grogbot/rpc",
  "Postgres + Drizzle for team data",
  "One Rivet actor per bot for wakeup, serial runs, and cron",
  "Better Auth (email/password, Google, GitHub)",
  "Sandboxes: Docker locally, E2B hosted, desktop on a trusted machine only",
] as const;
