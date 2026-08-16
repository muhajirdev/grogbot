import { CLOUD_LANDING_ORIGIN } from "@grogbot/contracts";
import { describe, expect, it } from "vitest";
import {
  aiJson,
  developerAiTxt,
  faqAiTxt,
  identityJson,
  llmsFullTxt,
  llmsTxt,
  robotsTxt,
  sitemapXml,
} from "./documents.js";
import { cloudOrigins, GROGBOT_STACK } from "./identity.js";

const origins = cloudOrigins();

describe("discovery documents", () => {
  it("uses Grogbot as the llms.txt H1 and names identity.json the same", () => {
    expect(cloudOrigins().web).toBe(CLOUD_LANDING_ORIGIN);
    const txt = llmsTxt(origins);
    expect(txt.startsWith("# Grogbot\n")).toBe(true);
    expect(txt).toContain(`](${CLOUD_LANDING_ORIGIN}/llms.txt)`);
    expect(identityJson(origins).name).toBe("Grogbot");
    expect(aiJson(origins).name).toBe("Grogbot");
  });

  it("lists public pages in the sitemap and allows AI crawlers", () => {
    const sitemap = sitemapXml(origins);
    expect(sitemap).toContain(`${CLOUD_LANDING_ORIGIN}/llms.txt`);
    expect(sitemap).toContain(`${CLOUD_LANDING_ORIGIN}/mcp`);
    expect(robotsTxt(origins)).toContain("User-agent: GPTBot");
    expect(robotsTxt(origins)).toContain("Allow: /llms.txt");
  });

  it("describes Flue on Node and self-host, not Rivet", () => {
    expect(llmsTxt(origins)).toMatch(/self-host/i);
    expect(developerAiTxt(origins)).toMatch(/Flue/);
    expect(faqAiTxt(origins)).toMatch(/self-host/i);
    expect(llmsFullTxt(origins)).not.toMatch(/Rivet/i);
    expect(GROGBOT_STACK.join("\n")).not.toMatch(/Rivet/i);
  });
});
