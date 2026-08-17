import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { COMPARISONS, getComparison } from "../data/comparisons";
import { INDIE_INTEGRATIONS } from "../data/indie-integrations";
import { getUseCase, USE_CASES } from "../data/use-cases";
import { categoryFamily } from "./category-copy";
import { DISCOVERY_SITEMAP_PATHS, landingLlmsTxt } from "./discovery";
import {
  computerIntegrations,
  getIntegration,
  INTEGRATIONS,
  integrationCategories,
  relatedIntegrations,
  searchIntegrations,
} from "./integrations";
import { canonicalUrl } from "./site";
import { sitemapEntries, sitemapXml } from "./sitemap";
import { slugify } from "./slug";
import { HOME_USE_CASES } from "./teasers";

describe("slugify", () => {
  it("turns categories into url slugs", () => {
    expect(slugify("developer tools")).toBe("developer-tools");
    expect(slugify("ads & conversion")).toBe("ads-and-conversion");
  });
});

describe("integrations catalog", () => {
  it("snapshots Composio toolkits plus indie computer integrations", () => {
    expect(getIntegration("gmail")?.kind).toBe("composio");
    expect(getIntegration("gmail")?.toolCount).toBeGreaterThan(0);
    expect(getIntegration("datafast")?.kind).toBe("computer");
    expect(getIntegration("postiz")?.kind).toBe("computer");
    expect(getIntegration("post-bridge")?.founder).toBe("Jack Friks");
    expect(INTEGRATIONS.length).toBeGreaterThan(1000);
  });

  it("does not let indie slugs collide with Composio", () => {
    const composioSlugs = new Set(
      INTEGRATIONS.filter((item) => item.kind === "composio").map(
        (item) => item.slug,
      ),
    );
    for (const item of INDIE_INTEGRATIONS) {
      expect(composioSlugs.has(item.slug)).toBe(false);
    }
  });

  it("varies copy by category family", () => {
    const gmail = getIntegration("gmail");
    const github = getIntegration("github");
    expect(gmail).toBeDefined();
    expect(github).toBeDefined();
    if (!gmail || !github) return;
    expect(categoryFamily(gmail.category)).toBe("email");
    expect(categoryFamily(github.category)).toBe("code");
    expect(gmail.firstMessage).not.toBe(github.firstMessage);
    expect(gmail.how[0]).not.toBe(github.how[0]);
  });

  it("finds related tools in the same category", () => {
    const gmail = getIntegration("gmail");
    expect(gmail).toBeDefined();
    if (!gmail) return;
    const related = relatedIntegrations(gmail, 4);
    expect(related.length).toBeGreaterThan(0);
    expect(related.some((item) => item.slug === "gmail")).toBe(false);
  });

  it("searches indie founders and product names", () => {
    expect(
      searchIntegrations("marc lou").some((item) => item.slug === "datafast"),
    ).toBe(true);
    expect(searchIntegrations("post bridge")[0]?.slug).toBe("post-bridge");
  });

  it("lists computer integrations separately", () => {
    const slugs = computerIntegrations().map((item) => item.slug);
    expect(slugs).toEqual(
      expect.arrayContaining(["datafast", "postiz", "post-bridge", "shipfast"]),
    );
  });

  it("gives every integration a logo, with hosted files for computer tools", () => {
    const missing = INTEGRATIONS.filter((item) => !item.logo).map(
      (item) => item.slug,
    );
    expect(missing).toEqual([]);
    const logosDir = join(
      dirname(fileURLToPath(import.meta.url)),
      "../../public/logos",
    );
    for (const item of computerIntegrations()) {
      expect(item.logo).toBe(`/logos/${item.slug}.png`);
      expect(existsSync(join(logosDir, `${item.slug}.png`))).toBe(true);
    }
  });
});

describe("use cases", () => {
  it("points at real integrations", () => {
    for (const useCase of USE_CASES) {
      for (const slug of useCase.integrationSlugs) {
        expect(getIntegration(slug), slug).toBeDefined();
      }
    }
  });

  it("leads home job chips with Chief of Staff", () => {
    expect(HOME_USE_CASES[0]).toEqual({
      slug: "chief-of-staff",
      title: "Chief of Staff",
    });
    for (const item of HOME_USE_CASES) {
      expect(getUseCase(item.slug), item.slug).toBeDefined();
    }
  });
});

describe("comparisons", () => {
  it("answers chatbot questions in the first sentence", () => {
    expect(COMPARISONS.length).toBeGreaterThanOrEqual(16);
    const slugs = new Set(COMPARISONS.map((item) => item.slug));
    expect(slugs.has("grogbot-vs-openclaw")).toBe(true);
    expect(slugs.has("grogbot-vs-grok-bot")).toBe(true);
    expect(slugs.has("openclaw-alternatives")).toBe(true);
    for (const item of COMPARISONS) {
      expect(item.question.endsWith("?")).toBe(true);
      expect(item.answer.length).toBeGreaterThan(40);
      expect(item.answer).toMatch(/Grogbot/);
      expect(item.faqs.length).toBeGreaterThan(0);
      for (const slug of item.related) {
        expect(getComparison(slug), slug).toBeDefined();
      }
      for (const option of item.options ?? []) {
        if (option.slug)
          expect(getComparison(option.slug), option.slug).toBeDefined();
      }
    }
  });
});

describe("sitemap", () => {
  it("includes hubs, categories, integrations, use cases, and comparisons", () => {
    const paths = sitemapEntries().map((entry) => entry.path);
    expect(paths).toContain("/");
    expect(paths).toContain("/integrations");
    expect(paths).toContain("/use-cases");
    expect(paths).toContain("/compare");
    expect(paths).toContain("/compare.md");
    expect(paths).toContain("/compare/grogbot-vs-openclaw");
    expect(paths).toContain("/compare/md/grogbot-vs-openclaw");
    expect(paths).toContain("/press");
    expect(paths).toContain("/press.md");
    expect(paths).toContain("/integrations/gmail");
    expect(paths).toContain("/integrations/datafast");
    expect(paths).toContain("/use-cases/indie-stack");
    expect(
      paths.some((path) => path.startsWith("/integrations/category/")),
    ).toBe(true);
    expect(paths).toContain("/llms.txt");
    expect(paths).toContain("/mcp");
    expect(paths.length).toBe(
      6 +
        DISCOVERY_SITEMAP_PATHS.length +
        integrationCategories().length +
        INTEGRATIONS.length +
        USE_CASES.length +
        COMPARISONS.length * 2,
    );
  });

  it("emits xml with canonical grogbot.com urls", () => {
    const xml = sitemapXml();
    expect(xml).toContain(canonicalUrl("/integrations/postiz"));
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
  });
});

describe("llms discovery", () => {
  it("names Grogbot and points agents at MCP plus use cases", () => {
    const txt = landingLlmsTxt();
    expect(txt.startsWith("# Grogbot\n")).toBe(true);
    expect(txt).toContain("/mcp");
    expect(txt).toContain("/identity.json");
    expect(txt).toContain("/use-cases/");
    expect(txt).toContain("/compare/");
    expect(txt).toContain("/compare.md");
    expect(txt).toContain("/press");
  });
});
