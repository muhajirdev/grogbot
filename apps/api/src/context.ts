import type { SandboxProvider, WakeupDriver } from "@grogbot/adapter-kit";
import type { Auth } from "@grogbot/auth";
import type { GuestHub } from "@grogbot/core";
import type { Database } from "@grogbot/db";
import type { Env } from "./env.js";

export interface RpcContext {
  env: Env;
  db: Database;
  auth: Auth;
  wakeup: WakeupDriver;
  sandbox: SandboxProvider;
  guests: GuestHub;
  headers?: Headers;
}

export interface RpcContext {
  env: Env;
  db: Database;
  auth: Auth;
  wakeup: WakeupDriver;
  sandbox: SandboxProvider;
  headers?: Headers;
}
