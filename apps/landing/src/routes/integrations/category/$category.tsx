import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { IntegrationGrid } from "../../../components/IntegrationCard";
import { Breadcrumbs, SiteChrome } from "../../../components/SiteChrome";
import { appLoginUrl } from "../../../lib/app-url";
import {
  getCategory,
  integrationCategories,
  integrationsInCategory,
} from "../../../lib/integrations";
import { breadcrumbJsonLd, itemListJsonLd } from "../../../lib/json-ld";
import { seoHead } from "../../../lib/site";

export const Route = createFileRoute("/integrations/category/$category")({
  loader: ({ params }) => {
    const category = getCategory(params.category);
    if (!category) throw notFound();
    const items = integrationsInCategory(category.slug);
    return { startUrl: appLoginUrl(), category, items };
  },
  head: ({ loaderData }) => {
    if (!loaderData?.category) return {};
    const { category, items } = loaderData;
    return seoHead({
      title: `${category.name} integrations`,
      description: `Grogbot teammates for ${category.name}: ${category.count} tools via Composio or a real computer. No workflow builder.`,
      path: `/integrations/category/${category.slug}`,
      jsonLd: [
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Integrations", path: "/integrations" },
          {
            name: category.name,
            path: `/integrations/category/${category.slug}`,
          },
        ]),
        itemListJsonLd(
          `${category.name} integrations`,
          `/integrations/category/${category.slug}`,
          items.map((item) => ({
            name: item.name,
            path: `/integrations/${item.slug}`,
          })),
        ),
      ],
    });
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { startUrl, category, items } = Route.useLoaderData();
  const others = integrationCategories()
    .filter((item) => item.slug !== category.slug)
    .slice(0, 8);

  return (
    <SiteChrome startUrl={startUrl}>
      <main>
        <Breadcrumbs
          items={[
            { label: "Home", to: "/" },
            { label: "Integrations", to: "/integrations" },
            { label: category.name },
          ]}
        />
        <section className="hero">
          <p className="kicker">{category.count} tools</p>
          <h1>{category.name} integrations</h1>
          <p className="lede">
            Composio connectors when they exist. A real computer when they
            don&apos;t. The Bot still asks before anything goes live.
          </p>
        </section>
        <section className="band">
          <IntegrationGrid items={items} />
        </section>
        <section className="band">
          <h2>Other categories</h2>
          <div className="chips">
            {others.map((item) => (
              <Link
                key={item.slug}
                className="chip"
                to="/integrations/category/$category"
                params={{ category: item.slug }}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </SiteChrome>
  );
}
