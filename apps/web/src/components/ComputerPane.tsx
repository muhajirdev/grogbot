import type { Bot, ComputerStatus, Routine } from "@grogbot/contracts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { client } from "../lib/rpc";
import { CloseIcon, GearIcon } from "./Icons";
import { ModalShell } from "../ui";

const CRONS = [
  { label: "Every day at 9:00", value: "0 9 * * *" },
  { label: "Every night at 22:00", value: "0 22 * * *" },
  { label: "Weekdays at 9:00", value: "0 9 * * 1-5" },
] as const;

export function ComputerPane(props: {
  bot: Bot;
  computer: ComputerStatus | null;
  statusLabel: string;
  body: string;
  working: boolean;
  onSettings: () => void;
  onCollapse: () => void;
  onTakeover: () => void;
  onRelease: () => void;
}) {
  const queryClient = useQueryClient();
  const [booting, setBooting] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [cron, setCron] = useState<string>(CRONS[0].value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const live =
    props.working ||
    props.computer?.state === "running" ||
    props.computer?.state === "booting" ||
    props.computer?.controlHolder === "user";
  const botId = props.bot.id;
  const routinesQuery = useQuery({
    queryKey: ["routines", botId],
    queryFn: () => client.routines.list({ botId }),
  });
  const routines: Routine[] = routinesQuery.data ?? [];

  useEffect(() => {
    if (live) {
      setBooting(false);
      return;
    }
    setBooting(Boolean(botId));
    const timer = window.setTimeout(() => setBooting(false), 2000);
    return () => window.clearTimeout(timer);
  }, [botId, live]);

  const user = props.computer?.controlHolder === "user";

  return (
    <aside className="pane computer-pane">
      <div className="pane-head drag">
        <span className="pane-title">{props.bot.name}'s computer</span>
        <div className="row tight no-drag">
          <button
            className="icon-btn"
            type="button"
            aria-label="Bot settings"
            title="Settings"
            onClick={props.onSettings}
          >
            <GearIcon />
          </button>
          <button
            className="icon-btn"
            type="button"
            aria-label="Close computer"
            title="Close"
            onClick={props.onCollapse}
          >
            <CloseIcon />
          </button>
        </div>
      </div>
      <div className="pane-scroll">
        <div className="boot-card">
          {booting && !live ? (
            <>
              <p>Starting desktop</p>
              <div className="progress">
                <i />
              </div>
            </>
          ) : (
            <p className="boot-status">{props.statusLabel}</p>
          )}
        </div>
        <p className="screen-label">{props.bot.name}'s screen</p>
        <div className="screen-box inset">
          {booting && !live ? "" : props.body}
        </div>
        {booting && !live ? null : (
          <div className="stage-actions" style={{ padding: "12px 0 8px" }}>
            <button
              className="btn"
              type="button"
              onClick={user ? props.onRelease : props.onTakeover}
            >
              {user ? "Continue" : "Take over"}
            </button>
          </div>
        )}
        <section className="routines">
          <p className="muted">
            Routines are recurring tasks this Bot runs on a schedule.
          </p>
          {routines.length > 0 ? (
            <ul className="routine-list">
              {routines.map((item) => (
                <li key={item.id}>
                  <strong>{item.name}</strong>
                  <span className="muted">{item.cron}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <button
            className="create-routine"
            type="button"
            onClick={() => {
              setName("");
              setPrompt("");
              setCron(CRONS[0].value);
              setError("");
              setCreating(true);
            }}
          >
            Create Routine
          </button>
        </section>
      </div>
      {creating ? (
        <ModalShell onClose={() => setCreating(false)}>
          <h2>Create Routine</h2>
          <label className="field">
            <span>Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nightly Gmail check"
            />
          </label>
          <label className="field">
            <span>Schedule</span>
            <select value={cron} onChange={(e) => setCron(e.target.value)}>
              {CRONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>What to do</span>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <div className="row">
            <button
              className="btn"
              type="button"
              disabled={busy || !name.trim() || !prompt.trim()}
              onClick={() => {
                setBusy(true);
                setError("");
                void client.routines
                  .create({
                    botId: props.bot.id,
                    name,
                    prompt,
                    cron,
                  })
                  .then(async () => {
                    await queryClient.invalidateQueries({
                      queryKey: ["routines", props.bot.id],
                    });
                    setCreating(false);
                  })
                  .catch((caught: unknown) =>
                    setError(
                      caught instanceof Error
                        ? caught.message
                        : "Could not create",
                    ),
                  )
                  .finally(() => setBusy(false));
              }}
            >
              Create
            </button>
            <button
              className="btn ghost"
              type="button"
              onClick={() => setCreating(false)}
            >
              Close
            </button>
          </div>
        </ModalShell>
      ) : null}
    </aside>
  );
}
