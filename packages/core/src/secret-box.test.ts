import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret, secretHint } from "./secret-box.js";

describe("secret-box", () => {
  const secret = "test-encryption-secret-32bytes!!";

  it("round-trips plaintext", () => {
    const packed = encryptSecret("sk-or-v1-hello-world", secret);
    expect(decryptSecret(packed, secret)).toBe("sk-or-v1-hello-world");
  });

  it("hints the last four characters", () => {
    expect(secretHint("sk-or-v1-hello-world")).toBe("••••orld");
  });
});
