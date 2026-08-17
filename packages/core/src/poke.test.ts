import { describe, expect, it } from "vitest";
import {
  MAX_POKE_DEPTH,
  PokeError,
  pokeBriefing,
  resolvePokeTarget,
} from "./poke.js";

const roster = [
  { id: "cos", name: "Maya", title: "Chief of Staff", archivedAt: null },
  { id: "look", name: "Lookout", title: "Watch", archivedAt: null },
  { id: "old", name: "Archie", title: "", archivedAt: new Date() },
];

describe("resolvePokeTarget", () => {
  it("matches a teammate by name, ignoring case", () => {
    expect(resolvePokeTarget(roster, "cos", "lookout").id).toBe("look");
  });

  it("matches by id", () => {
    expect(resolvePokeTarget(roster, "cos", "look").name).toBe("Lookout");
  });

  it("refuses self", () => {
    expect(() => resolvePokeTarget(roster, "cos", "Maya")).toThrow(PokeError);
    expect(() => resolvePokeTarget(roster, "cos", "Maya")).toThrow(
      /cannot poke yourself/,
    );
  });

  it("refuses archived teammates", () => {
    expect(() => resolvePokeTarget(roster, "cos", "Archie")).toThrow(
      /archived/,
    );
  });

  it("lists live names when missing", () => {
    expect(() => resolvePokeTarget(roster, "cos", "Scout")).toThrow(
      /Available: Lookout/,
    );
  });
});

describe("pokeBriefing", () => {
  it("tells the specialist not to ask the human", () => {
    const text = pokeBriefing("Maya", "Chief of Staff", "watch the repos");
    expect(text).toContain("Maya (Chief of Staff) asked you");
    expect(text).toContain("Do not ask the human");
    expect(text).toContain("watch the repos");
  });
});

describe("MAX_POKE_DEPTH", () => {
  it("caps the chain at two", () => {
    expect(MAX_POKE_DEPTH).toBe(2);
  });
});
