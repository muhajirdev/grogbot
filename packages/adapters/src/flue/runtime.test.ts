import { afterAll, describe, expect, it } from "vitest";
import { createAgentRuntime } from "../runtime.js";
import { ECHO_MODEL } from "./echo.js";
import { resolveFlueModel, stopFlueAgentRuntime } from "./runtime.js";

const runRequest = {
  botId: "bot-flue",
  threadId: "thread-flue",
  runId: "run-flue-1",
  prompt: "summarize the handoff",
  instructions: "You are Piper.",
  history: [{ role: "user" as const, content: "summarize the handoff" }],
};

const adapterContext = {
  operationId: "op-flue",
  workspaceId: "ws-1",
  userId: "user-1",
  botId: "bot-flue",
  runId: "run-flue-1",
  signal: new AbortController().signal,
};

describe("FlueAgentRuntime", () => {
  afterAll(async () => {
    await stopFlueAgentRuntime();
  });

  it("resolves the echo model without provider keys", () => {
    expect(resolveFlueModel(true, {})).toBe(ECHO_MODEL);
  });

  it("echoes through the Pi harness offline", async () => {
    const runtime = createAgentRuntime("flue-echo");
    const events = [];
    for await (const event of runtime.run(runRequest, adapterContext)) {
      events.push(event);
    }
    expect(events.some((event) => event.type === "progress")).toBe(true);
    expect(events).toContainEqual({
      type: "text",
      text: "Echo: summarize the handoff",
    });
    expect(events.at(-1)).toEqual({
      type: "done",
      text: "Echo: summarize the handoff",
    });
  });
});
