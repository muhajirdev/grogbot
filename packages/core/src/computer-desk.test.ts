import { describe, expect, it } from "vitest";
import {
  activityFromRunEvents,
  artifactFromText,
  clipDeskText,
  nowDoingFromActivity,
  textFromBlocks,
  uniqueWorkspacePath,
  workspacePathForBot,
} from "./computer-desk.js";

describe("computer desk", () => {
  it("names a workspace file from the bot", () => {
    expect(workspacePathForBot("Chief of Staff", "bot-12345678")).toBe(
      "/workspace/chief-of-staff-bot-1234.md",
    );
    const taken = new Set<string>();
    expect(uniqueWorkspacePath("Piper", "aaa", taken)).toBe(
      "/workspace/piper.md",
    );
    expect(uniqueWorkspacePath("Piper", "bbb-bbbb", taken)).toBe(
      "/workspace/piper-bbb-bbbb.md",
    );
  });

  it("splits a titled digest from the first line", () => {
    const artifact = artifactFromText(
      "Digest · since yesterday\n• Venue deposit – you owe a yes\n• Acme replied on pricing",
      "2026-08-17T00:00:00.000Z",
      "/workspace/chief.md",
    );
    expect(artifact.title).toBe("Digest · since yesterday");
    expect(artifact.body).toContain("Venue deposit");
  });

  it("keeps a short reply as the body", () => {
    const artifact = artifactFromText(
      "Echo: summarize the handoff",
      "2026-08-17T00:00:00.000Z",
      "/workspace/piper.md",
    );
    expect(artifact.title).toBe("Latest");
    expect(artifact.body).toBe("Echo: summarize the handoff");
  });

  it("reads text blocks with newlines", () => {
    expect(
      textFromBlocks([
        { kind: "text", text: "one" },
        { kind: "text", text: "two" },
        { kind: "meta", text: "skip" },
      ]),
    ).toBe("one\ntwo");
  });

  it("clips long artifacts", () => {
    expect(clipDeskText("abcdefghij", 8)).toBe("abcdefgh\n…");
  });

  it("keeps a short activity trail and collapses repeats", () => {
    const items = activityFromRunEvents([
      {
        id: "1",
        payload: { status: "running", text: "working…" },
        createdAt: "2026-08-17T00:00:00.000Z",
      },
      {
        id: "2",
        payload: { status: "running", text: "working…" },
        createdAt: "2026-08-17T00:00:01.000Z",
      },
      {
        id: "3",
        payload: { status: "running", text: "editing digest.md" },
        createdAt: "2026-08-17T00:00:02.000Z",
      },
      {
        id: "4",
        payload: { status: "completed", text: "a long reply" },
        createdAt: "2026-08-17T00:00:03.000Z",
      },
      {
        id: "5",
        payload: { status: "cancelled", text: "archived" },
        createdAt: "2026-08-17T00:00:04.000Z",
      },
    ]);
    expect(items.map((item) => item.text)).toEqual([
      "working…",
      "editing digest.md",
      "Done",
    ]);
  });

  it("only reports now-doing while this bot has the desk", () => {
    const rows = [
      { status: "running", text: "editing digest.md" },
      { status: "completed", text: "done" },
    ];
    expect(nowDoingFromActivity(rows, false)).toBeNull();
    expect(nowDoingFromActivity(rows, true)).toBeNull();
    expect(nowDoingFromActivity([], true)).toBe("working…");
    expect(
      nowDoingFromActivity([{ status: "running", text: "grep inbox/" }], true),
    ).toBe("grep inbox/");
  });
});
