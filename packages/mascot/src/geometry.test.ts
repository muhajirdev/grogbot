import { describe, expect, it } from "vitest";
import {
  BODY_POINTS,
  MASCOT_MOODS,
  MASCOT_SHAPES,
  mascotAnchor,
  mascotBody,
  mascotBodyPoints,
  mascotColors,
  mascotFace,
  mascotSlits,
  mixHex,
  moodFromActivity,
  normalizeHex,
  PACK_LENGTH,
  packMascot,
  pointsToPath,
  seedFromName,
  slitColor,
  unpackMascot,
} from "./geometry.js";

describe("mascot geometry", () => {
  it("normalizes short and full hex, and falls back", () => {
    expect(normalizeHex("#3FA")).toBe("#33ffaa");
    expect(normalizeHex("#e45c9a")).toBe("#e45c9a");
    expect(normalizeHex("nope")).toBe("#e45c9a");
  });

  it("mixes toward white for the plump highlight", () => {
    const light = mixHex("#2f9e6d", "#ffffff", 0.3);
    expect(light.startsWith("#")).toBe(true);
    expect(light).not.toBe("#2f9e6d");
  });

  it("uses a 24-point circle that sits inside the face box", () => {
    const points = mascotBodyPoints("circle");
    expect(points).toHaveLength(BODY_POINTS);
    for (const point of points) {
      const r = Math.hypot(point.x - 50, point.y - 51);
      expect(r).toBeGreaterThan(42);
      expect(r).toBeLessThan(44);
    }
    expect(mascotAnchor("circle").scale).toBe(1);
    expect(mascotBody("circle").d.startsWith("M")).toBe(true);
    expect(mascotBody("circle").d.endsWith("Z")).toBe(true);
  });

  it("gives every shape the same point count so they can morph", () => {
    const counts = new Set(
      MASCOT_SHAPES.map((shape) => mascotBodyPoints(shape).length),
    );
    expect(counts).toEqual(new Set([BODY_POINTS]));
    for (const shape of MASCOT_SHAPES) {
      const packed = packMascot(shape, "idle");
      expect(packed).toHaveLength(PACK_LENGTH);
      const path = pointsToPath(mascotBodyPoints(shape));
      expect(path.match(/C/g)?.length).toBe(BODY_POINTS);
    }
  });

  it("keeps every body point inside the 100 box", () => {
    for (const shape of MASCOT_SHAPES) {
      for (const point of mascotBodyPoints(shape)) {
        expect(point.x).toBeGreaterThan(4);
        expect(point.x).toBeLessThan(96);
        expect(point.y).toBeGreaterThan(4);
        expect(point.y).toBeLessThan(96);
      }
    }
  });

  it("uses two tilted capsules for every mood", () => {
    for (const mood of MASCOT_MOODS) {
      const face = mascotFace(mood);
      expect(face.left.h).toBeGreaterThan(face.left.w);
      expect(face.right.h).toBeGreaterThan(face.right.w);
      expect(face.left.rot).toBeLessThan(0);
      expect(face.right.rot).toBeLessThan(0);
    }
  });

  it("looks at you on idle instead of parking slits on the right", () => {
    const [left, right] = mascotSlits("circle", "idle");
    expect(left.cx).toBeGreaterThan(38);
    expect(left.cx).toBeLessThan(48);
    expect(right.cx).toBeGreaterThan(52);
    expect(right.cx).toBeLessThan(62);
    expect((left.cx + right.cx) / 2).toBeGreaterThan(48);
    expect((left.cx + right.cx) / 2).toBeLessThan(52);
  });

  it("gives each mood its own slit pose", () => {
    const poses = MASCOT_MOODS.map((mood) => {
      const [left, right] = mascotSlits("circle", mood);
      return `${left.cy.toFixed(1)}:${left.rot}:${right.rot}:${left.h.toFixed(1)}`;
    });
    expect(new Set(poses).size).toBe(MASCOT_MOODS.length);
    expect(mascotSlits("circle", "working")[0]?.cy).toBeGreaterThan(
      mascotSlits("circle", "idle")[0]?.cy ?? 0,
    );
    expect(mascotSlits("circle", "happy")[0]?.rot).toBeLessThan(
      mascotSlits("circle", "idle")[0]?.rot ?? 0,
    );
  });

  it("anchors every rounded silhouette in the face box", () => {
    for (const shape of MASCOT_SHAPES) {
      const anchor = mascotAnchor(shape);
      expect(anchor.x).toBeGreaterThan(40);
      expect(anchor.x).toBeLessThan(60);
      expect(anchor.scale).toBeGreaterThan(0.6);
      expect(anchor.scale).toBeLessThanOrEqual(1);
      expect(mascotBody(shape).d.length).toBeGreaterThan(40);
    }
  });

  it("round-trips a packed mascot", () => {
    const packed = packMascot("hex", "thinking");
    const unpacked = unpackMascot(packed);
    expect(unpacked.slits[0]?.rot).toBe(packed[BODY_POINTS * 2 + 4]);
    expect(unpacked.d.startsWith("M")).toBe(true);
  });

  it("maps activity onto working vs idle", () => {
    expect(moodFromActivity(true)).toBe("working");
    expect(moodFromActivity(false)).toBe("idle");
  });

  it("seeds blink delay from the name so mascots do not sync", () => {
    expect(seedFromName("Piper")).not.toBe(seedFromName("Ledger"));
  });

  it("paints a plump highlight and a grog flush from the bot color", () => {
    const colors = mascotColors("#5b7cff");
    expect(colors.mid).toBe("#5b7cff");
    expect(colors.light).not.toBe(colors.mid);
    expect(colors.dark).not.toBe(colors.mid);
    expect(colors.blush).not.toBe(colors.mid);
    expect(colors.slit).toBe("#1a1412");
    expect(slitColor("#e45c9a")).toBe("#1a1412");
    expect(slitColor("#1a1a1a")).not.toBe("#1a1412");
  });
});
