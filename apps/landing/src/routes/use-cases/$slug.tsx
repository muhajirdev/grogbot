import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { BulletList, FaqList } from "../../components/ContentBits";
import { IntegrationGrid } from "../../components/IntegrationCard";
import { Breadcrumbs, SiteChrome } from "../../components/SiteChrome";
import { getUseCase, USE_CASES } from "../../data/use-cases";
import { appLoginUrl } from "../../lib/app-url";
import { getIntegration } from "../../lib/integrations";
import { useCaseJsonLd } from "../../lib/json-ld";
import { seoHead } from "../../lib/site";

export const Route = createFileRoute("/use-cases/$slug")({
  loader: ({ params }) => {
    const item = getUseCase(params.slug);
    if (!item) throw notFound();
    return { startUrl: appLoginUrl(), item };
  },
  head: ({ loaderData }) => {
    if (!loaderData?.item) return {};
    const { item } = loaderData;
    return seoHead({
      title: `${item.title} with Grogbot`,
      description: item.lede,
      path: `/use-cases/${item.slug}`,
      jsonLd: useCaseJsonLd(item),
    });
  },
  component: UseCasePage,
});

function UseCasePage() {
  const { startUrl, item } = Route.useLoaderData();
  const integrations = item.integrationSlugs
    .map((slug) => getIntegration(slug))
    .filter((row) => row !== undefined);
  const related = USE_CASES.filter((other) => other.slug !== item.slug).slice(
    0,
    4,
  );

  return (
    <SiteChrome startUrl={startUrl}>
      <main>
        <Breadcrumbs
          items={[
            { label: "Home", to: "/" },
            { label: "Use cases", to: "/use-cases" },
            { label: item.title },
          ]}
        />
        <section className="hero">
          <p className="kicker">{item.kicker}</p>
          <h1>{item.title} with a Grogbot teammate</h1>
          <p className="lede">{item.lede}</p>
          <a className="btn" href={startUrl}>
            Get started
          </a>
        </section>

        <section className="band">
          <h2>The job</h2>
          <p className="lede tight">{item.problem}</p>
          <h3>What the Bot does</h3>
          <BulletList items={item.whatTheBotDoes} />
          <h3>Never without you</h3>
          <BulletList items={item.neverWithoutApproval} />
        </section>

        <section className="band">
          <h2>First message</h2>
          <p className="prompt">{item.firstMessage}</p>
        </section>

        {integrations.length ? (
          <section className="band">
            <h2>Integrations this job uses</h2>
            <IntegrationGrid items={integrations} />
          </section>
        ) : null}

        <section id="faq" className="band">
          <h2>FAQ</h2>
          <FaqList items={item.faqs} />
        </section>

        <section className="band">
          <h2>Other jobs</h2>
          <ul className="link-list">
            {related.map((other) => (
              <li key={other.slug}>
                <Link to="/use-cases/$slug" params={{ slug: other.slug }}>
                  {other.title}
                </Link>
                <span className="muted"> — {other.lede}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </SiteChrome>
  );
}
