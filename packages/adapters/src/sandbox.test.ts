import { describe, expect, it } from "vitest";
import { createSandboxProvider, FakeSandboxProvider } from "./sandbox.js";

describe("createSandboxProvider", () => {
  it("returns the fake provider", () => {
    expect(createSandboxProvider("fake")).toBeInstanceOf(FakeSandboxProvider);
  });

  it("knows docker, cloudflare, and desktop but does not implement them yet", () => {
    for (const kind of ["docker", "cloudflare", "desktop"] as const) {
      expect(() => createSandboxProvider(kind)).toThrow(/not implemented yet/);
    }
  });

  it("refuses e2b as a later provider, not v1", () => {
    expect(() => createSandboxProvider("e2b")).toThrow(/later, not v1/);
  });

  it("rejects unknown kinds", () => {
    expect(() => createSandboxProvider("modal")).toThrow(
      /Unknown SANDBOX_PROVIDER/,
    );
  });
});
