import { MascotMark } from "@grogbot/mascot";
import type { ReactNode } from "react";

export function OfficePreview() {
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
