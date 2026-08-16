import { PRESS_ASSETS } from "@grogbot/seo";
import { describe, expect, it } from "vitest";
import { lookupPressAsset, pressAssetFiles } from "./press-assets";

describe("press assets", () => {
  it("serves an SVG for every listed logo", () => {
    expect(pressAssetFiles()).toEqual(PRESS_ASSETS.map((asset) => asset.file));
    for (const asset of PRESS_ASSETS) {
      const file = lookupPressAsset(asset.file);
      expect(file, asset.file).toBeDefined();
      expect(file?.contentType).toContain("image/svg+xml");
      expect(file?.body).toContain("<svg");
      expect(file?.body).toContain("Grogbot");
    }
  });

  it("does not invent extra files", () => {
    expect(lookupPressAsset("logo.png")).toBeUndefined();
  });
});
