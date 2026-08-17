import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { BulletList, FaqList } from "../../components/ContentBits";
import { Breadcrumbs, SiteChrome } from "../../components/SiteChrome";
import { getComparison, relatedComparisons } from "../../data/comparisons";
import { appLoginUrl } from "../../lib/app-url";
import { comparisonJsonLd } from "../../lib/json-ld";
import { seoHead } from "../../lib/site";

export const Route = createFileRoute("/compare/$slug")({
  loader: ({ params }) => {
    const item = getComparison(params.slug);
    if (!item) throw notFound();
    return { startUrl: appLoginUrl(), item };
  },
  head: ({ loaderData }) => {
    if (!loaderData?.item) return {};
    const { item } = loaderData;
    return seoHead({
      title: item.title,
      description: item.answer.slice(0, 160),
      path: `/compare/${item.slug}`,
      markdownPath: `/compare/md/${item.slug}`,
      jsonLd: comparisonJsonLd(item),
    });
  },
  component: ComparePage,
});

function ComparePage() {
  const { startUrl, item } = Route.useLoaderData();
  const related = relatedComparisons(item, 4);

  return (
    <SiteChrome startUrl={startUrl}>
      <main>
        <Breadcrumbs
          items={[
            { label: "Home", to: "/" },
            { label: "Compare", to: "/compare" },
            { label: item.title },
          ]}
        />
        <section className="hero !py-8 sm:!py-12 sm:!pb-10">
          <p className="kicker">{item.kicker}</p>
          <h1 className="!my-2 !mb-4">{item.title}</h1>
          <p className="lede !mb-3 !text-xl">{item.question}</p>
          <p className="answer-box">{item.answer}</p>
          <p className="thesis !mb-7 max-w-xl">{item.description}</p>
          <div className="row mt-1">
            <a className="btn lg" href={startUrl}>
              Get started
            </a>
            <a className="btn ghost lg" href={`/compare/md/${item.slug}`}>
              Markdown
            </a>
          </div>
        </section>

        <section
          className="py-2 pb-10"
          aria-label={`${item.themName} vs Grogbot`}
        >
          <h2 className="!mb-4">{item.themName} vs Grogbot</h2>
          <div className="compare-table-wrap">
            <table className="compare-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>{item.themName}</th>
                  <th>Grogbot</th>
                </tr>
              </thead>
              <tbody>
                {item.rows.map((row) => (
                  <tr key={row.feature}>
                    <th scope="row">{row.feature}</th>
                    <td>{row.them}</td>
                    <td>{row.us}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section
          className="grid grid-cols-1 gap-4 py-2 pb-9 sm:gap-3.5 sm:pb-14 md:grid-cols-2"
          aria-label="When to use which"
        >
          <article className="rounded-3xl bg-[#141414] px-[22px] py-[22px] pb-6 sm:px-7 sm:py-7 sm:pb-8">
            <h3 className="!mb-3 !text-[22px] tracking-[-0.03em]">
              When to use {item.themName}
            </h3>
            <div className="[&_.points]:pt-1 [&_.points]:text-[15px] [&_.points]:leading-relaxed">
              <BulletList items={item.whenThem} />
            </div>
          </article>
          <article className="rounded-3xl bg-[#101010] px-[22px] py-[22px] pb-6 sm:px-7 sm:py-7 sm:pb-8">
            <h3 className="!mb-3 !text-[22px] tracking-[-0.03em]">
              When to use Grogbot
            </h3>
            <div className="[&_.points]:pt-1 [&_.points]:text-[15px] [&_.points]:leading-relaxed">
              <BulletList items={item.whenUs} />
            </div>
          </article>
        </section>

        {item.options?.length ? (
          <section className="py-2 pb-12">
            <p className="kicker">Options</p>
            <h2>How the field splits</h2>
            <div className="mt-2 grid grid-cols-1 gap-3.5 md:grid-cols-2">
              {item.options.map((option) => (
                <article key={option.name} className="card flex flex-col">
                  <h2 className="!mb-2 !text-xl">
                    {option.slug ? (
                      <Link
                        className="no-underline hover:underline"
                        to="/compare/$slug"
                        params={{ slug: option.slug }}
                      >
                        {option.name}
                      </Link>
                    ) : (
                      option.name
                    )}
                  </h2>
                  <p>{option.verdict}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section id="faq" className="faq-band !py-6 !pb-4">
          <h2>FAQ</h2>
          <FaqList items={item.faqs} />
        </section>

        <section className="py-2 pb-12">
          <p className="kicker">Also asked</p>
          <h2>Related comparisons</h2>
          <div className="mt-2 grid grid-cols-1 gap-3.5 md:grid-cols-2">
            {related.map((other) => (
              <article key={other.slug} className="card flex flex-col">
                <p className="kicker">{other.kicker}</p>
                <h2 className="!mb-2 !text-xl">
                  <Link
                    className="no-underline hover:underline"
                    to="/compare/$slug"
                    params={{ slug: other.slug }}
                  >
                    {other.title}
                  </Link>
                </h2>
                <p>{other.answer}</p>
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
