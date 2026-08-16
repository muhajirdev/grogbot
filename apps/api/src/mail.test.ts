import { afterEach, describe, expect, it, vi } from "vitest";
import { cloudflareMailConfigured, createMailer, parseFrom } from "./mail.js";

describe("parseFrom", () => {
  it("keeps a bare address", () => {
    expect(parseFrom("noreply@grogbot.com")).toBe("noreply@grogbot.com");
  });

  it("splits display name", () => {
    expect(parseFrom("Grogbot <noreply@grogbot.com>")).toEqual({
      address: "noreply@grogbot.com",
      name: "Grogbot",
    });
  });
});

describe("createMailer", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("is log-only without Cloudflare keys", () => {
    expect(cloudflareMailConfigured({})).toBe(false);
    expect(createMailer({}).kind).toBe("log");
  });

  it("refuses to log magic links in production", async () => {
    const mailer = createMailer({ production: true });
    await expect(
      mailer.sendMagicLink({ email: "a@b.com", url: "https://x" }),
    ).rejects.toThrow(/CLOUDFLARE_ACCOUNT_ID/);
  });

  it("posts to Cloudflare Email Sending", async () => {
    const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(
      async () =>
        new Response(JSON.stringify({ success: true, errors: [], result: {} }), {
          status: 200,
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const mailer = createMailer({
      cloudflareAccountId: "acct",
      cloudflareEmailToken: "token",
      emailFrom: "Grogbot <noreply@grogbot.com>",
    });
    expect(mailer.kind).toBe("cloudflare");
    await mailer.sendMagicLink({
      email: "you@example.com",
      url: "https://app.grogbot.com/api/auth/magic-link/verify?token=abc",
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    const call = fetchMock.mock.calls[0];
    expect(call?.[0]).toContain("/accounts/acct/email/sending/send");
    expect(call?.[1]).toMatchObject({
      method: "POST",
      headers: {
        Authorization: "Bearer token",
        "Content-Type": "application/json",
      },
    });
    const payload = JSON.parse(String(call?.[1]?.body ?? "")) as {
      to: string;
      from: { address: string; name: string };
      subject: string;
    };
    expect(payload.to).toBe("you@example.com");
    expect(payload.from).toEqual({
      address: "noreply@grogbot.com",
      name: "Grogbot",
    });
    expect(payload.subject).toBe("Sign in to Grogbot");
  });
});
