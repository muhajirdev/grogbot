import type { Bot, ComputerStatus, GuestAgentKind } from "@grogbot/contracts";
import { useEffect, useState } from "react";
import { AVATAR_COLORS, AVATAR_SHAPES } from "../lib/jobs";
import { readNotify, writeNotify } from "../lib/prefs";
import { client } from "../lib/rpc";
import { AvatarMark, ShapePicks } from "./Avatar";
import { ChevronLeftIcon, CollapseIcon } from "./Icons";

export function BotSettingsPane(props: {
  bot: Bot;
  computer: ComputerStatus | null;
  onCollapse: () => void;
  onSaved: () => Promise<void>;
}) {
  const bot = props.bot;
  const [name, setName] = useState(bot.name);
  const [title, setTitle] = useState(bot.title);
  const [description, setDescription] = useState(bot.description);
  const [color, setColor] = useState(bot.avatarColor);
  const [shape, setShape] = useState(bot.avatarShape);
  const [notify, setNotify] = useState(() => readNotify(bot.id));
  const [advancedOpen, setAdvancedOpen] = useState(bot.guestKind !== "off");
  const [guestBusy, setGuestBusy] = useState(false);
  const [guestError, setGuestError] = useState("");
  const [issued, setIssued] = useState<{
    token: string;
    command: string;
    kind: string;
  } | null>(null);

  useEffect(() => {
    setName(bot.name);
    setTitle(bot.title);
    setDescription(bot.description);
    setColor(bot.avatarColor);
    setShape(bot.avatarShape);
    setNotify(readNotify(bot.id));
    setIssued(null);
    setGuestError("");
    setAdvancedOpen(bot.guestKind !== "off");
  }, [bot]);

  async function save(patch: {
    name?: string;
    title?: string;
    description?: string;
    avatarColor?: string;
    avatarShape?: typeof shape;
  }) {
    await client.bots.update({
      botId: bot.id,
      ...patch,
      instructions: patch.description ?? description,
    });
    await props.onSaved();
  }

  return (
    <aside className="pane">
      <div className="pane-head">
        <div className="row tight">
          <button
            className="icon-btn"
            type="button"
            aria-label="Back"
            onClick={props.onCollapse}
          >
            <ChevronLeftIcon />
          </button>
          <strong>Settings</strong>
        </div>
        <button
          className="icon-btn"
          type="button"
          aria-label="Collapse settings"
          onClick={props.onCollapse}
        >
          <CollapseIcon />
        </button>
      </div>
      <div className="pane-scroll">
        <div className="hero-avatar">
          <AvatarMark name={name} color={color} shape={shape} large />
        </div>
        <div className="swatches">
          {AVATAR_COLORS.map((value) => (
            <button
              key={value}
              type="button"
              className={`swatch${color === value ? " on" : ""}`}
              style={{ background: value }}
              onClick={() => {
                setColor(value);
                void save({ avatarColor: value });
              }}
            />
          ))}
        </div>
        <ShapePicks
          color={color}
          value={shape}
          shapes={AVATAR_SHAPES}
          onChange={(next) => {
            setShape(next);
            void save({ avatarShape: next });
          }}
        />
        <label className="field">
          <span>Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              if (name.trim() && name !== bot.name)
                void save({ name: name.trim() });
            }}
          />
        </label>
        <label className="field">
          <span>Title</span>
          <input
            value={title}
            placeholder="Describe what your Bot does"
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              if (title !== bot.title) void save({ title });
            }}
          />
        </label>
        <label className="field">
          <span>Description</span>
          <textarea
            rows={4}
            value={description}
            placeholder="What this Bot is for"
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => {
              if (description !== bot.description) void save({ description });
            }}
          />
        </label>
        <section className="set-block">
          <p className="group-label">Notifications</p>
          <label className="toggle-row">
            <span>Get notified when this Bot finishes or needs input.</span>
            <input
              type="checkbox"
              checked={notify}
              onChange={(e) => {
                setNotify(e.target.checked);
                writeNotify(bot.id, e.target.checked);
              }}
            />
          </label>
        </section>
        {props.computer ? (
          <p className="hint">
            Computer: {props.computer.name}
            {props.computer.teammates.length > 1
              ? ` · ${props.computer.teammates.map((item) => item.name).join(", ")}`
              : ""}
          </p>
        ) : null}
        <button
          className="text-btn"
          type="button"
          onClick={() => setAdvancedOpen((open) => !open)}
        >
          {advancedOpen ? "Hide advanced" : "Advanced"}
        </button>
        {advancedOpen ? (
          <div className="advanced">
            <p className="hint">
              Off by default. Hermes or OpenClaw connect outbound to this bot.
            </p>
            <div className="row">
              {(["hermes", "openclaw"] as GuestAgentKind[]).map((kind) => (
                <button
                  key={kind}
                  className={`chip${bot.guestKind === kind ? " on" : ""}`}
                  type="button"
                  disabled={guestBusy}
                  onClick={() => {
                    setGuestBusy(true);
                    setGuestError("");
                    void client.guests
                      .enable({ botId: bot.id, kind })
                      .then((result) => {
                        setIssued({
                          token: result.token,
                          command: result.command,
                          kind,
                        });
                        return props.onSaved();
                      })
                      .catch((caught: unknown) =>
                        setGuestError(
                          caught instanceof Error
                            ? caught.message
                            : "Could not enable",
                        ),
                      )
                      .finally(() => setGuestBusy(false));
                  }}
                >
                  {kind}
                </button>
              ))}
              {bot.guestKind !== "off" ? (
                <button
                  className="mini"
                  type="button"
                  disabled={guestBusy}
                  onClick={() => {
                    setGuestBusy(true);
                    setIssued(null);
                    void client.guests
                      .disable({ botId: bot.id })
                      .then(props.onSaved)
                      .catch((caught: unknown) =>
                        setGuestError(
                          caught instanceof Error
                            ? caught.message
                            : "Could not disable",
                        ),
                      )
                      .finally(() => setGuestBusy(false));
                  }}
                >
                  Turn off
                </button>
              ) : null}
            </div>
            {issued ? (
              <label className="field" style={{ marginTop: 12 }}>
                <span>Run this on the machine that has {issued.kind}</span>
                <textarea rows={3} readOnly value={issued.command} />
              </label>
            ) : null}
            {guestError ? <p className="error">{guestError}</p> : null}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
