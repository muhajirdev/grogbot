import { MascotMark } from "@grogbot/mascot";
import { Link } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { FAQS, JOBS, SOURCE_REPO } from "../lib/copy";
import { HOME_INTEGRATIONS, HOME_USE_CASES } from "../lib/teasers";
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

function OfficePreview() {
  return (
    <section className="preview-wrap" aria-label="Office preview">
      <div className="preview" aria-hidden>
        <aside className="preview-side">
          <div className="side-head">
            <div className="search-field">
              <SearchIcon />
              Search
            </div>
            <span className="plus-btn">
              <PlusIcon />
            </span>
          </div>
          <div className="conv-list">
            <PreviewConv
              name="Piper"
              when="9:56"
              snip="Working the PDF on the default computer"
              color="#e45c9a"
              on
            />
            <PreviewConv
              name="Scout"
              when="11:47"
              snip="Shortlist is in the thread"
              color="#5b7cff"
            />
            <PreviewConv
              name="Ledger"
              when="8:16"
              snip="Flagged three receipts"
              color="#2f9e6d"
            />
          </div>
          <div className="side-foot">
            <div className="foot-item">
              <PlugIcon />
              Plugins
            </div>
            <div className="foot-item">
              <span
                className="avatar sm circle"
                style={{ background: "#4d5568" }}
              >
                Y
              </span>
              You
            </div>
          </div>
        </aside>
        <div className="preview-thread">
          <div className="thread-head">
            <div className="thread-who">
              <MascotMark
                name="Piper"
                color="#e45c9a"
                shape="circle"
                mood="working"
              />
              Piper
            </div>
            <div className="head-actions">
              <span className="icon-btn on">
                <MonitorIcon />
              </span>
              <span className="icon-btn">
                <GearIcon />
              </span>
            </div>
          </div>
          <div className="transcript">
            <div className="day-sep">Yesterday 9:56 AM</div>
            <p className="bubble human">
              Summarize this deck in five bullets. List every date, decision,
              and open question. Do not change the file.
            </p>
            <p className="bubble bot">
              I’ll stop if anything needs your approval.
            </p>
            <div className="computer-card">
              <div className="computer-card-head">
                Computer
                <span className="status-pill">
                  <i /> Done
                </span>
              </div>
              <p className="computer-task">
                Working the PDF on the default computer.
              </p>
              <div className="open-computer">Open computer</div>
            </div>
          </div>
          <div className="composer">
            <div className="composer-pill">Message Piper</div>
          </div>
        </div>
        <aside className="preview-pane">
          <div className="pane-head">Piper's screen</div>
          <p className="pane-label">Working</p>
          <div className="screen-box">
            Sign in to Zendesk so I can work the support queue.
          </div>
          <div className="routines">Routines</div>
        </aside>
      </div>
    </section>
  );
}

function PreviewConv(props: {
  name: string;
  when: string;
  snip: string;
  color: string;
  on?: boolean;
}) {
  return (
    <div className={`conv${props.on ? " on" : ""}`}>
      <MascotMark
        name={props.name}
        color={props.color}
        shape="circle"
        mood={props.on ? "working" : "idle"}
      />
      <span>
        <span className="conv-top">
          <span className="name">{props.name}</span>
          <span className="when">{props.when}</span>
        </span>
        <div className="snip">{props.snip}</div>
      </span>
    </div>
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

function Icon(props: { children: ReactNode }) {
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <title>Icon</title>
      {props.children}
    </svg>
  );
}

function SearchIcon() {
  return (
    <Icon>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </Icon>
  );
}

function PlusIcon() {
  return (
    <Icon>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

function PlugIcon() {
  return (
    <Icon>
      <path d="M9 7v4M15 7v4M8 11h8v3a4 4 0 0 1-8 0v-3Z" />
      <path d="M12 18v3" />
    </Icon>
  );
}

function MonitorIcon() {
  return (
    <Icon>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </Icon>
  );
}

function GearIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1Z" />
    </Icon>
  );
}
