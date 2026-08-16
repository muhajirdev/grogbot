import type { AvatarShape } from "@grogbot/contracts";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AvatarMark } from "../components/Avatar";
import { AVATAR_COLORS, AVATAR_SHAPES, SUGGESTED_JOBS } from "../lib/jobs";
import { orpc } from "../lib/orpc";
import { client } from "../lib/rpc";
import { cacheCreatedBot } from "../lib/session";

const TOOLS = ["Gmail", "Slack", "GitHub", "Calendar", "Drive", "Linear"];

export function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [tools, setTools] = useState<string[]>([]);
  const [name, setName] = useState("Piper");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState(
    "Operational rules — sources, output shape, never change production.",
  );
  const [color, setColor] = useState<string>(AVATAR_COLORS[0]);
  const [shape, setShape] = useState<AvatarShape>("circle");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function pickJob(job: (typeof SUGGESTED_JOBS)[number]) {
    setTitle(job.title);
    setDescription(job.description);
    setName(job.title.split(" ")[0] ?? "Piper");
    setStep(4);
  }

  async function create() {
    setBusy(true);
    setError("");
    try {
      const bot = await client.bots.create({
        name,
        title,
        description,
        instructions: description,
        avatarColor: color,
        avatarShape: shape,
      });
      localStorage.setItem("grogbot.onboarded", "1");
      cacheCreatedBot(queryClient, bot);
      await queryClient.invalidateQueries({ queryKey: orpc.bots.key() });
      await navigate({ to: "/$botId", params: { botId: bot.id } });
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not create teammate",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen">
      <div className="stack">
        <p className="kicker">Meet a teammate</p>
        {step === 0 ? (
          <>
            <h1>Bots are coworkers.</h1>
            <p className="lede">
              Each Bot is a named person in the sidebar. You talk to them. They
              share the default computer — files and logins — unless you give
              one its own.
            </p>
            <button className="btn" type="button" onClick={() => setStep(1)}>
              Next
            </button>
          </>
        ) : null}
        {step === 1 ? (
          <>
            <h1>The computer is a pane you can ignore.</h1>
            <p className="lede">
              Teammates on the same computer take turns with the mouse. Work
              continues if you close the pane. Take over only when a password,
              2FA, or payment shows up — on the computer, not in chat.
            </p>
            <button className="btn" type="button" onClick={() => setStep(2)}>
              Next
            </button>
          </>
        ) : null}
        {step === 2 ? (
          <>
            <h1>Which tools do you use?</h1>
            <p className="lede">
              This only shapes suggestions. Nothing connects yet. We’ll ask when
              the Bot hits a wall.
            </p>
            <div className="chips">
              {TOOLS.map((tool) => (
                <button
                  key={tool}
                  type="button"
                  className={`chip${tools.includes(tool) ? " on" : ""}`}
                  onClick={() =>
                    setTools(
                      tools.includes(tool)
                        ? tools.filter((item) => item !== tool)
                        : [...tools, tool],
                    )
                  }
                >
                  {tool}
                </button>
              ))}
            </div>
            <div className="row" style={{ marginTop: 20 }}>
              <button className="btn" type="button" onClick={() => setStep(3)}>
                Continue
              </button>
            </div>
          </>
        ) : null}
        {step === 3 ? (
          <>
            <h1>Who should we hire first?</h1>
            <p className="lede">Pick a job, or write your own.</p>
            <div className="chips">
              {SUGGESTED_JOBS.map((job) => (
                <button
                  key={job.title}
                  type="button"
                  className="chip"
                  onClick={() => pickJob(job)}
                >
                  {job.title}
                </button>
              ))}
            </div>
            <div className="row" style={{ marginTop: 20 }}>
              <button
                className="btn ghost"
                type="button"
                onClick={() => setStep(4)}
              >
                Create your own
              </button>
            </div>
          </>
        ) : null}
        {step === 4 ? (
          <>
            <h1>Name + how it should work.</h1>
            <div
              style={{
                display: "flex",
                gap: 16,
                alignItems: "center",
                margin: "12px 0 20px",
              }}
            >
              <AvatarMark name={name} color={color} shape={shape} large />
              <div className="swatches">
                {AVATAR_COLORS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`swatch avatar circle${color === value ? " on" : ""}`}
                    style={{ background: value }}
                    onClick={() => setColor(value)}
                  />
                ))}
                {AVATAR_SHAPES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`chip${shape === value ? " on" : ""}`}
                    onClick={() => setShape(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            <label className="field">
              <span>Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>Job (optional)</span>
              <input
                value={title}
                placeholder="Talent Scout"
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label className="field">
              <span>How it should work</span>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            {error ? <p className="error">{error}</p> : null}
            <button
              className="btn"
              type="button"
              disabled={busy || !name.trim()}
              onClick={() => void create()}
            >
              {busy ? "Hiring…" : "Open the thread"}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
