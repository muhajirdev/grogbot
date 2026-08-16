import type { Me } from "@grogbot/contracts";
import { useMemo, useState } from "react";
import {
  type LocalComputerPref,
  readAutoReview,
  readAutoReviewRules,
  readHardwareAccel,
  readLocalComputer,
  writeAutoReview,
  writeAutoReviewRules,
  writeHardwareAccel,
  writeLocalComputer,
} from "../lib/prefs";
import type { Theme } from "../lib/theme";
import { CloseIcon } from "./Icons";
import { ModalShell } from "./Modal";

type Tab = "general" | "billing" | "updates";

export function AppSettings(props: {
  me: Me | undefined;
  theme: Theme;
  onTheme: (theme: Theme) => void;
  onClose: () => void;
  onSignOut: () => void;
}) {
  const [tab, setTab] = useState<Tab>("general");
  const [hw, setHw] = useState(readHardwareAccel);
  const [local, setLocal] = useState(readLocalComputer);
  const [review, setReview] = useState(readAutoReview);
  const [rules, setRules] = useState(readAutoReviewRules);
  const zone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );

  return (
    <ModalShell wide onClose={props.onClose}>
      <div className="settings-shell">
        <nav className="settings-nav">
          {(
            [
              ["general", "General"],
              ["billing", "Usage & Billing"],
              ["updates", "Updates"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              className={`nav-item${tab === id ? " on" : ""}`}
              type="button"
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="settings-main">
          <div className="modal-head">
            <h2>
              {tab === "general"
                ? "General"
                : tab === "billing"
                  ? "Usage & Billing"
                  : "Updates"}
            </h2>
            <button
              className="icon-btn"
              type="button"
              aria-label="Close"
              onClick={props.onClose}
            >
              <CloseIcon />
            </button>
          </div>
          <div className="settings-body">
            {tab === "general" ? (
              <>
                <section className="set-block">
                  <p className="group-label">Account</p>
                  <div className="account-row">
                    <div>
                      <strong>{props.me?.name || "You"}</strong>
                      <p className="muted">{props.me?.email}</p>
                    </div>
                    <button
                      className="mini"
                      type="button"
                      onClick={props.onSignOut}
                    >
                      Sign Out
                    </button>
                  </div>
                </section>
                <section className="set-block">
                  <p className="group-label">Appearance</p>
                  <label className="field">
                    <span>Theme</span>
                    <select
                      value={props.theme}
                      onChange={(e) => props.onTheme(e.target.value as Theme)}
                    >
                      <option value="system">Follow System</option>
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                    </select>
                  </label>
                </section>
                <section className="set-block">
                  <p className="group-label">System</p>
                  <label className="toggle-row">
                    <span>
                      <strong>Use hardware acceleration</strong>
                    </span>
                    <input
                      type="checkbox"
                      checked={hw}
                      onChange={(e) => {
                        setHw(e.target.checked);
                        writeHardwareAccel(e.target.checked);
                      }}
                    />
                  </label>
                </section>
                <section className="set-block">
                  <p className="group-label">Bot</p>
                  <label className="field">
                    <span>Timezone</span>
                    <select defaultValue="auto">
                      <option value="auto">Auto-detect ({zone})</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Execution on Local Computer</span>
                    <select
                      value={local}
                      onChange={(e) => {
                        const value = e.target.value as LocalComputerPref;
                        setLocal(value);
                        writeLocalComputer(value);
                      }}
                    >
                      <option value="ask">Ask every time</option>
                      <option value="always">Always allow</option>
                      <option value="never">Never</option>
                    </select>
                    <p className="hint">
                      Let the assistant open files and run tasks on your
                      computer. Auto-review still checks everything first. Never
                      enable this when the sandbox is E2B.
                    </p>
                  </label>
                  <label className="toggle-row">
                    <span>
                      <strong>Auto-review</strong>
                    </span>
                    <input
                      type="checkbox"
                      checked={review}
                      onChange={(e) => {
                        setReview(e.target.checked);
                        writeAutoReview(e.target.checked);
                      }}
                    />
                  </label>
                  <p className="hint">
                    Checks each action before it runs and asks you first when
                    needed. Add rules to customize what it can do automatically.
                  </p>
                  <label className="field">
                    <span>Auto-review Rules</span>
                    <textarea
                      rows={3}
                      value={rules}
                      placeholder="Write one short, natural-language rule for each action. 'Ask first' takes priority if rules conflict."
                      onChange={(e) => {
                        setRules(e.target.value);
                        writeAutoReviewRules(e.target.value);
                      }}
                    />
                  </label>
                </section>
              </>
            ) : null}
            {tab === "billing" ? (
              <p className="muted">
                Usage and billing show up when you host this for a team. Local
                stays free.
              </p>
            ) : null}
            {tab === "updates" ? (
              <p className="muted">You're on the local build of Grogbot.</p>
            ) : null}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
