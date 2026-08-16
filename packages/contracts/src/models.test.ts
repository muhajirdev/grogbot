import { describe, expect, it } from "vitest";
import { providerForModel } from "./models.js";

describe("model catalog", () => {
  it("maps ids to providers", () => {
    expect(providerForModel("anthropic/claude-sonnet-4-6")).toBe("anthropic");
    expect(providerForModel("openrouter/deepseek/deepseek-v4-flash-0731")).toBe(
      "openrouter",
    );
    expect(providerForModel("@cf/deepseek-ai/deepseek-v4-flash-0731")).toBe(
      "cloudflare",
    );
  });
});
