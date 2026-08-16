import { useState } from "react";
import { FAQS, JOBS, SOURCE_REPO } from "../lib/copy";

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
          <p className="kicker">Open-source Grok Bot</p>
          <h1>AI teammates you host.</h1>
          <p className="lede">
            Create a Bot, message it, grant access as needed. No workflow
            builder. There isn’t anything to learn — it’s like bringing on a
            coworker.
          </p>
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
                Each Bot is a contact: name, job, description, avatar, one
                thread. The transcript is the audit log — tools, files, and
                approvals inline.
              </p>
            </article>
            <article className="card">
              <p className="kicker">2</p>
              <h3>The computer is a pane you can ignore</h3>
              <p>
                They sign in to your tools the way you would. Take over for a
                password, 2FA, or payment — on the computer, not in chat. Work
                continues if you close the pane.
              </p>
            </article>
            <article className="card">
              <p className="kicker">3</p>
              <h3>Desk by default, private when it matters</h3>
              <p>
                Teammates share the workspace Desk — files and logins, one
                mouse. Create a new computer when a Bot should keep its own
                logins.
              </p>
            </article>
          </div>
        </section>

        <JobsShowcase />

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
          <ul className="points ui">
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

function OfficePreview() {
  return (
    <section className="preview-wrap" aria-label="Office preview">
      <div className="preview" aria-hidden>
        <aside className="preview-side">
          <div className="preview-brand">Grogbot</div>
          <PreviewBot name="Piper" title="Product performance" on />
          <PreviewBot name="Scout" title="Talent Scout" />
          <PreviewBot name="Ledger" title="Expense Manager" />
        </aside>
        <div className="preview-thread">
          <div className="preview-head">Piper · Product performance</div>
          <div className="preview-bubbles">
            <p className="bubble human">
              Summarize this deck in five bullets. List every date, decision,
              and open question. Do not change the file.
            </p>
            <p className="bubble bot">
              Working the PDF on the Desk. I’ll stop if anything needs your
              approval.
            </p>
            <p className="meta">tool: read · file: summary.md</p>
          </div>
        </div>
        <aside className="preview-pane">
          <div className="preview-head">Computer · Working</div>
          <div className="screen-box">
            Sign in to Zendesk so I can work the support queue.
          </div>
        </aside>
      </div>
    </section>
  );
}

function PreviewBot(props: { name: string; title: string; on?: boolean }) {
  return (
    <div className={`preview-bot${props.on ? " on" : ""}`}>
      <span className="avatar circle">{props.name[0] ?? "?"}</span>
      <span>
        <span className="name">{props.name}</span>
        <span className="title">{props.title}</span>
      </span>
    </div>
  );
}

function JobsShowcase() {
  const first: (typeof JOBS)[number] = JOBS[0] ?? {
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
