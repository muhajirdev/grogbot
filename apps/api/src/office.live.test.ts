import { ScriptedAgentRuntime } from "@grogbot/adapters";
import { createWakeHandlers } from "@grogbot/core";
import { createDb } from "@grogbot/db";
import { createGrogbotClient } from "@grogbot/rpc";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type AppHandles, createApp } from "./app.js";
import type { Env } from "./env.js";
import { loadRootEnv } from "./load-root-env.js";

loadRootEnv();

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgres://grogbot:grogbot@127.0.0.1:5433/grogbot";

let dbUp = false;
try {
  const { client } = createDb(databaseUrl);
  await client`select 1`;
  await client.end({ timeout: 2 });
  dbUp = true;
} catch {
  dbUp = false;
}

const origin = "http://127.0.0.1:5173";

function cookieHeader(response: Response, previous = ""): string {
  const jar = new Map<string, string>();
  for (const part of previous.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name && rest.length) jar.set(name, rest.join("="));
  }
  for (const line of response.headers.getSetCookie()) {
    const pair = line.split(";", 1)[0];
    if (!pair) continue;
    const [name, ...rest] = pair.split("=");
    if (name) jar.set(name.trim(), rest.join("="));
  }
  return [...jar.entries()]
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

describe.skipIf(!dbUp)("office loop", () => {
  const env: Env = {
    databaseUrl,
    authSecret: "development-only-change-me-please-32ch",
    authUrl: origin,
    webOrigin: origin,
    corsOrigins: [origin],
    sandboxProvider: "fake",
    agentRuntime: "scripted",
  };

  let handles: AppHandles;
  let cookie = "";

  beforeAll(async () => {
    handles = createApp(env);
    await handles.wakeup.start(
      createWakeHandlers({
        db: handles.db,
        runtime: new ScriptedAgentRuntime(),
        wakeup: handles.wakeup,
        guests: handles.guests,
      }),
    );
  });

  afterAll(async () => {
    await handles.close();
  });

  function client() {
    return createGrogbotClient({
      baseUrl: origin,
      headers: () => ({ cookie, origin }),
      fetch: async (input, init) => {
        const request =
          input instanceof Request ? input : new Request(String(input), init);
        const response = await handles.app.request(request);
        cookie = cookieHeader(response, cookie);
        return response;
      },
    });
  }

  it("signs up, hires a bot, and echoes a message", async () => {
    const email = `loop-${Date.now()}@example.com`;
    const signUp = await handles.app.request(
      new Request(`${origin}/api/auth/sign-up/email`, {
        method: "POST",
        headers: {
          origin,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: "Tester",
          email,
          password: "password1",
        }),
      }),
    );
    cookie = cookieHeader(signUp, cookie);
    expect(signUp.status, await signUp.text()).toBe(200);
    expect(cookie).toContain("session");

    const rpc = client();
    const me = await rpc.me();
    expect(me.email).toBe(email);
    expect(me.workspaceId.length).toBeGreaterThan(0);

    const bot = await rpc.bots.create({
      name: "Piper",
      title: "Product performance",
      description: "Echo for tests.",
      instructions: "Echo for tests.",
    });
    expect(bot.name).toBe("Piper");

    const nameless = await rpc.bots.create({ name: "Scout" });
    expect(nameless.title).toBe("");

    const listed = await rpc.bots.list();
    expect(listed.some((item) => item.id === bot.id)).toBe(true);

    const sent = await rpc.threads.send({
      botId: bot.id,
      text: "summarize the handoff",
    });
    expect(sent.seq).toBeGreaterThan(0);

    const texts: string[] = [];
    const iterator = (await rpc.threads.subscribe({
      botId: bot.id,
      cursor: -1,
    })) as AsyncGenerator<{
      type: string;
      payload: Record<string, unknown>;
    }>;
    const stop = setTimeout(() => void iterator.return(undefined), 8_000);
    try {
      for await (const event of iterator) {
        if (event.type !== "message.created") continue;
        const blocks = event.payload.blocks;
        if (!Array.isArray(blocks)) continue;
        for (const block of blocks) {
          if (
            block &&
            typeof block === "object" &&
            "text" in block &&
            typeof block.text === "string"
          ) {
            texts.push(block.text);
          }
        }
        if (texts.some((text) => text.startsWith("Echo:"))) break;
      }
    } finally {
      clearTimeout(stop);
      await iterator.return(undefined);
    }

    expect(texts).toContain("summarize the handoff");
    expect(texts.some((text) => text.startsWith("Echo:"))).toBe(true);

    const taken = await rpc.computer.takeover({ botId: bot.id });
    expect(taken.controlHolder).toBe("user");
    expect(taken.name).toBe("Default computer");
    expect(taken.isDefault).toBe(true);
    const released = await rpc.computer.release({ botId: bot.id });
    expect(released.controlHolder).toBe("bot");
  }, 15_000);

  it("lets two bots share the default computer and isolates a new computer", async () => {
    const email = `desk-${Date.now()}@example.com`;
    const signUp = await handles.app.request(
      new Request(`${origin}/api/auth/sign-up/email`, {
        method: "POST",
        headers: {
          origin,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: "Desk Tester",
          email,
          password: "password1",
        }),
      }),
    );
    cookie = cookieHeader(signUp, cookie);
    expect(signUp.status, await signUp.text()).toBe(200);

    const rpc = client();
    const piper = await rpc.bots.create({
      name: "Piper",
      title: "Product",
      description: "Share the desk.",
      instructions: "Share the desk.",
    });
    const scout = await rpc.bots.create({
      name: "Scout",
      title: "Talent",
      description: "Same desk.",
      instructions: "Same desk.",
    });
    expect(scout.computerId).toBe(piper.computerId);
    expect(scout.computerName).toBe("Default computer");

    const expense = await rpc.bots.create({
      name: "Expense",
      title: "Finance",
      description: "Private box.",
      instructions: "Private box.",
      computer: "new",
    });
    expect(expense.computerId).not.toBe(piper.computerId);
    expect(expense.computerName).not.toBe("Default computer");

    const desks = await rpc.computers.list();
    expect(desks.some((item) => item.isDefault && item.agentCount === 2)).toBe(
      true,
    );
    expect(desks.some((item) => !item.isDefault && item.agentCount === 1)).toBe(
      true,
    );

    await rpc.threads.send({ botId: piper.id, text: "claim the mouse" });
    const piperDesk = await rpc.computer.status({ botId: piper.id });
    const scoutDesk = await rpc.computer.status({ botId: scout.id });
    expect(piperDesk.id).toBe(scoutDesk.id);
    expect(scoutDesk.teammates.map((item) => item.name).sort()).toEqual(
      ["Piper", "Scout"].sort(),
    );

    const taken = await rpc.computer.takeover({ botId: piper.id });
    expect(taken.controlHolder).toBe("user");
    const scoutSees = await rpc.computer.status({ botId: scout.id });
    expect(scoutSees.controlHolder).toBe("user");
    expect(scoutSees.id).toBe(taken.id);
  }, 15_000);

  it("lets a guest agent dial in and answer", async () => {
    const email = `guest-${Date.now()}@example.com`;
    const signUp = await handles.app.request(
      new Request(`${origin}/api/auth/sign-up/email`, {
        method: "POST",
        headers: {
          origin,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: "Guest Tester",
          email,
          password: "password1",
        }),
      }),
    );
    cookie = cookieHeader(signUp, cookie);
    expect(signUp.status, await signUp.text()).toBe(200);

    const rpc = client();
    const bot = await rpc.bots.create({
      name: "Hermes stand-in",
      title: "External",
      description: "Guest loop.",
      instructions: "Guest loop.",
    });
    expect(bot.guestKind).toBe("off");

    const issued = await rpc.guests.enable({
      botId: bot.id,
      kind: "hermes",
    });
    expect(issued.token.startsWith("gbg_")).toBe(true);
    expect(issued.command).toContain("--kind hermes");

    const sent = await rpc.threads.send({
      botId: bot.id,
      text: "ping from office",
    });
    expect(sent.seq).toBeGreaterThan(0);

    const hello = await handles.app.request(
      new Request(`${origin}/guest/hello`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: issued.token, kind: "hermes" }),
      }),
    );
    const helloBody = await hello.text();
    expect(hello.status, helloBody).toBe(200);
    const session = JSON.parse(helloBody) as { sessionId: string };

    let runId = "";
    for (let i = 0; i < 8 && !runId; i += 1) {
      const waited = await handles.app.request(
        new Request(`${origin}/guest/wait`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionId: session.sessionId }),
        }),
      );
      expect(waited.status).toBe(200);
      const message = (await waited.json()) as {
        type: string;
        request?: { runId: string; prompt: string };
      };
      if (message.type === "run" && message.request) {
        runId = message.request.runId;
        expect(message.request.prompt).toBe("ping from office");
      }
    }
    expect(runId.length).toBeGreaterThan(0);

    const reply = "Guest: ping from office";
    for (const event of [
      { type: "progress", text: "working…" },
      { type: "text", text: reply },
      { type: "done", text: reply },
    ]) {
      const posted = await handles.app.request(
        new Request(`${origin}/guest/event`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            sessionId: session.sessionId,
            runId,
            event,
          }),
        }),
      );
      expect(posted.status, await posted.text()).toBe(200);
    }

    const texts: string[] = [];
    const iterator = (await rpc.threads.subscribe({
      botId: bot.id,
      cursor: -1,
    })) as AsyncGenerator<{
      type: string;
      payload: Record<string, unknown>;
    }>;
    const stop = setTimeout(() => void iterator.return(undefined), 8_000);
    try {
      for await (const event of iterator) {
        if (event.type !== "message.created") continue;
        const blocks = event.payload.blocks;
        if (!Array.isArray(blocks)) continue;
        for (const block of blocks) {
          if (
            block &&
            typeof block === "object" &&
            "text" in block &&
            typeof block.text === "string"
          ) {
            texts.push(block.text);
          }
        }
        if (texts.includes(reply)) break;
      }
    } finally {
      clearTimeout(stop);
      await iterator.return(undefined);
    }
    expect(texts).toContain("ping from office");
    expect(texts).toContain(reply);

    await rpc.guests.disable({ botId: bot.id });
    const after = await rpc.bots.get({ botId: bot.id });
    expect(after.guestKind).toBe("off");
  }, 20_000);
});
