import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { FAQS, JOBS, SOURCE_REPO } from "../lib/copy";
import { HOME_INTEGRATIONS, HOME_USE_CASES } from "../lib/teasers";
import { OfficePreview } from "./OfficePreview";
import { SiteChrome } from "./SiteChrome";

export function Landing(props: { startUrl: string }) {
  return (
    <SiteChrome startUrl={props.startUrl}>
      <main id="top">
        <section className="hero">
          <p className="kicker">Grogbot</p>
          <h1>Create a Bot, message it, grant access as needed.</h1>
          <p className="lede">
            No workflow builder. There isn’t anything to learn — it’s like
            bringing on a coworker.
          </p>
          <div className="row">
            <a className="btn" href={props.startUrl}>
              Get started
            </a>
            <a
              className="btn ghost"
              href={SOURCE_REPO}
              target="_blank"
              rel="noreferrer"
            >
              Self-host the repo
            </a>
          </div>
        </section>

        <OfficePreview />

        <section id="how" className="band">
          <p className="kicker">How it works</p>
          <h2>Talk first. Configure only when they hit a wall.</h2>
          <div className="cards">
            <article className="card">
              <p className="kicker">1</p>
              <h3>Message Bots like teammates</h3>
              <p>
                Each Bot is a contact: name, optional job, description, avatar,
                one thread. The transcript is the audit log — tools, files, and
                approvals inline.
              </p>
            </article>
            <article className="card">
              <p className="kicker">2</p>
              <h3>The computer is a pane you can ignore</h3>
              <p>
                Open it from the thread header. Take over for a password, 2FA,
                or payment — on the computer, not in chat. Work continues if you
                close the pane.
              </p>
            </article>
            <article className="card">
              <p className="kicker">3</p>
              <h3>Default computer, private when it matters</h3>
              <p>
                Teammates share the workspace default computer — files and
                logins, one mouse. Create a new computer when a Bot should keep
                its own logins.
              </p>
            </article>
          </div>
        </section>

        <JobsShowcase />

        <section className="band">
          <p className="kicker">Integrations</p>
          <h2>Composio for the giants. A computer for the indie stack.</h2>
          <p className="lede tight">
            Gmail, Slack, GitHub, Typefully via Composio. DataFast, Postiz, and
            Post Bridge on the Bot&apos;s computer — Marc Lou, Jack Friks, and
            the rest of Twitter, no Zapier cartoon.
          </p>
          <div className="chips">
            {HOME_INTEGRATIONS.map((item) => (
              <Link
                key={item.slug}
                className="chip"
                to="/integrations/$slug"
                params={{ slug: item.slug }}
              >
                {item.name}
              </Link>
            ))}
            <Link className="chip" to="/integrations">
              All integrations
            </Link>
          </div>
        </section>

        <section className="band">
          <p className="kicker">Use cases</p>
          <h2>The jobs people actually hire.</h2>
          <div className="chips">
            {HOME_USE_CASES.map((item) => (
              <Link
                key={item.slug}
                className="chip"
                to="/use-cases/$slug"
                params={{ slug: item.slug }}
              >
                {item.title}
              </Link>
            ))}
            <Link className="chip" to="/use-cases">
              All use cases
            </Link>
          </div>
        </section>

        <section className="band split">
          <div>
            <p className="kicker">Yours</p>
            <h2>Bring your own keys. Keep the team in Postgres.</h2>
            <p className="lede tight">
              One actor per Bot. Shared context and skills for the workspace.
              Optional Composio for Gmail, Slack, and GitHub. First task can
              still be “summarize this file” with no connector.
            </p>
          </div>
          <ul className="points">
            <li>Web first — desktop is the same office in a window</li>
            <li>oRPC contract for web, desktop, and mobile later</li>
            <li>
              Docker locally, E2B hosted, desktop only on a trusted machine
            </li>
            <li>No marketplace, no orchestration canvas, no Discord UI</li>
          </ul>
        </section>

        <section id="faq" className="band">
          <p className="kicker">FAQ</p>
          <h2>Straight answers</h2>
          <div className="faqs">
            {FAQS.map((item) => (
              <details key={item.q} className="faq">
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
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
          <a className="btn" href={props.startUrl}>
            Get started
          </a>
        </section>
      </main>
    </SiteChrome>
  );
}

function JobsShowcase() {
  const first: (typeof JOBS)[number] = JOBS[0] ?? {
    title: "Sales Outbound",
    slug: "sales-outbound",
    pitch:
      "Draft follow-ups from the account list. Do not send mail. Ask before anything leaves the thread.",
  };
  const [active, setActive] = useState<(typeof JOBS)[number]>(first);

  return (
    <section id="jobs" className="band">
      <p className="kicker">Give each Bot a job</p>
      <h2>Hire for the work, not a template gallery.</h2>
      <p className="lede tight">
        These are first-teammate suggestions. A Bot is a person in the sidebar —
        job title optional — not a workflow you drag together.
      </p>
      <div className="chips">
        {JOBS.map((job) => (
          <button
            key={job.title}
            type="button"
            className={`chip${job.title === active.title ? " on" : ""}`}
            onClick={() => setActive(job)}
          >
            {job.title}
          </button>
        ))}
      </div>
      <p className="job-pitch">{active.pitch}</p>
      <p className="job-more">
        <Link to="/use-cases/$slug" params={{ slug: active.slug }}>
          How this job works
        </Link>
      </p>
    </section>
  );
}
