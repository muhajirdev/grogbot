import { describe, expect, it } from "vitest";
import { GuestHub } from "./guest-hub.js";
import {
  hashGuestToken,
  mintGuestToken,
  parseGuestToken,
  tokenMatches,
} from "./guest-token.js";

describe("guest tokens", () => {
  it("round-trips a hashed token", () => {
    const minted = mintGuestToken("connector-1");
    expect(parseGuestToken(minted.token)?.connectorId).toBe("connector-1");
    expect(tokenMatches(minted.token, minted.tokenHash)).toBe(true);
    expect(tokenMatches("gbg_connector-1_nope", minted.tokenHash)).toBe(false);
    expect(hashGuestToken(minted.token)).toBe(minted.tokenHash);
  });
});

describe("GuestHub", () => {
  it("forwards a run to a connected guest", async () => {
    const hub = new GuestHub();
    const session = hub.hello("bot-1", "hermes");
    const events: string[] = [];
    const running = (async () => {
      for await (const event of hub.forwardRun(
        {
          botId: "bot-1",
          threadId: "t1",
          runId: "r1",
          prompt: "hi",
          instructions: "",
          history: [],
        },
        undefined,
      )) {
        if (event.type === "text" || event.type === "done") {
          events.push(`${event.type}:${event.text ?? ""}`);
        }
      }
    })();
    const message = await hub.wait(session.id, 500);
    expect(message.type).toBe("run");
    expect(
      hub.onEvent(session.id, "r1", { type: "text", text: "Guest: hi" }),
    ).toBe(true);
    expect(
      hub.onEvent(session.id, "r1", { type: "done", text: "Guest: hi" }),
    ).toBe(true);
    await running;
    expect(events).toEqual(["text:Guest: hi", "done:Guest: hi"]);
    hub.stop();
  });

  it("is offline until hello", () => {
    const hub = new GuestHub();
    expect(hub.isOnline("bot-1")).toBe(false);
    hub.hello("bot-1", "openclaw");
    expect(hub.isOnline("bot-1")).toBe(true);
    hub.dropBot("bot-1");
    expect(hub.isOnline("bot-1")).toBe(false);
  });
});
