import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const PREFIX = "grogbot1";

function keyFromSecret(secret: string): Buffer {
  return createHash("sha256").update(secret, "utf8").digest();
}

export function encryptSecret(plain: string, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyFromSecret(secret), iv);
  const encrypted = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    PREFIX,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptSecret(payload: string, secret: string): string {
  const [prefix, ivPart, tagPart, dataPart] = payload.split(".");
  if (prefix !== PREFIX || !ivPart || !tagPart || !dataPart) {
    throw new Error("Invalid secret payload");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    keyFromSecret(secret),
    Buffer.from(ivPart, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataPart, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function secretHint(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length < 4) return "••••";
  return `••••${trimmed.slice(-4)}`;
}

/** Strip provider keys from error text before it hits the thread. */
export function redactSecrets(text: string): string {
  return text
    .replace(/sk-ant-[A-Za-z0-9_-]+/g, "sk-ant-…")
    .replace(/sk-or-v1-[A-Za-z0-9_-]+/g, "sk-or-…")
    .replace(/sk-or-[A-Za-z0-9_-]+/g, "sk-or-…")
    .replace(/\bsk-[A-Za-z0-9]{8,}/g, "sk-…");
}
