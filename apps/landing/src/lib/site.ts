import { CLOUD_LANDING_ORIGIN } from "@grogbot/contracts";

export const SITE_NAME = "Grogbot";
export const DEFAULT_TITLE = "Grogbot — Like Grok Bot, for the team.";
export const DEFAULT_DESCRIPTION =
  "If OpenClaw is for your personal use, Grogbot is for the office. Named teammates, a shared computer, open source. Self-host for your team.";

export function landingOrigin(): string {
  return CLOUD_LANDING_ORIGIN;
}

export function canonicalUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") return landingOrigin();
  return `${landingOrigin()}${normalized.replace(/\/$/, "")}`;
}

export type SeoInput = {
  title: string;
  description: string;
  path: string;
  jsonLd?: unknown[];
  markdownPath?: string;
};

export function seoHead(input: SeoInput): {
  meta: Array<Record<string, string>>;
  links: Array<{ rel: string; href: string; type?: string }>;
  scripts?: Array<{ type: string; children: string }>;
} {
  const url = canonicalUrl(input.path);
  const title = input.title.includes(SITE_NAME)
    ? input.title
    : `${input.title} — ${SITE_NAME}`;
  const description = input.description.slice(0, 160);
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { property: "og:site_name", content: SITE_NAME },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [
      { rel: "canonical", href: url },
      {
        rel: "describedby",
        href: canonicalUrl("/llms.txt"),
        type: "text/plain",
      },
      {
        rel: "alternate",
        href: canonicalUrl(input.markdownPath ?? "/index.md"),
        type: "text/markdown",
      },
    ],
    scripts: input.jsonLd?.map((node) => ({
      type: "application/ld+json",
      children: JSON.stringify(node),
    })),
  };
}
