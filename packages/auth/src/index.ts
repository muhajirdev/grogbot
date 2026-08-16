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
import { magicLink, organization as organizationPlugin } from "better-auth/plugins";

export interface OAuthCredentials {
  clientId: string;
  clientSecret: string;
}

export function createAuth(
  db: Database,
  opts: {
    secret: string;
    baseURL: string;
    trustedOrigins: string[];
    cookieDomain?: string;
    google?: OAuthCredentials;
    github?: OAuthCredentials;
    sendMagicLink: (input: {
      email: string;
      url: string;
      token: string;
    }) => Promise<void> | void;
  },
) {
  return betterAuth({
    secret: opts.secret,
    baseURL: opts.baseURL,
    trustedOrigins: opts.trustedOrigins,
    advanced: opts.cookieDomain
      ? {
          crossSubDomainCookies: {
            enabled: true,
            domain: opts.cookieDomain,
          },
          defaultCookieAttributes: {
            sameSite: "none",
            secure: true,
          },
        }
      : undefined,
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
    socialProviders: {
      ...(opts.google
        ? {
            google: {
              clientId: opts.google.clientId,
              clientSecret: opts.google.clientSecret,
            },
          }
        : {}),
      ...(opts.github
        ? {
            github: {
              clientId: opts.github.clientId,
              clientSecret: opts.github.clientSecret,
              scope: ["read:user", "user:email"],
            },
          }
        : {}),
    },
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ["google", "github"],
        requireLocalEmailVerified: false,
      },
    },
    plugins: [
      organizationPlugin(),
      magicLink({
        expiresIn: 15 * 60,
        sendMagicLink: opts.sendMagicLink,
      }),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
