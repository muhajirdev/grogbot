import { describe, expect, it } from "vitest";
import { encryptionSecret, userHasModelCredentials } from "./models.js";
import { redactSecrets } from "./secret-box.js";

describe("userHasModelCredentials", () => {
  it("accepts stored rows", () => {
    expect(userHasModelCredentials(1)).toBe(true);
  });

  it("rejects an empty workspace", () => {
    expect(userHasModelCredentials(0)).toBe(false);
  });
});

describe("encryptionSecret", () => {
  it("refuses the development fallback in production", () => {
    expect(() => encryptionSecret({}, true)).toThrow(/required in production/);
    expect(() =>
      encryptionSecret({ ENCRYPTION_KEY: "too-short" }, true),
    ).toThrow(/32 characters/);
  });

  it("uses ENCRYPTION_KEY when long enough", () => {
    const key = "k".repeat(32);
    expect(encryptionSecret({ ENCRYPTION_KEY: key }, true)).toBe(key);
  });
});

describe("redactSecrets", () => {
  it("strips provider keys from error text", () => {
    expect(
      redactSecrets("upstream 401 sk-ant-abcdefghijklmnopqrstuvwxyz"),
    ).toBe("upstream 401 sk-ant-…");
  });
});
