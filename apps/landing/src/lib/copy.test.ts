import { describe, expect, it } from "vitest";
import {
  APPS,
  FAQS,
  FEATURES,
  HERO,
  HERO_TICKS,
  JOBS,
  PAGE_DESCRIPTION,
  SOURCE_REPO,
  STEPS,
} from "./copy.js";

describe("landing copy", () => {
  it("sells a messaging app of bots, not a workflow builder", () => {
    expect(HERO.title.toLowerCase()).toContain("chat app");
    expect(HERO.lede.toLowerCase()).toContain("teammate");
    expect(HERO_TICKS).toHaveLength(3);
    expect(STEPS).toHaveLength(3);
  });

  it("keeps Grogbot product rules, not a local CLI harness", () => {
    const blob = [
      HERO.lede,
      ...FEATURES.map((item) => `${item.title} ${item.body}`),
      ...FAQS.map((item) => `${item.q} ${item.a}`),
      PAGE_DESCRIPTION,
    ]
      .join(" ")
      .toLowerCase();
    expect(blob).toContain("desk");
    expect(blob).toContain("you host");
    expect(blob).not.toContain("claude cli");
    expect(blob).not.toContain("codex cli");
    expect(blob).not.toContain("~/.openmausbot");
    expect(blob).not.toContain("supamaus");
    expect(SOURCE_REPO).toContain("grogbot");
  });

  it("covers computer, approvals, and connected apps", () => {
    const ids = FEATURES.map((item) => item.id);
    expect(ids).toEqual(
      expect.arrayContaining(["computer", "approvals", "apps", "desk", "host"]),
    );
    expect(APPS).toEqual(
      expect.arrayContaining(["Gmail", "Slack", "GitHub", "Notion", "Linear"]),
    );
    expect(JOBS.length).toBeGreaterThanOrEqual(6);
  });
});
