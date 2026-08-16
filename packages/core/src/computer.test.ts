import { describe, expect, it } from "vitest";
import { canClaimComputer } from "./computer.js";

describe("canClaimComputer", () => {
  it("lets a bot take an idle computer", () => {
    expect(
      canClaimComputer({
        controlHolder: "none",
        controlHolderId: null,
        claimantBotId: "piper",
        activeBotIds: [],
      }),
    ).toBe(true);
  });

  it("lets the same bot keep the mouse", () => {
    expect(
      canClaimComputer({
        controlHolder: "bot",
        controlHolderId: "piper",
        claimantBotId: "piper",
        activeBotIds: ["piper"],
      }),
    ).toBe(true);
  });

  it("does not steal from a bot that is still running", () => {
    expect(
      canClaimComputer({
        controlHolder: "bot",
        controlHolderId: "piper",
        claimantBotId: "scout",
        activeBotIds: ["piper"],
      }),
    ).toBe(false);
  });

  it("reclaims a stale bot holder", () => {
    expect(
      canClaimComputer({
        controlHolder: "bot",
        controlHolderId: "piper",
        claimantBotId: "scout",
        activeBotIds: [],
      }),
    ).toBe(true);
  });

  it("never steals from a human takeover", () => {
    expect(
      canClaimComputer({
        controlHolder: "user",
        controlHolderId: "human-1",
        claimantBotId: "piper",
        activeBotIds: [],
      }),
    ).toBe(false);
  });
});
