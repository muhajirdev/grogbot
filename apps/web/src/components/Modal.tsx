import type { ReactNode } from "react";

export function ModalShell(props: {
  onClose: () => void;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="modal-back">
      <button
        type="button"
        className="modal-dismiss"
        aria-label="Close"
        onClick={props.onClose}
      />
      <div
        className={`modal${props.wide ? " wide" : ""}`}
        role="dialog"
        aria-modal
      >
        {props.children}
      </div>
    </div>
  );
}
