import { PRESS_ASSETS } from "@groxbot/seo";
import { describe, expect, it } from "vitest";
import {
  PRESS_ASSET_VERSION,
  lookupPressAsset,
  pressAssetFiles,
  pressAssetHref,
} from "./press-assets";

describe("press assets", () => {
  it("serves an SVG for every listed logo", () => {
    expect(pressAssetFiles()).toEqual(PRESS_ASSETS.map((asset) => asset.file));
    for (const asset of PRESS_ASSETS) {
      const file = lookupPressAsset(asset.file);
      expect(file, asset.file).toBeDefined();
      expect(file?.contentType).toContain("image/svg+xml");
      expect(file?.body).toContain("<svg");
      expect(file?.body).toContain("Groxbot");
      expect(file?.body).toContain("<rect");
      expect(file?.body).not.toContain("pupil");
    }
  });

  it("does not invent extra files", () => {
    expect(lookupPressAsset("logo.png")).toBeUndefined();
  });

  it("cache-busts download hrefs when the mark changes", () => {
    expect(pressAssetHref("groxbot-mark.svg")).toBe(
      `/press/groxbot-mark.svg?v=${PRESS_ASSET_VERSION}`,
    );
  });
});
