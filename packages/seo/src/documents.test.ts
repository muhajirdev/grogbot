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
    expect(txt).toContain("hello@grogbot.com");
    expect(txt).toContain(`](${CLOUD_LANDING_ORIGIN}/llms.txt)`);
    expect(txt).toContain("/press");
    expect(identityJson(origins).name).toBe("Grogbot");
    expect(aiJson(origins).name).toBe("Grogbot");
    const pages = identityJson(origins).sitePages as Array<{ name: string }>;
    expect(pages.some((page) => page.name === "Press kit")).toBe(true);
  });

  it("lists public pages in the sitemap and allows AI crawlers", () => {
    const sitemap = sitemapXml(origins);
    expect(sitemap).toContain(`${CLOUD_LANDING_ORIGIN}/llms.txt`);
    expect(sitemap).toContain(`${CLOUD_LANDING_ORIGIN}/mcp`);
    expect(sitemap).toContain(`${CLOUD_LANDING_ORIGIN}/press`);
    expect(robotsTxt(origins)).toContain("User-agent: GPTBot");
    expect(robotsTxt(origins)).toContain("Allow: /llms.txt");
  });

  it("describes Flue on Node and self-host, not Rivet", () => {
    expect(llmsTxt(origins)).toMatch(/self-host/i);
    expect(developerAiTxt(origins)).toMatch(/Flue/);
    expect(faqAiTxt(origins)).toMatch(/self-host/i);
    expect(llmsFullTxt(origins)).not.toMatch(/Rivet/i);
    expect(GROGBOT_STACK.join("\n")).not.toMatch(/Rivet/i);
    expect(GROGBOT_STACK.join("\n")).toMatch(/Cloudflare Computer/);
    expect(GROGBOT_STACK.join("\n")).not.toMatch(/E2B hosted/);
  });

  it("does not claim zero retention as a Grogbot product feature", () => {
    const faq = faqAiTxt(origins);
    expect(faq).toMatch(/Does my data leave the office/i);
    expect(faq).toMatch(/does not claim zero retention/i);
    expect(faq).toMatch(/office is meant to remember/i);
    expect(faq).toContain("hello@grogbot.com");
  });
});
