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
  production: false,
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

  it("reports in-process wakeup when the worker is local", () => {
    expect(healthPayload(env).wakeup).toBe("in-process");
    expect(
      healthPayload({ ...env, workerUrl: "http://127.0.0.1:3101" }).wakeup,
    ).toBe("http");
  });

  it("lists Google and GitHub when those keys are set", () => {
    expect(
      healthPayload({
        ...env,
        googleClientId: "google-id",
        googleClientSecret: "google-secret",
        githubClientId: "github-id",
        githubClientSecret: "github-secret",
      }).oauth,
    ).toEqual(["google", "github"]);
  });

  it("requires a session to list bots", async () => {
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
    await expect(client.bots.list()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
