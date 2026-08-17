import { describe, expect, it } from "vitest";
import {
  catalogToCards,
  logoNeedsLightPlate,
  parseComposioCatalog,
  sampleLuminance,
} from "./plugins";

describe("plugin catalog", () => {
  it("skips the composio meta toolkit", () => {
    const cards = catalogToCards(
      parseComposioCatalog([
        { slug: "composio", name: "Composio" },
        {
          slug: "gmail",
          name: "Gmail",
          description: "Mail",
          category: "email",
          logo: "https://logos.composio.dev/api/gmail",
        },
      ]),
    );
    expect(cards.map((item) => item.id)).toEqual(["gmail"]);
    expect(cards[0]?.category).toBe("Email");
  });

  it("puts dark logos on a light plate", () => {
    expect(logoNeedsLightPlate(40)).toBe(true);
    expect(logoNeedsLightPlate(200)).toBe(false);
    const pixels = new Uint8ClampedArray([0, 0, 0, 255, 0, 0, 0, 255]);
    expect(sampleLuminance(pixels, 4)).toBe(0);
  });
});
