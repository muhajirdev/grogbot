import {
  PRESS_ASSETS,
  PRESS_BOILERPLATE,
  PRESS_COLORS,
  PRESS_NAMES_NO,
  PRESS_NAMES_OK,
  PRESS_VOICE,
  pressFacts,
} from "@grogbot/seo";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { OfficePreview } from "../../components/OfficePreview";
import { Breadcrumbs, SiteChrome } from "../../components/SiteChrome";
import { appLoginUrl } from "../../lib/app-url";
import { SOURCE_REPO } from "../../lib/copy";
import { LANDING_ORIGINS } from "../../lib/discovery";
import { breadcrumbJsonLd } from "../../lib/json-ld";
import { seoHead } from "../../lib/site";

export const Route = createFileRoute("/press/")({
  loader: () => ({
    startUrl: appLoginUrl(),
    facts: pressFacts(LANDING_ORIGINS),
  }),
  head: () =>
    seoHead({
      title: "Press kit",
      description:
        "Grogbot logos, naming rules, and boilerplate for journalists and partners.",
      path: "/press",
      jsonLd: [
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Press kit", path: "/press" },
        ]),
      ],
    }),
  component: PressPage,
});

function PressPage() {
  const { startUrl, facts } = Route.useLoaderData();
  return (
    <SiteChrome startUrl={startUrl}>
      <main>
        <Breadcrumbs
          items={[{ label: "Home", to: "/" }, { label: "Press kit" }]}
        />
        <section className="hero">
          <p className="kicker">Press kit</p>
          <h1>Logos, naming, and boilerplate.</h1>
          <p className="lede">
            Use this when you write about Grogbot. The mark is the pink mascot.
            The name is one word, capital G.
          </p>
          <div className="row">
            <a className="btn" href="/press/grogbot-mark.svg" download>
              Download mark
            </a>
            <a className="btn ghost" href="/press.md">
              Markdown
            </a>
          </div>
        </section>

        <section className="band">
          <p className="kicker">Boilerplate</p>
          <h2>Copy this.</h2>
          <div className="boilerplate-list">
            {PRESS_BOILERPLATE.map((item) => (
              <CopyBlock key={item.id} label={item.label} text={item.text} />
            ))}
          </div>
        </section>

        <section className="band">
          <p className="kicker">Facts</p>
          <h2>What to print.</h2>
          <dl className="fact-list">
            {facts.map((fact) => (
              <div key={fact.label} className="fact">
                <dt>{fact.label}</dt>
                <dd>
                  {fact.href ? (
                    <a href={fact.href} target="_blank" rel="noreferrer">
                      {fact.value}
                    </a>
                  ) : (
                    fact.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="band">
          <p className="kicker">Name</p>
          <h2>Grogbot. Not Grokbot.</h2>
          <div className="do-dont">
            <article className="card">
              <h3>Use</h3>
              <ul className="points">
                {PRESS_NAMES_OK.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="card">
              <h3>Do not use</h3>
              <ul className="points">
                {PRESS_NAMES_NO.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
          <ul className="points">
            {PRESS_VOICE.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="band">
          <p className="kicker">Logos</p>
          <h2>SVG only. Do not recolor the face.</h2>
          <p className="lede tight">
            Keep the mascot pink. Do not add drop shadows, outlines, or a
            photoreal head. Wordmark type is the system UI stack used on the
            site.
          </p>
          <div className="logo-grid">
            {PRESS_ASSETS.map((asset) => (
              <article
                key={asset.file}
                className={`logo-tile${asset.file.includes("light") ? " light" : ""}`}
              >
                <div className="logo-stage">
                  <img
                    src={`/press/${asset.file}`}
                    alt={asset.label}
                    className={
                      asset.file.includes("lockup")
                        ? "logo-lockup"
                        : "logo-mark"
                    }
                  />
                </div>
                <p className="kicker">{asset.label}</p>
                <p>{asset.note}</p>
                <a
                  className="btn ghost"
                  href={`/press/${asset.file}`}
                  download={asset.file}
                >
                  Download SVG
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="band">
          <p className="kicker">Color</p>
          <h2>Four inks.</h2>
          <div className="swatches">
            {PRESS_COLORS.map((color) => (
              <article key={color.hex} className="card swatch">
                <div
                  className="swatch-chip"
                  style={{ background: color.hex }}
                />
                <h3>{color.name}</h3>
                <p>
                  {color.hex}
                  <br />
                  {color.note}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="band">
          <p className="kicker">Product</p>
          <h2>The office is a messaging app.</h2>
          <p className="lede tight">
            Sidebar of Bots, one thread, computer pane you can ignore. Use this
            shot — not private workspace threads.
          </p>
          <OfficePreview />
        </section>

        <section className="cta">
          <p className="kicker">Contact</p>
          <h2>GitHub is the inbox.</h2>
          <p className="lede tight">
            No invented press email, pricing page, or Ultra paywall. Source and
            issues live on GitHub. Machine-readable naming is{" "}
            <a href="/brand.txt">/brand.txt</a>.
          </p>
          <div className="row">
            <a
              className="btn"
              href={SOURCE_REPO}
              target="_blank"
              rel="noreferrer"
            >
              {SOURCE_REPO.replace("https://", "")}
            </a>
            <a className="btn ghost" href={startUrl}>
              Get started
            </a>
          </div>
        </section>
      </main>
    </SiteChrome>
  );
}

function CopyBlock(props: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <article className="boilerplate">
      <div className="boilerplate-head">
        <p className="kicker">{props.label}</p>
        <button
          type="button"
          className="btn ghost"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(props.text);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1600);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre>{props.text}</pre>
    </article>
  );
}
