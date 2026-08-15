import { describe, expect, it } from "vitest";
import { InMemoryWakeupDriver } from "./wakeup.js";

describe("InMemoryWakeupDriver", () => {
  it("runs a job", async () => {
    const wakeup = new InMemoryWakeupDriver();
    const seen: string[] = [];
    await wakeup.start({
      "run.continue": async (payload) => {
        seen.push(String(payload.runId));
      },
    });
    await wakeup.enqueue({ name: "run.continue", payload: { runId: "r1" } });
    await new Promise((r) => setTimeout(r, 20));
    expect(seen).toEqual(["r1"]);
    await wakeup.stop();
  });
});
