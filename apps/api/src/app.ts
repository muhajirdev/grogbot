import { Hono } from "hono";
import { cors } from "hono/cors";
import type { SandboxProvider, WakeupDriver } from "@grogbot/adapter-kit";
import { PostgresWakeupDriver, createSandboxProvider } from "@grogbot/adapters";
import { createAuth, type Auth } from "@grogbot/auth";
import { createDb, type Database } from "@grogbot/db";
import type { Env } from "./env.js";

export interface AppHandles {
  app: Hono;
  db: Database;
  auth: Auth;
  wakeup: WakeupDriver;
  sandbox: SandboxProvider;
}

export function createApp(env: Env): AppHandles {
  const { db } = createDb(env.databaseUrl);
  const auth = createAuth(db, {
    secret: env.authSecret,
    baseURL: env.authUrl,
    webOrigin: env.webOrigin,
  });
  const wakeup = new PostgresWakeupDriver(db);
  const sandbox = createSandboxProvider(env.sandboxProvider);

  const app = new Hono();
  app.use(
    "*",
    cors({
      origin: env.webOrigin,
      credentials: true,
    }),
  );

  app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

  app.get("/health", (c) =>
    c.json({
      ok: true as const,
      version: "0.0.1",
      runtime: env.agentRuntime,
      sandbox: env.sandboxProvider,
    }),
  );

  return { app, db, auth, wakeup, sandbox };
}
