import type { Database } from "@grogbot/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";

export function createAuth(
  db: Database,
  opts: {
    secret: string;
    baseURL: string;
    trustedOrigins: string[];
  },
) {
  return betterAuth({
    secret: opts.secret,
    baseURL: opts.baseURL,
    trustedOrigins: opts.trustedOrigins,
    database: drizzleAdapter(db, { provider: "pg" }),
    emailAndPassword: { enabled: true, requireEmailVerification: false },
    plugins: [organization()],
  });
}

export type Auth = ReturnType<typeof createAuth>;
