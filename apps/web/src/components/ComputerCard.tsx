import type { ComputerStatus } from "@grogbot/contracts";
import { MonitorIcon } from "./Icons";

export function ComputerCard(props: {
  title: string;
  status: string;
  done?: boolean;
  preview?: string;
  onOpen: () => void;
}) {
  return (
    <div className="computer-card">
      <div className="computer-card-head">
        <span>Computer</span>
        <span className={`status-pill${props.done ? " done" : ""}`}>
          <i />
          {props.status}
        </span>
      </div>
      {props.preview ? (
        <div className="computer-thumb">{props.preview}</div>
      ) : null}
      <p className="computer-task">{props.title}</p>
      <button className="open-computer" type="button" onClick={props.onOpen}>
        <MonitorIcon />
        Open computer
      </button>
    </div>
  );
}

export function ComputerStage(props: {
  computer: ComputerStatus | null;
  statusLabel: string;
  body: string;
  onClose: () => void;
  onTakeover: () => void;
  onRelease: () => void;
}) {
  const user = props.computer?.controlHolder === "user";
  return (
    <div className="stage-back">
      <button
        type="button"
        className="modal-dismiss"
        aria-label="Close computer"
        onClick={props.onClose}
      />
      <div className="stage" role="dialog" aria-label="Computer">
        <div className="pane-head">
          <strong>{props.computer?.name ?? "Computer"}</strong>
          <span className="muted">{props.statusLabel}</span>
        </div>
        <div className="screen-box">{props.body}</div>
        <div className="stage-actions">
          <button
            className="btn"
            type="button"
            onClick={user ? props.onRelease : props.onTakeover}
          >
            {user ? "Continue" : "Take over"}
          </button>
          <button className="btn ghost" type="button" onClick={props.onClose}>
            Close
          </button>
        </div>
        <p className="hint">
          Closing this does not stop work.
          {props.computer?.teammates && props.computer.teammates.length > 1
            ? ` On this computer: ${props.computer.teammates.map((item) => item.name).join(", ")}.`
            : ""}
        </p>
      </div>
    </div>
  );
}
