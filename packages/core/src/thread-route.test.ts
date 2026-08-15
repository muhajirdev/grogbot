import { describe, expect, it } from "vitest";
import { botsToWake } from "./thread-route.js";

const office = [
  { participantType: "bot" as const, participantId: "bot-a", role: "owner" },
  { participantType: "human" as const, participantId: "user-1", role: "member" },
];

const group = [
  { participantType: "bot" as const, participantId: "bot-a", role: "owner" },
  { participantType: "bot" as const, participantId: "bot-b", role: "member" },
  { participantType: "human" as const, participantId: "user-1", role: "member" },
];

describe("botsToWake", () => {
  it("wakes the only bot in an office", () => {
    expect(botsToWake(office)).toEqual(["bot-a"]);
  });

  it("wakes the office bot when a second human is present", () => {
    expect(
      botsToWake([
        ...office,
        { participantType: "human", participantId: "user-2", role: "member" },
      ]),
    ).toEqual(["bot-a"]);
  });

  it("defaults a group to the owner bot", () => {
    expect(botsToWake(group)).toEqual(["bot-a"]);
  });

  it("honors targetBotId in a group", () => {
    expect(botsToWake(group, "bot-b")).toEqual(["bot-b"]);
  });

  it("rejects a bot that is not in the thread", () => {
    expect(() => botsToWake(office, "bot-b")).toThrow(/not in this thread/);
  });

  it("fails closed when several bots have no owner and no target", () => {
    expect(() =>
      botsToWake([
        { participantType: "bot", participantId: "bot-a", role: "member" },
        { participantType: "bot", participantId: "bot-b", role: "member" },
      ]),
    ).toThrow(/targetBotId/);
  });
});
