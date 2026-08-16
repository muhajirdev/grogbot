import type { ReactNode } from "react";
import { AvatarMark } from "../components/Avatar";

export function Welcome(props: { start: ReactNode }) {
  return (
    <div className="screen">
      <div className="stack hero">
        <div className="mascot-hello">
          <AvatarMark
            name="Piper"
            color="#e45c9a"
            shape="circle"
            large
            mood="happy"
          />
        </div>
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
