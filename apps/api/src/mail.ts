export type MailKind = "cloudflare" | "log";

export interface MailEnv {
  production?: boolean;
  emailFrom?: string;
  cloudflareAccountId?: string;
  cloudflareEmailToken?: string;
}

export interface Mailer {
  kind: MailKind;
  sendMagicLink: (input: { email: string; url: string }) => Promise<void>;
  sendInvitation: (input: {
    email: string;
    url: string;
    organizationName: string;
    inviterName: string;
  }) => Promise<void>;
}

export function cloudflareMailConfigured(env: MailEnv): boolean {
  return Boolean(
    env.cloudflareAccountId?.trim() &&
      env.cloudflareEmailToken?.trim() &&
      env.emailFrom?.trim(),
  );
}

export function parseFrom(
  value: string,
): string | { address: string; name: string } {
  const match = value.trim().match(/^(.*)<([^>]+)>$/);
  if (!match) return value.trim();
  const name = match[1]?.trim().replace(/^"|"$/g, "") ?? "";
  const address = match[2]?.trim() ?? "";
  if (!address) return value.trim();
  return name ? { address, name } : address;
}

export function createMailer(env: MailEnv): Mailer {
  if (cloudflareMailConfigured(env)) {
    const accountId = env.cloudflareAccountId?.trim() ?? "";
    const token = env.cloudflareEmailToken?.trim() ?? "";
    const from = parseFrom(env.emailFrom ?? "");
    return {
      kind: "cloudflare",
      sendMagicLink: async ({ email, url }) => {
        await sendCloudflareEmail({
          accountId,
          token,
          from,
          to: email,
          subject: "Sign in to Grogbot",
          text: `Sign in to Grogbot:\n${url}\n\nThis link expires in 15 minutes.`,
          html: `<p>Sign in to Grogbot.</p><p><a href="${url}">Open Grogbot</a></p><p>This link expires in 15 minutes.</p>`,
        });
      },
      sendInvitation: async ({ email, url, organizationName, inviterName }) => {
        await sendCloudflareEmail({
          accountId,
          token,
          from,
          to: email,
          subject: `Join ${organizationName} on Grogbot`,
          text: `${inviterName} invited you to ${organizationName} on Grogbot.\n${url}\n\nThis invite expires in 48 hours.`,
          html: `<p>${inviterName} invited you to ${organizationName} on Grogbot.</p><p><a href="${url}">Join the workspace</a></p><p>This invite expires in 48 hours.</p>`,
        });
      },
    };
  }
  return {
    kind: "log",
    sendMagicLink: async ({ email, url }) => {
      requireMailInProduction(env);
      console.info(`[grogbot] Magic link for ${email}:\n${url}`);
    },
    sendInvitation: async ({ email, url, organizationName, inviterName }) => {
      requireMailInProduction(env);
      console.info(
        `[grogbot] Invite ${email} to ${organizationName} (from ${inviterName}):\n${url}`,
      );
    },
  };
}

function requireMailInProduction(env: MailEnv) {
  if (env.production) {
    throw new Error(
      "Email sign-in needs CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_EMAIL_API_TOKEN, and EMAIL_FROM.",
    );
  }
}

async function sendCloudflareEmail(input: {
  accountId: string;
  token: string;
  from: string | { address: string; name: string };
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${input.accountId}/email/sending/send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: input.to,
        from: input.from,
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    },
  );
  const body = (await response.json()) as {
    success?: boolean;
    errors?: { message?: string }[];
  };
  if (!response.ok || body.success === false) {
    const detail = body.errors?.[0]?.message ?? response.statusText;
    throw new Error(`Cloudflare email failed: ${detail}`);
  }
}
