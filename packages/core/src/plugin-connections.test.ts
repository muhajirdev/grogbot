import { describe, expect, it } from "vitest";
import {
  composioUserId,
  PluginError,
  parseToolkit,
  toPluginDto,
} from "./plugin-connections.js";

describe("plugin connections", () => {
  it("scopes Composio users to the workspace", () => {
    expect(composioUserId("ws-1")).toBe("grogbot:ws:ws-1");
  });

  it("accepts marketplace slugs", () => {
    expect(parseToolkit("Gmail")).toBe("gmail");
    expect(parseToolkit("google-calendar")).toBe("google-calendar");
  });

  it("rejects empty or noisy slugs", () => {
    expect(() => parseToolkit("")).toThrow(PluginError);
    expect(() => parseToolkit("GMAIL_SEND")).toThrow(PluginError);
  });

  it("maps a row onto the contract", () => {
    const now = new Date("2026-08-17T00:00:00.000Z");
    expect(
      toPluginDto({
        id: "plug-1",
        workspaceId: "ws-1",
        userId: "user-1",
        toolkit: "gmail",
        status: "connected",
        connectedAccountId: "ca_1",
        lastError: null,
        createdAt: now,
        updatedAt: now,
      }),
    ).toEqual({
      id: "plug-1",
      toolkit: "gmail",
      status: "connected",
      connectedAccountId: "ca_1",
      lastError: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  });

  it("treats unknown DB status as error", () => {
    const now = new Date("2026-08-17T00:00:00.000Z");
    expect(
      toPluginDto({
        id: "plug-2",
        workspaceId: "ws-1",
        userId: "user-1",
        toolkit: "gmail",
        status: "nope",
        connectedAccountId: null,
        lastError: "expired",
        createdAt: now,
        updatedAt: now,
      }).status,
    ).toBe("error");
  });
});
