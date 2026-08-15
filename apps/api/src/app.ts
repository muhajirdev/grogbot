import { createSandboxProvider, createWakeupDriver } from "@grogbot/adapters";
import { createAuth } from "@grogbot/auth";
import { createDb } from "@grogbot/db";
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { RpcContext } from "./context.js";
import { type Env, oauthCredentials } from "./env.js";
import { healthPayload } from "./health.js";
import { mountRpc } from "./rpc.js";

export interface AppHandles extends Omit<RpcContext, "headers"> {
  app: Hono;
  close: () => Promise<void>;
}

export function createApp(env: Env): AppHandles {
  const { db, client } = createDb(env.databaseUrl);
  const oauth = oauthCredentials(env);
  const auth = createAuth(db, {
    secret: env.authSecret,
    baseURL: env.authUrl,
    trustedOrigins: env.corsOrigins,
    google: oauth.google,
    github: oauth.github,
  });
  const wakeup = createWakeupDriver(env.workerUrl);
  const sandbox = createSandboxProvider(env.sandboxProvider);

  const app = new Hono();
  app.use(
    "*",
    cors({
      origin: env.corsOrigins,
      credentials: true,
    }),
  );

  app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

  const handles: AppHandles = {
    app,
    db,
    auth,
    wakeup,
    sandbox,
    env,
    close: async () => {
      await wakeup.stop();
      await client.end({ timeout: 5 });
    },
  };
  mountRpc(app, handles);

  app.get("/health", (c) => c.json(healthPayload(env)));

  return handles;
}
