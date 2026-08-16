import { createFileRoute, Link } from "@tanstack/react-router";
import { Breadcrumbs, SiteChrome } from "../../components/SiteChrome";
import { USE_CASES } from "../../data/use-cases";
import { appLoginUrl } from "../../lib/app-url";
import { breadcrumbJsonLd, itemListJsonLd } from "../../lib/json-ld";
import { seoHead } from "../../lib/site";

export const Route = createFileRoute("/use-cases/")({
  loader: () => ({ startUrl: appLoginUrl(), items: USE_CASES }),
  head: () =>
    seoHead({
      title: "Use cases",
      description:
        "Hire a Grogbot teammate for sales, social, analytics, inbox, and shipping. No workflow builder.",
      path: "/use-cases",
      jsonLd: [
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Use cases", path: "/use-cases" },
        ]),
        itemListJsonLd(
          "Grogbot use cases",
          "/use-cases",
          USE_CASES.map((item) => ({
            name: item.title,
            path: `/use-cases/${item.slug}`,
          })),
        ),
      ],
    }),
  component: UseCasesIndex,
});

function UseCasesIndex() {
  const { startUrl, items } = Route.useLoaderData();
  return (
    <SiteChrome startUrl={startUrl}>
      <main className="job-index">
        <Breadcrumbs
          items={[{ label: "Home", to: "/" }, { label: "Use cases" }]}
        />
        <section className="hero job-hero">
          <p className="kicker">Use cases</p>
          <h1>Hire for the work, not a template gallery.</h1>
          <p className="lede">
            Each Bot is a person in the sidebar. Job title optional. These are
            the jobs founders actually message first.
          </p>
        </section>
        <section className="band">
          <div className="cards use-cards">
            {items.map((item) => (
              <article key={item.slug} className="card">
                <p className="kicker">{item.kicker}</p>
                <h2>
                  <Link to="/use-cases/$slug" params={{ slug: item.slug }}>
                    {item.title}
                  </Link>
                </h2>
                <p>{item.lede}</p>
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
