import { describe, expect, it } from "vitest";
import {
  ComposioError,
  composioConfigured,
  composioUserId,
  createComposioGateway,
  createPluginTools,
  formatComposioResult,
  HttpComposioGateway,
  requireComposioKey,
  SdkComposioGateway,
} from "./composio.js";

describe("Composio adapter", () => {
  it("scopes users to the workspace", () => {
    expect(composioUserId("ws-9")).toBe("grogbot:ws:ws-9");
  });

  it("treats a missing key as unconfigured", () => {
    expect(composioConfigured({})).toBe(false);
    expect(composioConfigured({ COMPOSIO_API_KEY: "  " })).toBe(false);
    expect(composioConfigured({ COMPOSIO_API_KEY: "ak_live" })).toBe(true);
    expect(() => requireComposioKey({})).toThrow(ComposioError);
    expect(() => requireComposioKey({})).toThrow(/COMPOSIO_API_KEY/);
  });

  it("does not build tools without a key or toolkits", () => {
    expect(
      createPluginTools({
        workspaceId: "ws-1",
        toolkits: ["gmail"],
        env: {},
      }),
    ).toBeUndefined();
    expect(
      createPluginTools({
        workspaceId: "ws-1",
        toolkits: [],
        env: { COMPOSIO_API_KEY: "ak" },
      }),
    ).toBeUndefined();
  });

  it("starts an OAuth link through authorize", async () => {
    const gateway = new SdkComposioGateway({
      toolkits: {
        authorize: async () => ({
          redirectUrl: "https://connect.composio.dev/link",
          id: "ca_1",
        }),
      },
    });
    await expect(
      gateway.link({
        userId: "grogbot:ws:1",
        toolkit: "gmail",
        callbackUrl: "http://127.0.0.1:3100/api/plugins/callback?id=1",
      }),
    ).resolves.toEqual({
      redirectUrl: "https://connect.composio.dev/link",
      connectedAccountId: "ca_1",
    });
  });

  it("formats tool results for the model", () => {
    expect(formatComposioResult({ ok: true })).toBe(
      JSON.stringify({ ok: true }, null, 2),
    );
  });

  it("lists active accounts from the SDK shape", async () => {
    const gateway = createComposioGateway(
      { COMPOSIO_API_KEY: "ak" },
      {
        connectedAccounts: {
          list: async () => ({
            items: [
              {
                id: "ca_gmail",
                status: "ACTIVE",
                toolkit: { slug: "gmail" },
              },
            ],
          }),
        },
      },
    );
    await expect(gateway.listAccounts("grogbot:ws:1")).resolves.toEqual([
      { id: "ca_gmail", toolkit: "gmail", status: "ACTIVE" },
    ]);
  });

  it("creates a connect link over HTTP", async () => {
    const calls: string[] = [];
    const gateway = new HttpComposioGateway("ak", async (input, init) => {
      const url = String(input);
      calls.push(`${init?.method ?? "GET"} ${url}`);
      if (url.includes("/auth_configs") && init?.method === "POST") {
        return jsonResponse({ auth_config: { id: "ac_1" } }, 201);
      }
      if (url.includes("/auth_configs")) {
        return jsonResponse({ items: [] });
      }
      if (url.includes("/connected_accounts/link")) {
        return jsonResponse({
          redirect_url: "https://connect.composio.dev/x",
          id: "ca_new",
        });
      }
      return jsonResponse({ error: { message: url } }, 404);
    });
    await expect(
      gateway.link({
        userId: "grogbot:ws:1",
        toolkit: "gmail",
        callbackUrl: "http://127.0.0.1:3100/api/plugins/callback?id=1",
      }),
    ).resolves.toEqual({
      redirectUrl: "https://connect.composio.dev/x",
      connectedAccountId: "ca_new",
    });
    expect(calls.some((item) => item.includes("connected_accounts/link"))).toBe(
      true,
    );
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
