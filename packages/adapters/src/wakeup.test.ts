import { describe, expect, it } from "vitest";
import { InProcessWakeupDriver } from "./wakeup.js";

describe("InProcessWakeupDriver", () => {
  it("runs a continue on that bot", async () => {
    const wakeup = new InProcessWakeupDriver();
    const seen: string[] = [];
    await wakeup.start({
      "run.continue": async (payload) => {
        seen.push(`${payload.botId}:${payload.runId}`);
      },
    });
    await wakeup.enqueue({
      botId: "bot-a",
      name: "run.continue",
      payload: { runId: "r1" },
    });
    await new Promise((r) => setTimeout(r, 20));
    expect(seen).toEqual(["bot-a:r1"]);
    await wakeup.stop();
  });

  it("serializes two wakes on the same bot", async () => {
    const wakeup = new InProcessWakeupDriver();
    const seen: string[] = [];
    await wakeup.start({
      "run.continue": async (payload) => {
        const id = String(payload.runId);
        seen.push(`start:${id}`);
        await new Promise((r) => setTimeout(r, 30));
        seen.push(`end:${id}`);
      },
    });
    await wakeup.enqueue({
      botId: "bot-a",
      name: "run.continue",
      payload: { runId: "1" },
    });
    await wakeup.enqueue({
      botId: "bot-a",
      name: "run.continue",
      payload: { runId: "2" },
    });
    await new Promise((r) => setTimeout(r, 100));
    expect(seen).toEqual(["start:1", "end:1", "start:2", "end:2"]);
    await wakeup.stop();
  });

  it("replaces a named delayed schedule", async () => {
    const wakeup = new InProcessWakeupDriver();
    const seen: string[] = [];
    await wakeup.start({
      "computer.sleep": async (payload) => {
        seen.push(String(payload.botId));
      },
    });
    await wakeup.enqueue({
      botId: "bot-a",
      name: "computer.sleep",
      payload: {},
      runAt: new Date(Date.now() + 40),
      jobKey: "computer.sleep:bot-a",
    });
    await wakeup.enqueue({
      botId: "bot-a",
      name: "computer.sleep",
      payload: {},
      runAt: new Date(Date.now() + 40),
      jobKey: "computer.sleep:bot-a",
    });
    await new Promise((r) => setTimeout(r, 80));
    expect(seen).toEqual(["bot-a"]);
    await wakeup.stop();
  });

  it("runs two bots in parallel", async () => {
    const wakeup = new InProcessWakeupDriver();
    const seen: string[] = [];
    await wakeup.start({
      "run.continue": async (payload) => {
        const id = String(payload.botId);
        seen.push(`start:${id}`);
        await new Promise((r) => setTimeout(r, 30));
        seen.push(`end:${id}`);
      },
    });
    await wakeup.enqueue({ botId: "bot-a", name: "run.continue", payload: {} });
    await wakeup.enqueue({ botId: "bot-b", name: "run.continue", payload: {} });
    await new Promise((r) => setTimeout(r, 80));
    expect(seen.slice(0, 2).sort()).toEqual(["start:bot-a", "start:bot-b"]);
    await wakeup.stop();
  });
});
