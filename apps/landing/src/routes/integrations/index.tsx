import { createFileRoute, Link } from "@tanstack/react-router";
import { Breadcrumbs, SiteChrome } from "../../components/SiteChrome";
import { IntegrationGrid } from "../../components/IntegrationCard";
import { appLoginUrl } from "../../lib/app-url";
import {
  computerIntegrations,
  featuredIntegrations,
  integrationCategories,
  searchIntegrations,
} from "../../lib/integrations";
import { breadcrumbJsonLd, itemListJsonLd } from "../../lib/json-ld";
import { seoHead } from "../../lib/site";

type Search = { q?: string };

export const Route = createFileRoute("/integrations/")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  loaderDeps: ({ search }) => ({ q: search.q ?? "" }),
  loader: ({ deps }) => {
    const q = deps.q.trim();
    const matches = q ? searchIntegrations(q).slice(0, 80) : [];
    return {
      startUrl: appLoginUrl(),
      q,
      matches,
      featured: featuredIntegrations(),
      indie: computerIntegrations(),
      categories: integrationCategories(),
      popular: searchIntegrations("").filter((item) => item.kind === "composio").slice(0, 24),
    };
  },
  head: ({ loaderData }) => {
    const q = loaderData?.q;
    return seoHead({
      title: q ? `Integrations matching “${q}”` : "Integrations",
      description:
        "Grogbot connects through Composio (Gmail, Slack, GitHub, Typefully…) and a real computer for indie tools like DataFast, Postiz, and Post Bridge.",
      path: "/integrations",
      jsonLd: [
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Integrations", path: "/integrations" },
        ]),
        itemListJsonLd(
          "Grogbot integrations",
          "/integrations",
          (loaderData?.featured ?? []).map((item) => ({
            name: item.name,
            path: `/integrations/${item.slug}`,
          })),
        ),
      ],
    });
  },
  component: IntegrationsIndex,
});

function IntegrationsIndex() {
  const { startUrl, q, matches, featured, indie, categories, popular } =
    Route.useLoaderData();

  return (
    <SiteChrome startUrl={startUrl}>
      <main>
        <Breadcrumbs
          items={[{ label: "Home", to: "/" }, { label: "Integrations" }]}
        />
        <section className="hero">
          <p className="kicker">Integrations</p>
          <h1>Composio for the giants. A computer for everyone else.</h1>
          <p className="lede">
            Optional Composio for Gmail, Slack, GitHub, Typefully, and a thousand
            other toolkits. DataFast, Postiz, Post Bridge, and the rest of the
            indie stack run on the Bot&apos;s computer until a connector exists.
          </p>
          <form className="search-form" method="get" action="/integrations">
            <label className="sr-only" htmlFor="q">
              Search integrations
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Search Gmail, DataFast, Postiz…"
            />
            <button className="btn" type="submit">
              Search
            </button>
          </form>
        </section>

        {q ? (
          <section className="band">
            <h2>
              {matches.length} match{matches.length === 1 ? "" : "es"} for “{q}”
            </h2>
            <IntegrationGrid items={matches} />
          </section>
        ) : (
          <>
            <section className="band">
              <h2>Indie tools on the computer</h2>
              <p className="lede tight">
                Marc Lou, Jack Friks, Nevo David — products Composio does not
                list. The Bot still works in the dashboard, then stops before
                publish.
              </p>
              <IntegrationGrid items={indie} />
            </section>
            <section className="band">
              <h2>Featured Composio toolkits</h2>
              <IntegrationGrid
                items={featured.filter((item) => item.kind === "composio")}
              />
            </section>
            <section className="band">
              <h2>Browse by category</h2>
              <div className="chips">
                {categories.slice(0, 24).map((item) => (
                  <Link
                    key={item.slug}
                    className="chip"
                    to="/integrations/category/$category"
                    params={{ category: item.slug }}
                  >
                    {item.name}
                    <span className="chip-count">{item.count}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="band">
              <h2>Popular connectors</h2>
              <IntegrationGrid items={popular} />
            </section>
          </>
        )}

        <section className="cta">
          <a className="btn" href={startUrl}>
            Get started
          </a>
        </section>
      </main>
    </SiteChrome>
  );
}
