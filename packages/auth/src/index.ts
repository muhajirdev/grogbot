import type { Database } from "@grogbot/db";
import {
  account,
  invitation,
  member,
  organization,
  session,
  user,
  verification,
} from "@grogbot/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization as organizationPlugin } from "better-auth/plugins";

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
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user,
        session,
        account,
        verification,
        organization,
        member,
        invitation,
      },
    }),
    emailAndPassword: { enabled: true, requireEmailVerification: false },
    plugins: [organizationPlugin()],
  });
}

export type Auth = ReturnType<typeof createAuth>;
