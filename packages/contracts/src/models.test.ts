import { describe, expect, it } from "vitest";
import {
  catalogForRuntime,
  missingProviderMessage,
  modelIsRunnable,
  providerForModel,
  resolveStoredModelId,
  validateCloudflareAccountId,
  validateProviderSecret,
} from "./models.js";

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

  it("hides Cloudflare models on the Flue runtime", () => {
    expect(
      catalogForRuntime("flue").some((item) => item.provider === "cloudflare"),
    ).toBe(false);
    expect(
      catalogForRuntime("gateway").some(
        (item) => item.provider === "cloudflare",
      ),
    ).toBe(true);
  });

  it("requires a matching provider key", () => {
    expect(modelIsRunnable("anthropic/claude-sonnet-4-6", ["openrouter"])).toBe(
      false,
    );
    expect(
      modelIsRunnable("openrouter/deepseek/deepseek-v4-flash-0731", [
        "openrouter",
      ]),
    ).toBe(true);
    expect(modelIsRunnable("vendor/custom", ["openrouter"])).toBe(true);
  });

  it("validates provider secrets", () => {
    expect(validateProviderSecret("anthropic", "sk-ant-1234567890")).toBe(
      undefined,
    );
    expect(validateProviderSecret("anthropic", "sk-1234567890ab")).toMatch(
      /sk-ant/,
    );
    expect(validateProviderSecret("openrouter", "••••abcd")).toMatch(/hint/);
    expect(validateCloudflareAccountId("not-an-id")).toMatch(/32 hex/);
    expect(
      validateCloudflareAccountId("0123456789abcdef0123456789abcdef"),
    ).toBe(undefined);
  });

  it("resolves custom model ids", () => {
    expect(
      resolveStoredModelId({
        defaultModel: "custom",
        customModel: "openrouter/foo",
      }),
    ).toBe("openrouter/foo");
    expect(missingProviderMessage("anthropic/claude-sonnet-4-6")).toMatch(
      /Anthropic/,
    );
  });
});
