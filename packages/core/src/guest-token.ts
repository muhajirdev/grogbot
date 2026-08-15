import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const PREFIX = "gbg";

export function hashGuestToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function parseGuestToken(token: string): { connectorId: string } | null {
  if (!token.startsWith(`${PREFIX}_`)) return null;
  const rest = token.slice(PREFIX.length + 1);
  const split = rest.indexOf("_");
  if (split < 1) return null;
  return { connectorId: rest.slice(0, split) };
}

export function mintGuestToken(connectorId: string): {
  token: string;
  tokenHash: string;
} {
  const secret = randomBytes(24).toString("base64url");
  const token = `${PREFIX}_${connectorId}_${secret}`;
  return { token, tokenHash: hashGuestToken(token) };
}

export function tokenMatches(token: string, tokenHash: string): boolean {
  const actual = Buffer.from(hashGuestToken(token), "hex");
  const expected = Buffer.from(tokenHash, "hex");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export function guestConnectCommand(opts: {
  connectUrl: string;
  token: string;
  kind: string;
}): string {
  return `pnpm guest -- --url ${opts.connectUrl} --token ${opts.token} --kind ${opts.kind}`;
}
