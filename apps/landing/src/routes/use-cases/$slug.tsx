import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { BulletList, FaqList } from "../../components/ContentBits";
import {
  DemoThread,
  demoForUseCase,
  FirstMessageThread,
} from "../../components/DemoThread";
import { Breadcrumbs, SiteChrome } from "../../components/SiteChrome";
import { getUseCase, relatedUseCases } from "../../data/use-cases";
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
  const related = relatedUseCases(item, 4);
  const demo = demoForUseCase(item.slug);

  return (
    <SiteChrome startUrl={startUrl}>
      <main className="job-page">
        <Breadcrumbs
          items={[
            { label: "Home", to: "/" },
            { label: "Use cases", to: "/use-cases" },
            { label: item.title },
          ]}
        />
        <section className="hero job-hero">
          <p className="kicker">{item.kicker}</p>
          <h1>{item.title}</h1>
          <p className="lede">{item.lede}</p>
          <p className="thesis">{item.problem}</p>
          <div className="row">
            <a className="btn lg" href={startUrl}>
              Get started
            </a>
          </div>
        </section>

        <section className="job-split" aria-label="How the job works">
          <article className="job-panel">
            <h3>What the Bot does</h3>
            <BulletList items={item.whatTheBotDoes} />
          </article>
          <article className="job-panel">
            <h3>Never without you</h3>
            <BulletList items={item.neverWithoutApproval} />
          </article>
        </section>

        <section className="job-handoff">
          <div>
            <h2>First message</h2>
            <p className="lede tight">
              Talk first. The first message is a real task — not a template to
              configure.
            </p>
          </div>
          {demo ? (
            <DemoThread demo={demo} more={false} />
          ) : (
            <FirstMessageThread name={item.title} prompt={item.firstMessage} />
          )}
        </section>

        {integrations.length ? (
          <section className="band catalog">
            <h2>Tools this job uses</h2>
            <p className="lede tight">
              Connect them when the Bot hits a wall. Nothing goes live until
              you say so.
            </p>
            <div className="chips">
              {integrations.map((row) => (
                <Link
                  key={row.slug}
                  className="chip has-icon"
                  to="/integrations/$slug"
                  params={{ slug: row.slug }}
                >
                  {row.logo ? (
                    <img
                      className="chip-logo"
                      src={row.logo}
                      alt=""
                      width={18}
                      height={18}
                      decoding="async"
                    />
                  ) : null}
                  {row.name}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section id="faq" className="band faq-band">
          <h2>FAQ</h2>
          <FaqList items={item.faqs} />
        </section>

        <section className="band">
          <p className="kicker">Also hire</p>
          <h2>Other jobs</h2>
          <p className="lede tight">
            Hire for the work. Each Bot is a person in the sidebar.
          </p>
          <div className="cards use-cards job-related">
            {related.map((other) => (
              <article key={other.slug} className="card">
                <p className="kicker">{other.kicker}</p>
                <h2>
                  <Link to="/use-cases/$slug" params={{ slug: other.slug }}>
                    {other.title}
                  </Link>
                </h2>
                <p>{other.lede}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="cta">
          <p className="kicker">Hire the first one</p>
          <h2>Meet your first Bot.</h2>
          <p className="lede tight">
            Name, optional job, how it should work. Open the thread. The first
            message is a real task.
          </p>
          <a className="btn lg" href={startUrl}>
            Get started
          </a>
        </section>
      </main>
    </SiteChrome>
  );
}
