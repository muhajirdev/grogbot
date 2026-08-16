import { APPS, type FeatureId } from "../lib/copy";

export function OfficePreview() {
  return (
    <section className="preview-wrap" aria-label="Office preview">
      <div className="preview" aria-hidden>
        <aside className="preview-side">
          <div className="preview-search">Search</div>
          <PreviewBot
            name="Piper"
            title="Product performance"
            preview="Five bullets, three open questions."
            time="2m"
            on
            color="#1084fe"
          />
          <PreviewBot
            name="Scout"
            title="Talent Scout"
            preview="Shortlist of four. Waiting on you."
            time="1h"
            color="#e25d4a"
            unread
          />
          <PreviewBot
            name="Ledger"
            title="Expense Manager"
            preview="12 receipts over policy."
            time="Yesterday"
            color="#2f9e6d"
          />
          <div className="preview-side-foot">
            <span>Plugins</span>
            <span>You</span>
          </div>
        </aside>
        <div className="preview-thread">
          <div className="preview-head">
            <div>
              <strong>Piper</strong>
              <span>Product performance</span>
            </div>
            <span className="preview-icon" title="Computer">
              ▣
            </span>
          </div>
          <div className="preview-bubbles">
            <p className="day-sep">Today</p>
            <p className="bubble human">
              Summarize this deck in five bullets. List every date, decision,
              and open question. Do not change the file.
            </p>
            <p className="chip-row">
              <span className="activity">read · Q3-review.pdf</span>
              <span className="activity">browser</span>
            </p>
            <p className="bubble bot">
              Five bullets on the Desk. I’ll stop if anything needs your
              approval.
            </p>
            <div className="approval">
              <p className="approval-kicker">Piper wants to run a command</p>
              <pre>$ open Q3-review.pdf</pre>
              <div className="approval-row">
                <span className="btn tiny">Allow</span>
                <span className="btn ghost tiny">Deny</span>
              </div>
            </div>
          </div>
          <div className="preview-composer">Message Piper</div>
        </div>
        <aside className="preview-pane">
          <div className="preview-head">
            <div>
              <strong>Computer</strong>
              <span>Working</span>
            </div>
          </div>
          <div className="screen-box">
            <span className="screen-bar">Desk · shared</span>
            Sign in to Zendesk so I can work the support queue.
          </div>
          <div className="preview-pane-actions">
            <span className="btn ghost tiny">Take over</span>
            <p className="routine">
              Morning digest
              <span>Weekdays · 9:00</span>
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

export function FeatureStage(props: { id: FeatureId }) {
  if (props.id === "computer") {
    return (
      <div className="mini-preview" aria-hidden>
        <div className="preview-head">
          <strong>Computer</strong>
          <span>You're in control</span>
        </div>
        <div className="screen-box short">
          2FA on GitHub. Continue when you’re done.
        </div>
        <div className="preview-pane-actions">
          <span className="btn tiny">Continue</span>
          <span className="btn ghost tiny">Open desktop</span>
        </div>
      </div>
    );
  }
  if (props.id === "approvals") {
    return (
      <div className="mini-preview" aria-hidden>
        <div className="approval">
          <p className="approval-kicker">Scout wants to send mail</p>
          <pre>To: alex@example.com — Intro for the shortlist</pre>
          <div className="approval-row">
            <span className="btn tiny">Allow</span>
            <span className="btn ghost tiny">Deny</span>
          </div>
        </div>
      </div>
    );
  }
  if (props.id === "apps") {
    return (
      <div className="mini-preview apps-preview" aria-hidden>
        <p className="preview-brand">Marketplace</p>
        <div className="app-grid">
          {APPS.map((name) => (
            <span key={name} className="app-tile">
              {name}
            </span>
          ))}
        </div>
      </div>
    );
  }
  if (props.id === "teammates") {
    return (
      <div className="mini-preview" aria-hidden>
        <div className="context-menu">
          <span>Pin</span>
          <span>Mark as unread</span>
          <span>Edit profile</span>
          <span>Duplicate</span>
          <span className="danger">Delete</span>
        </div>
      </div>
    );
  }
  if (props.id === "desk") {
    return (
      <div className="mini-preview" aria-hidden>
        <p className="preview-brand">Default computer</p>
        <p className="lede tight small">
          Piper, Scout, and Ledger share this desk. Files and logins stay. One
          mouse.
        </p>
        <span className="btn ghost tiny">New computer</span>
      </div>
    );
  }
  return (
    <div className="mini-preview" aria-hidden>
      <p className="preview-brand">Self-host</p>
      <ul className="points compact">
        <li>Web office on grogbot.com</li>
        <li>oRPC for web, desktop, mobile</li>
        <li>Docker local · E2B hosted</li>
      </ul>
    </div>
  );
}

function PreviewBot(props: {
  name: string;
  title: string;
  preview: string;
  time: string;
  color: string;
  on?: boolean;
  unread?: boolean;
}) {
  return (
    <div className={`preview-bot${props.on ? " on" : ""}`}>
      <span className="avatar circle" style={{ background: props.color }}>
        {props.name[0] ?? "?"}
      </span>
      <span className="preview-bot-copy">
        <span className="name-row">
          <span className="name">{props.name}</span>
          <span className="time">{props.time}</span>
        </span>
        <span className="title">{props.title}</span>
        <span className="snip">{props.preview}</span>
      </span>
      {props.unread ? <span className="unread" /> : null}
    </div>
  );
}
