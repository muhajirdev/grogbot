import type { ReactNode } from "react";

export function Welcome(props: { start: ReactNode }) {
  return (
    <div className="screen">
      <div className="stack hero">
        <p className="kicker">Grogbot</p>
        <h1>Create a Bot, message it, grant access as needed.</h1>
        <p className="lede">
          No workflow builder. There isn’t anything to learn — it’s like
          bringing on a coworker.
        </p>
        <div className="row">{props.start}</div>
      </div>
    </div>
  );
}
