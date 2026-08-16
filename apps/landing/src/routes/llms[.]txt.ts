import { createFileRoute } from "@tanstack/react-router";
import { USE_CASES } from "../data/use-cases";
import { computerIntegrations, featuredIntegrations } from "../lib/integrations";
import { canonicalUrl, DEFAULT_DESCRIPTION, landingOrigin } from "../lib/site";

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: () => {
        const featured = featuredIntegrations()
          .map((item) => `- [${item.name}](${canonicalUrl(`/integrations/${item.slug}`)}): ${item.description}`)
          .join("\n");
        const indie = computerIntegrations()
          .map((item) => `- [${item.name}](${canonicalUrl(`/integrations/${item.slug}`)}) (${item.founder})`)
          .join("\n");
        const jobs = USE_CASES.map(
          (item) => `- [${item.title}](${canonicalUrl(`/use-cases/${item.slug}`)}): ${item.lede}`,
        ).join("\n");
        const body = `# Grogbot

> ${DEFAULT_DESCRIPTION}

Grogbot is a self-hostable Grok Bot (fair-code): named teammates with a real computer. Message them like people. Optional Composio for Gmail, Slack, GitHub, and 1,000+ toolkits. Indie products such as DataFast, Postiz, and Post Bridge run on the computer until a connector exists. Bring your own model keys. Self-host for your organization is free; hosted Grogbot for others is grogbot.com.

- Home: ${landingOrigin()}
- Integrations: ${canonicalUrl("/integrations")}
- Use cases: ${canonicalUrl("/use-cases")}
- Sitemap: ${canonicalUrl("/sitemap.xml")}
- Source: https://github.com/muhajirdev/grogbot

## Use cases

${jobs}

## Indie / computer integrations

${indie}

## Featured integrations

${featured}
`;
        return new Response(body, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
