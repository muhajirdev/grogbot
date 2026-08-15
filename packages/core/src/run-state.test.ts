import { describe, expect, it } from "vitest";
import { assertTransition, canTransition } from "./run-state.js";

describe("run-state", () => {
  it("allows queued to leased", () => {
    expect(canTransition("queued", "leased")).toBe(true);
  });

  it("rejects completed to running", () => {
    expect(canTransition("completed", "running")).toBe(false);
    expect(() => assertTransition("completed", "running")).toThrow(/Illegal/);
  });
});
