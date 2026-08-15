export function Welcome(props: { onStart: () => void }) {
  return (
    <div className="screen">
      <div className="stack hero">
        <p className="kicker">Grogbot</p>
        <h1>AI teammates you host.</h1>
        <p className="lede">
          Create a Bot, message it, grant access as needed. No workflow builder.
          There isn’t anything to learn — it’s like bringing on a coworker.
        </p>
        <div className="row">
          <button className="btn" type="button" onClick={props.onStart}>
            Get started
          </button>
        </div>
      </div>
    </div>
  );
}
