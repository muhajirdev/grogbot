import { CLOUD_WEB_ORIGIN } from "@grogbot/contracts";
import { describe, expect, it } from "vitest";
import {
  aiJson,
  identityJson,
  llmsTxt,
  robotsTxt,
  sitemapXml,
} from "./documents.js";
import { cloudOrigins } from "./identity.js";

const origins = cloudOrigins();

describe("discovery documents", () => {
  it("uses Grogbot as the llms.txt H1 and names identity.json the same", () => {
    expect(cloudOrigins().web).toBe(CLOUD_WEB_ORIGIN);
    const txt = llmsTxt(origins);
    expect(txt.startsWith("# Grogbot\n")).toBe(true);
    expect(txt).toContain(`](${CLOUD_WEB_ORIGIN}/llms.txt)`);
    expect(identityJson(origins).name).toBe("Grogbot");
    expect(aiJson(origins).name).toBe("Grogbot");
  });

  it("lists public pages in the sitemap and allows AI crawlers", () => {
    const sitemap = sitemapXml(origins);
    expect(sitemap).toContain(`${CLOUD_WEB_ORIGIN}/llms.txt`);
    expect(sitemap).toContain(`${CLOUD_WEB_ORIGIN}/mcp`);
    expect(robotsTxt(origins)).toContain("User-agent: GPTBot");
    expect(robotsTxt(origins)).toContain("Allow: /llms.txt");
  });
});
