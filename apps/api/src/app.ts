import { createSandboxProvider, createWakeupDriver } from "@grogbot/adapters";
import { createAuth } from "@grogbot/auth";
import { grogbotCookieDomain } from "@grogbot/contracts";
import { GuestHub, handleGuestRequest } from "@grogbot/core";
import { createDb } from "@grogbot/db";
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { RpcContext } from "./context.js";
import { type Env, oauthCredentials } from "./env.js";
import { healthPayload } from "./health.js";
import { createMailer } from "./mail.js";
import { mountRpc } from "./rpc.js";

export interface AppHandles extends Omit<RpcContext, "headers"> {
  app: Hono;
  close: () => Promise<void>;
}

export function createApp(env: Env): AppHandles {
  const { db, client } = createDb(env.databaseUrl);
  const oauth = oauthCredentials(env);
  const mail = createMailer(env);
  const auth = createAuth(db, {
    secret: env.authSecret,
    baseURL: env.authUrl,
    trustedOrigins: env.corsOrigins,
    cookieDomain: grogbotCookieDomain(env.webOrigin),
    google: oauth.google,
    github: oauth.github,
    sendMagicLink: mail.sendMagicLink,
  });
  const wakeup = createWakeupDriver(env.workerUrl);
  const sandbox = createSandboxProvider(env.sandboxProvider);
  const guests = new GuestHub();

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
    guests,
    env,
    close: async () => {
      guests.stop();
      await wakeup.stop();
      await client.end({ timeout: 5 });
    },
  };
  mountRpc(app, handles);

  if (!env.workerUrl) {
    app.all("/guest/*", async (c) => {
      const response = await handleGuestRequest(c.req.raw, {
        db,
        hub: guests,
        wakeup,
      });
      if (!response) return c.notFound();
      return c.newResponse(response.body, response);
    });
  }

  app.get("/health", (c) => c.json(healthPayload(env)));

  return handles;
}
