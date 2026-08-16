import { useState } from "react";
import {
  FAQS,
  FEATURES,
  type FeatureId,
  HERO,
  HERO_TICKS,
  JOBS,
  SOURCE_REPO,
  STEPS,
} from "../lib/copy";
import { FeatureStage, OfficePreview } from "./ProductPreviews";

export function Landing(props: { startUrl: string }) {
  return (
    <div className="page">
      <header className="nav">
        <a className="brand" href="#top">
          <span className="mark" aria-hidden />
          Grogbot
        </a>
        <nav className="nav-links ui" aria-label="Page">
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <a href="#jobs">Jobs</a>
          <a href="#faq">FAQ</a>
          <a href={SOURCE_REPO} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a className="btn" href={props.startUrl}>
            Get started
          </a>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <p className="kicker">{HERO.kicker}</p>
          <h1>{HERO.title}</h1>
          <p className="lede">{HERO.lede}</p>
          <div className="row">
            <a className="btn" href={props.startUrl}>
              Meet a teammate
            </a>
            <a
              className="btn ghost"
              href={SOURCE_REPO}
              target="_blank"
              rel="noreferrer"
            >
              Read the source
            </a>
          </div>
          <ul className="ticks ui">
            {HERO_TICKS.map((tick) => (
              <li key={tick}>{tick}</li>
            ))}
          </ul>
        </section>

        <OfficePreview />

        <section id="how" className="band">
          <p className="kicker">Live in three steps</p>
          <h2>Talk first. Configure only when they hit a wall.</h2>
          <div className="cards">
            {STEPS.map((step) => (
              <article key={step.n} className="card">
                <p className="kicker">{step.n}</p>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <Features />

        <JobsShowcase />

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
          <h2>Your own team of AI bots, in a chat app.</h2>
          <p className="lede tight">
            Name, job, how it should work. Open the thread. The first message is
            a real task.
          </p>
          <a className="btn" href={props.startUrl}>
            Get started
          </a>
        </section>
      </main>

      <footer className="foot ui">
        <span>Grogbot — Grok, then grog. MIT.</span>
        <a href={SOURCE_REPO} target="_blank" rel="noreferrer">
          GitHub
        </a>
      </footer>
    </div>
  );
}

function Features() {
  const [activeId, setActiveId] = useState<FeatureId>("teammates");

  return (
    <section id="features" className="band split">
      <div>
        <p className="kicker">Everything in the box</p>
        <h2>A messaging app of teammates with hands.</h2>
        <div className="feature-list">
          {FEATURES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`feature${item.id === activeId ? " on" : ""}`}
              onClick={() => setActiveId(item.id)}
            >
              <strong>{item.title}</strong>
              <span>{item.body}</span>
            </button>
          ))}
        </div>
      </div>
      <FeatureStage id={activeId} />
    </section>
  );
}

function JobsShowcase() {
  const first = JOBS[0] ?? {
    title: "Sales Outbound",
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
        not a workflow you drag together.
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
    </section>
  );
}
