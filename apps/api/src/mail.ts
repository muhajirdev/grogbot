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
}

export function cloudflareMailConfigured(env: MailEnv): boolean {
  return Boolean(
    env.cloudflareAccountId?.trim() &&
      env.cloudflareEmailToken?.trim() &&
      env.emailFrom?.trim(),
  );
}

export function parseFrom(value: string): string | { address: string; name: string } {
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
        await sendCloudflareEmail({ accountId, token, from, to: email, url });
      },
    };
  }
  return {
    kind: "log",
    sendMagicLink: async ({ email, url }) => {
      if (env.production) {
        throw new Error(
          "Email sign-in needs CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_EMAIL_API_TOKEN, and EMAIL_FROM.",
        );
      }
      console.info(`[grogbot] Magic link for ${email}:\n${url}`);
    },
  };
}

async function sendCloudflareEmail(input: {
  accountId: string;
  token: string;
  from: string | { address: string; name: string };
  to: string;
  url: string;
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
        subject: "Sign in to Grogbot",
        text: `Sign in to Grogbot:\n${input.url}\n\nThis link expires in 15 minutes.`,
        html: `<p>Sign in to Grogbot.</p><p><a href="${input.url}">Open Grogbot</a></p><p>This link expires in 15 minutes.</p>`,
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
