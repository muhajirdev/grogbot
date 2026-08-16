const GENERIC = new Set([
  "Bad Request",
  "Precondition Failed",
  "Unauthorized",
  "Internal Server Error",
]);

/** Human copy from oRPC or fetch failures. Never dump a raw object. */
export function userFacingError(caught: unknown, fallback: string): string {
  if (caught instanceof Error && caught.message.trim()) {
    const text = caught.message.trim();
    return GENERIC.has(text) ? fallback : text;
  }
  if (caught && typeof caught === "object" && "message" in caught) {
    const text = String((caught as { message?: unknown }).message ?? "").trim();
    if (text && !GENERIC.has(text)) return text;
  }
  return fallback;
}

export function isModelSetupError(message: string): boolean {
  return /settings → models|model key|needs a .+ key/i.test(message);
}
