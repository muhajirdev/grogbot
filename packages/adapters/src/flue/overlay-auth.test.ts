import { openrouterProvider } from "@earendil-works/pi-ai/providers/openrouter";
import { describe, expect, it } from "vitest";
import { overlayAuthContext, withOverlayAuth } from "./overlay-auth.js";

const emptyCtx = {
  env: async () => undefined,
  fileExists: async () => false,
};

describe("withOverlayAuth", () => {
  it("resolves OpenRouter from the workspace overlay", async () => {
    const overlay: NodeJS.ProcessEnv = {
      OPENROUTER_API_KEY: "sk-or-v1-from-settings",
    };
    const provider = withOverlayAuth(openrouterProvider(), overlay);
    const resolved = await provider.auth.apiKey?.resolve({ ctx: emptyCtx });
    expect(resolved?.auth.apiKey).toBe("sk-or-v1-from-settings");
    expect(resolved?.source).toBe("OPENROUTER_API_KEY");
  });

  it("stays unconfigured without an overlay key", async () => {
    const provider = withOverlayAuth(openrouterProvider(), {});
    expect(await provider.auth.apiKey?.resolve({ ctx: emptyCtx })).toBe(
      undefined,
    );
  });
});

describe("overlayAuthContext", () => {
  it("prefers overlay aliases over the base context", async () => {
    const ctx = overlayAuthContext(
      {
        env: async (name) =>
          name === "CLOUDFLARE_API_KEY" ? "from-process" : undefined,
        fileExists: async () => false,
      },
      { CLOUDFLARE_API_TOKEN: "from-overlay" },
    );
    expect(await ctx.env("CLOUDFLARE_API_KEY")).toBe("from-overlay");
  });
});
