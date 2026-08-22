import { CLOUD_API_ORIGIN } from "@groxbot/contracts";

/** Absolute origin for oRPC. RPCLink cannot take a relative `/rpc` URL. */
export function apiOrigin(): string {
  const explicit = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  if (import.meta.env.PROD) return CLOUD_API_ORIGIN;
  if (typeof window !== "undefined") return window.location.origin;
  return "http://127.0.0.1:5173";
}
