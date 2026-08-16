import { describe, expect, it } from "vitest";
import {
  ellipseContains,
  eyeInsideCircle,
  MASCOT_MOODS,
  MASCOT_SHAPES,
  mascotAnchor,
  mascotBody,
  mascotColors,
  mascotFace,
  mascotShine,
  mixHex,
  moodFromActivity,
  normalizeHex,
  seedFromName,
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

  it("keeps circle as the default cute face that fits inside the body", () => {
    const body = mascotBody("circle");
    const face = mascotFace("idle");
    expect(body.kind).toBe("circle");
    if (body.kind !== "circle") return;
    expect(eyeInsideCircle(face.left, body)).toBe(true);
    expect(eyeInsideCircle(face.right, body)).toBe(true);
    expect(mascotAnchor("circle").scale).toBe(1);
  });

  it("uses tall oval eyes on every mood", () => {
    for (const mood of MASCOT_MOODS) {
      const face = mascotFace(mood);
      expect(face.left.ry).toBeGreaterThan(face.left.rx);
      expect(face.right.ry).toBeGreaterThan(face.right.rx);
    }
  });

  it("keeps the body gloss above the eyes so it is not a smear on the left eye", () => {
    const shine = mascotShine();
    const shineBottom = shine.cy + shine.ry;
    expect(shine.cx).toBeLessThan(40);
    for (const mood of MASCOT_MOODS) {
      const face = mascotFace(mood);
      expect(shineBottom).toBeLessThan(face.left.cy - face.left.ry);
      expect(shineBottom).toBeLessThan(face.right.cy - face.right.ry);
    }
  });

  it("puts pupils and catchlights inside both eyes", () => {
    for (const mood of MASCOT_MOODS) {
      const face = mascotFace(mood);
      expect(ellipseContains(face.left, face.pupils[0])).toBe(true);
      expect(ellipseContains(face.right, face.pupils[1])).toBe(true);
      expect(ellipseContains(face.pupils[0], face.sparks[0], 0)).toBe(true);
      expect(ellipseContains(face.pupils[1], face.sparks[1], 0)).toBe(true);
    }
  });

  it("gives each mood its own brows and mouth", () => {
    const faces = MASCOT_MOODS.map((mood) => mascotFace(mood));
    const mouths = new Set(faces.map((face) => face.mouth.d));
    const leftBrows = new Set(faces.map((face) => face.brows[0].d));
    expect(mouths.size).toBe(MASCOT_MOODS.length);
    expect(leftBrows.size).toBe(MASCOT_MOODS.length);
    expect(mascotFace("happy").mouth.fill).toBe(true);
    expect(mascotFace("happy").blushOpacity).toBeGreaterThan(
      mascotFace("idle").blushOpacity,
    );
  });

  it("anchors every rounded silhouette in the face box", () => {
    for (const shape of MASCOT_SHAPES) {
      const anchor = mascotAnchor(shape);
      expect(anchor.x).toBeGreaterThan(40);
      expect(anchor.x).toBeLessThan(60);
      expect(anchor.scale).toBeGreaterThan(0.6);
      expect(anchor.scale).toBeLessThanOrEqual(1);
      const body = mascotBody(shape);
      if (body.kind === "path") expect(body.d.length).toBeGreaterThan(20);
    }
  });

  it("maps activity onto working vs idle", () => {
    expect(moodFromActivity(true)).toBe("working");
    expect(moodFromActivity(false)).toBe("idle");
  });

  it("seeds blink delay from the name so mascots do not sync", () => {
    expect(seedFromName("Piper")).not.toBe(seedFromName("Ledger"));
  });

  it("builds a three-stop body paint from the bot color", () => {
    const colors = mascotColors("#5b7cff");
    expect(colors.mid).toBe("#5b7cff");
    expect(colors.light).not.toBe(colors.mid);
    expect(colors.dark).not.toBe(colors.mid);
    expect(colors.pupil).toBe("#241510");
    expect(colors.eye).not.toBe(colors.pupil);
  });
});
