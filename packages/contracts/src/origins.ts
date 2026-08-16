/** Canonical cloud hosts. Local dev still uses 127.0.0.1. */
export const CLOUD_LANDING_ORIGIN = "https://grogbot.com";
export const CLOUD_WEB_ORIGIN = "https://app.grogbot.com";
export const CLOUD_API_ORIGIN = "https://api.grogbot.com";

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
