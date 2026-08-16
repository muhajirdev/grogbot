import { describe, expect, it } from "vitest";
import { userHasModelCredentials } from "./models.js";

describe("userHasModelCredentials", () => {
  it("accepts stored rows", () => {
    expect(userHasModelCredentials(1, {})).toBe(true);
  });

  it("accepts env keys", () => {
    expect(userHasModelCredentials(0, { OPENAI_API_KEY: "sk" })).toBe(true);
    expect(
      userHasModelCredentials(0, {
        CLOUDFLARE_ACCOUNT_ID: "acct",
        CLOUDFLARE_API_TOKEN: "tok",
      }),
    ).toBe(true);
    expect(userHasModelCredentials(0, {})).toBe(false);
  });
});
