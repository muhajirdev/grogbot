import { describe, expect, it } from "vitest";
import { AgentRunError } from "@flue/runtime";
import { flueErrorText, humanizeFlueMessage } from "./errors.js";

describe("flueErrorText", () => {
  it("unwraps a string cause from AgentRunError", () => {
    const error = new AgentRunError({
      outcome: "failed",
      submissionId: "sub_abc",
      cause: '[flue] Unknown model ID "workers-ai/@cf/x" for provider "cloudflare-ai-gateway".',
    });
    expect(flueErrorText(error)).toBe(
      "Model “workers-ai/@cf/x” isn’t available for cloudflare-ai-gateway. Pick another model in Settings → Models.",
    );
  });

  it("unwraps an Error cause", () => {
    const error = new AgentRunError({
      outcome: "failed",
      submissionId: "sub_abc",
      cause: new Error("provider timed out"),
    });
    expect(flueErrorText(error)).toBe("provider timed out");
  });

  it("humanizes the empty wrapper when there is no cause", () => {
    const error = new AgentRunError({
      outcome: "failed",
      submissionId: "sub_01M055FETMXZZKHH3XWRYX7S2K",
    });
    expect(flueErrorText(error)).toMatch(/Settings → Models/);
    expect(flueErrorText(error)).not.toMatch(/sub_01M055/);
  });

  it("humanizes raw wrapper text", () => {
    expect(
      humanizeFlueMessage(
        "[flue] Agent run failed (submission sub_01M055FETMXZZKHH3XWRYX7S2K).",
      ),
    ).toMatch(/Settings → Models/);
  });
});
