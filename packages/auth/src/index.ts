import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import type { Database } from "@grogbot/db";

export function createAuth(
  db: Database,
  opts: {
    secret: string;
    baseURL: string;
    webOrigin: string;
  },
) {
  return betterAuth({
    secret: opts.secret,
    baseURL: opts.baseURL,
    trustedOrigins: [opts.webOrigin, "http://127.0.0.1:5173", "http://localhost:5173"],
    database: drizzleAdapter(db, { provider: "pg" }),
    emailAndPassword: { enabled: true },
    plugins: [organization()],
  });
}

export type Auth = ReturnType<typeof createAuth>;
