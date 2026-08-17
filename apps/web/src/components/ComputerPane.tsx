import type {
  Bot,
  ComputerActivityItem,
  ComputerDeskFile,
  ComputerStatus,
  Routine,
} from "@grogbot/contracts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
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
  computerPending?: boolean;
  statusLabel: string;
  working?: string;
  onSettings: () => void;
  onCollapse: () => void;
  onTakeover: () => void;
  onRelease: () => void;
}) {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [cron, setCron] = useState<string>(CRONS[0].value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const botId = props.bot.id;
  const waiting = Boolean(props.computerPending) && !props.computer;
  const booting = props.computer?.state === "booting" || waiting;
  const routinesQuery = useQuery({
    queryKey: ["routines", botId],
    queryFn: () => client.routines.list({ botId }),
    staleTime: 30_000,
  });
  const routines: Routine[] = routinesQuery.data ?? [];

  const user = props.computer?.controlHolder === "user";
  const otherHasMouse =
    Boolean(props.computer?.usingBotId) &&
    props.computer?.usingBotId !== props.bot.id;

  return (
    <aside className="pane computer-pane">
      <div className="pane-head drag">
        <span className="pane-title">{props.bot.name}'s screen</span>
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
          {booting ? (
            <>
              <p>{waiting ? "Opening desk" : props.statusLabel}</p>
              <div className="progress">
                <i />
              </div>
            </>
          ) : (
            <p className="boot-status">{props.statusLabel}</p>
          )}
        </div>
        <div className="screen-box inset">
          {waiting ? null : (
            <DeskScreen
              computer={props.computer}
              working={props.working ?? ""}
              user={user}
              otherHasMouse={otherHasMouse}
            />
          )}
        </div>
        {waiting ? null : (
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

function DeskScreen(props: {
  computer: ComputerStatus | null;
  working: string;
  user: boolean;
  otherHasMouse: boolean;
}) {
  const files = props.computer?.files ?? [{ path: "/workspace", kind: "dir" }];
  const artifact = props.computer?.artifact ?? null;
  const activity = props.computer?.activity ?? [];
  const nowDoing =
    props.working.trim() || props.computer?.nowDoing || null;
  const [selectedPath, setSelectedPath] = useState(artifact?.path ?? "");

  useEffect(() => {
    setSelectedPath(artifact?.path ?? "");
  }, [artifact?.path, props.computer?.id]);

  const selected = useMemo(
    () => selectedFile(files, selectedPath, artifact),
    [files, selectedPath, artifact],
  );

  const banner = props.user
    ? "You're in control. Complete the blocked step here — not in chat."
    : props.otherHasMouse
      ? `${props.computer?.usingBotName ?? "A teammate"} has the desk. Files are shared; one editor at a time.`
      : null;

  return (
    <div className="desk">
      {banner ? <p className="desk-banner">{banner}</p> : null}
      <section className="desk-workspace">
        <p className="desk-kicker">Workspace</p>
        <ul className="desk-tree">
          {files.map((file) => (
            <li key={file.path}>
              {file.kind === "dir" ? (
                <span className="desk-dir">{file.path}</span>
              ) : (
                <button
                  className={
                    file.path === selected?.path ? "desk-file on" : "desk-file"
                  }
                  type="button"
                  onClick={() => setSelectedPath(file.path)}
                >
                  {baseName(file.path)}
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
      <section className="desk-artifact">
        {selected ? (
          <>
            <p className="desk-artifact-title">{selected.title}</p>
            <pre className="desk-artifact-body">{selected.body}</pre>
          </>
        ) : (
          <p className="desk-empty">
            Files this teammate writes land here. Work continues if you close
            this.
          </p>
        )}
      </section>
      <section className="desk-activity">
        <p className="desk-kicker">Activity</p>
        {nowDoing ? <p className="desk-now">{nowDoing}</p> : null}
        <ActivityList items={activity} nowDoing={nowDoing} />
      </section>
    </div>
  );
}

function ActivityList(props: {
  items: ComputerActivityItem[];
  nowDoing: string | null;
}) {
  const rows = props.items.filter((item) => item.text !== props.nowDoing);
  if (rows.length === 0 && !props.nowDoing) {
    return <p className="desk-empty">No recent steps.</p>;
  }
  if (rows.length === 0) return null;
  return (
    <ul className="desk-log">
      {rows.map((item) => (
        <li key={item.id}>{item.text}</li>
      ))}
    </ul>
  );
}

function selectedFile(
  files: ComputerDeskFile[],
  path: string,
  artifact: ComputerStatus["artifact"],
): { path: string; title: string; body: string } | null {
  const file = files.find((item) => item.kind === "file" && item.path === path);
  if (file?.body) {
    return {
      path: file.path,
      title: file.title || baseName(file.path),
      body: file.body,
    };
  }
  if (artifact && (path === artifact.path || !path)) return artifact;
  return artifact;
}

function baseName(path: string): string {
  return path.split("/").filter(Boolean).at(-1) ?? path;
}
