/** Canonical cloud hosts. Local dev still uses 127.0.0.1. */
export const CLOUD_LANDING_ORIGIN = "https://grogbot.com";
export const CLOUD_WEB_ORIGIN = "https://app.grogbot.com";
export const CLOUD_API_ORIGIN = "https://api.grogbot.com";

/** Staging on workers.dev until grogbot.com is attached. */
export const STAGING_LANDING_ORIGIN =
  "https://grogbot-landing.qalam.workers.dev";
export const STAGING_WEB_ORIGIN = "https://grogbot-web.qalam.workers.dev";
export const STAGING_API_ORIGIN = "https://grogbot-api.qalam.workers.dev";

export function grogbotCookieDomain(origin: string): string | undefined {
  try {
    const { hostname } = new URL(origin);
    if (hostname === "grogbot.com" || hostname.endsWith(".grogbot.com")) {
      return ".grogbot.com";
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export function isGrogbotStagingOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return (
      hostname === new URL(STAGING_LANDING_ORIGIN).hostname ||
      hostname === new URL(STAGING_WEB_ORIGIN).hostname ||
      hostname === new URL(STAGING_API_ORIGIN).hostname
    );
  } catch {
    return false;
  }
}
