import { describe, expect, it } from "vitest";
import {
  CLOUD_API_ORIGIN,
  CLOUD_LANDING_ORIGIN,
  CLOUD_WEB_ORIGIN,
  grogbotCookieDomain,
} from "./origins.js";

describe("cloud origins", () => {
  it("splits marketing, office, and API hosts", () => {
    expect(CLOUD_LANDING_ORIGIN).toBe("https://grogbot.com");
    expect(CLOUD_WEB_ORIGIN).toBe("https://app.grogbot.com");
    expect(CLOUD_API_ORIGIN).toBe("https://api.grogbot.com");
  });

  it("sets a parent cookie domain on grogbot.com hosts", () => {
    expect(grogbotCookieDomain(CLOUD_LANDING_ORIGIN)).toBe(".grogbot.com");
    expect(grogbotCookieDomain(CLOUD_WEB_ORIGIN)).toBe(".grogbot.com");
    expect(grogbotCookieDomain(CLOUD_API_ORIGIN)).toBe(".grogbot.com");
    expect(grogbotCookieDomain("http://127.0.0.1:5173")).toBeUndefined();
  });
});
