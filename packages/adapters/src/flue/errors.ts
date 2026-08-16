import { AgentRunError } from "@flue/runtime";

function textFrom(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  if (value instanceof Error) {
    const trimmed = value.message.trim();
    return trimmed || undefined;
  }
  return undefined;
}

/** Prefer nested Flue causes (often a string) over the generic wrapper. */
function deepestMessage(error: unknown): string {
  const seen = new Set<unknown>();
  let current: unknown = error;
  let best = "Flue run failed";
  for (let i = 0; i < 6 && current !== undefined && current !== null; i += 1) {
    if (seen.has(current)) break;
    seen.add(current);
    const text = textFrom(current);
    if (text) best = text;
    if (current instanceof Error && "cause" in current) {
      current = current.cause;
      continue;
    }
    break;
  }
  return best;
}

/**
 * Readable copy for Flue/Pi failures. Flue's AgentRunError message is only
 * "Agent run failed (submission …)"; the real reason lives on `cause`
 * (often a string, not an Error).
 */
export function flueErrorText(error: unknown): string {
  const raw =
    error instanceof AgentRunError || error instanceof Error
      ? deepestMessage(error)
      : textFrom(error) || "Flue run failed";
  return humanizeFlueMessage(raw);
}

export function humanizeFlueMessage(raw: string): string {
  const text = raw.trim().replace(/^(\[flue\]\s*)+/i, "");
  if (/^Agent run was aborted \(submission [^)]+\)\.?$/i.test(text)) {
    return "Stopped.";
  }
  if (/^Agent run failed \(submission [^)]+\)\.?$/i.test(text)) {
    return "The model run failed. Pick another model in Settings → Models.";
  }
  const unknown = text.match(
    /^Unknown model ID "([^"]+)" for provider "([^"]+)"/i,
  );
  if (unknown) {
    return `Model “${unknown[1]}” isn’t available for ${unknown[2]}. Pick another model in Settings → Models.`;
  }
  const missing = text.match(/Provider is not configured:\s*(\S+)/i);
  if (missing) {
    return `${missing[1]} isn’t configured. Add a key in Settings → Models.`;
  }
  return text;
}
