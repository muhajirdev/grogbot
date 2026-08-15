import { CLOUD_API_ORIGIN } from "@grogbot/contracts";

/** Empty string = same-origin `/rpc` and `/api` (Vite proxy). */
export function apiOrigin(): string {
  const explicit = import.meta.env.VITE_API_URL;
  if (explicit !== undefined) return explicit.replace(/\/$/, "");
  return import.meta.env.PROD ? CLOUD_API_ORIGIN : "";
}
