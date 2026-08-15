import { createGrogbotClient } from "@grogbot/rpc";
import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import type { RpcContext } from "./context.js";
import { healthPayload } from "./health.js";
import { mountRpc } from "./rpc.js";

const env = {
  databaseUrl: "postgres://grogbot:grogbot@127.0.0.1:5433/grogbot",
  authSecret: "development-only-change-me-please-32ch",
  authUrl: "http://127.0.0.1:5173",
  webOrigin: "http://127.0.0.1:5173",
  corsOrigins: ["http://127.0.0.1:5173"],
  sandboxProvider: "fake",
  agentRuntime: "scripted",
} as const;

describe("oRPC", () => {
  it("serves health over the contract", async () => {
    const app = new Hono();
    mountRpc(app, { env } as unknown as RpcContext);
    const client = createGrogbotClient({
      baseUrl: "http://grogbot.test",
      fetch: async (input, init) => {
        const request =
          input instanceof Request ? input : new Request(String(input), init);
        return app.request(request);
      },
    });
    await expect(client.health()).resolves.toEqual(healthPayload(env));
  });

  it("lists no bots yet", async () => {
    const app = new Hono();
    mountRpc(app, { env } as unknown as RpcContext);
    const client = createGrogbotClient({
      baseUrl: "http://grogbot.test",
      fetch: async (input, init) => {
        const request =
          input instanceof Request ? input : new Request(String(input), init);
        return app.request(request);
      },
    });
    await expect(client.bots.list()).resolves.toEqual([]);
  });
});
