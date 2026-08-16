import {
  type Bot,
  type ComputerStatus,
  DEFAULT_COMPUTER_NAME,
  type GuestAgentKind,
  type ProductEvent,
  type ThreadMessage,
} from "@grogbot/contracts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AvatarMark } from "../components/Avatar";
import { authClient } from "../lib/auth";
import { AVATAR_COLORS, AVATAR_SHAPES, FIRST_TASK } from "../lib/jobs";
import { orpc } from "../lib/orpc";
import { client } from "../lib/rpc";
import { applyTheme, readTheme, type Theme } from "../lib/theme";

function asMessage(payload: Record<string, unknown>): ThreadMessage | null {
  const id = String(payload.id ?? "");
  const seq = Number(payload.seq);
  const actorType = payload.actorType;
  if (!id || !Number.isFinite(seq)) return null;
  if (actorType !== "human" && actorType !== "bot" && actorType !== "system")
    return null;
  return {
    id,
    seq,
    actorType,
    actorId: payload.actorId ? String(payload.actorId) : null,
    blocks: Array.isArray(payload.blocks)
      ? (payload.blocks as ThreadMessage["blocks"])
      : [],
    runId: payload.runId ? String(payload.runId) : null,
    createdAt: String(payload.createdAt ?? new Date().toISOString()),
  };
}

function ModalShell(props: { onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal-back">
      <button
        type="button"
        className="modal-dismiss"
        aria-label="Close"
        onClick={props.onClose}
      />
      <div className="modal" role="dialog">
        {props.children}
      </div>
    </div>
  );
}

export function Office(props: { botId: string }) {
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const botsQuery = useQuery(orpc.bots.list.queryOptions());
  const bots = botsQuery.data ?? [];
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [working, setWorking] = useState("");
  const [computer, setComputer] = useState<ComputerStatus | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(readTheme());
  const scroller = useRef<HTMLDivElement>(null);
  const bot = bots.find((item) => item.id === props.botId) ?? bots[0];
  const activeId = bot?.id;

  async function refreshBots(selectId?: string) {
    await queryClient.invalidateQueries({ queryKey: orpc.bots.key() });
    await queryClient.invalidateQueries({ queryKey: orpc.computers.key() });
    const list = await queryClient.ensureQueryData(
      orpc.bots.list.queryOptions(),
    );
    const next = selectId ?? props.botId ?? list[0]?.id;
    if (next && next !== props.botId) {
      await navigate({ to: "/$botId", params: { botId: next } });
    }
  }

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n") {
        event.preventDefault();
        setNewOpen(true);
      }
      if ((event.metaKey || event.ctrlKey) && event.key === ",") {
        event.preventDefault();
        setSettingsOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    let iterator: AsyncIterator<ProductEvent> | undefined;
    setMessages([]);
    setWorking("");
    void client.computer
      .status({ botId: activeId })
      .then(setComputer)
      .catch(() => setComputer(null));
    void (async () => {
      iterator = (await client.threads.subscribe({
        botId: activeId,
        cursor: -1,
      })) as AsyncIterator<ProductEvent>;
      for (;;) {
        const next = await iterator.next();
        if (cancelled || next.done) break;
        const event = next.value;
        if (event.type === "message.created") {
          const message = asMessage(event.payload);
          if (message) {
            setMessages((current) => {
              if (current.some((item) => item.id === message.id))
                return current;
              return [...current, message].sort((a, b) => a.seq - b.seq);
            });
          }
        }
        if (event.type === "run.updated") {
          const status = String(event.payload.status ?? "");
          const text = String(event.payload.text ?? "");
          setWorking(
            status === "running" || status === "queued"
              ? text || "working…"
              : "",
          );
        }
        if (event.type === "computer.updated") {
          setComputer(event.payload as unknown as ComputerStatus);
        }
        if (event.type === "guest.updated") {
          void queryClient.invalidateQueries({ queryKey: orpc.bots.key() });
        }
      }
    })().catch((caught: unknown) => {
      if (!cancelled)
        setError(caught instanceof Error ? caught.message : "Lost the thread");
    });
    return () => {
      cancelled = true;
      void iterator?.return?.();
    };
  }, [activeId, queryClient]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll when the transcript grows
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages.length, working]);

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!bot || !draft.trim()) return;
    const text = draft.trim();
    setDraft("");
    setWorking("working…");
    try {
      await client.threads.send({ botId: bot.id, text });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not send");
    }
  }

  const statusLabel = useMemo(() => {
    if (working) return "Working";
    if (bot?.guestKind && bot.guestKind !== "off") {
      return bot.guestOnline
        ? `${bot.guestKind} connected`
        : `Waiting for ${bot.guestKind}`;
    }
    if (!computer) return "Idle";
    if (computer.controlHolder === "user") return "You're in control";
    if (
      computer.usingBotId &&
      computer.usingBotId !== bot?.id &&
      (computer.state === "running" || computer.state === "booting")
    ) {
      return `${computer.usingBotName ?? "Teammate"} has the mouse`;
    }
    if (computer.state === "running" || computer.state === "booting")
      return "Working";
    return "Idle";
  }, [bot, computer, working]);

  return (
    <div className="office">
      <aside className="sidebar">
        <div className="side-head">
          <div>
            <p className="kicker">Grogbot</p>
            <span>Teammates</span>
          </div>
          <div className="row">
            <button
              className="btn tiny"
              type="button"
              onClick={() => setNewOpen(true)}
            >
              New
            </button>
            <button
              className="btn ghost tiny"
              type="button"
              onClick={() => setSettingsOpen(true)}
            >
              Settings
            </button>
          </div>
        </div>
        <div className="bot-list">
          {bots.map((item) => (
            <Link
              key={item.id}
              to="/$botId"
              params={{ botId: item.id }}
              className={`bot-item${item.id === bot?.id ? " on" : ""}`}
            >
              <AvatarMark
                name={item.name}
                color={item.avatarColor}
                shape={item.avatarShape}
              />
              <span>
                <div className="name">{item.name}</div>
                {item.title ? <div className="title">{item.title}</div> : null}
                {item.computerName ? (
                  <div className="title">{item.computerName}</div>
                ) : null}
                {item.guestKind !== "off" ? (
                  <div className="title">
                    {item.guestOnline
                      ? `${item.guestKind} online`
                      : `${item.guestKind} offline`}
                  </div>
                ) : null}
              </span>
            </Link>
          ))}
          {bots.length === 0 ? (
            <p className="empty">No teammates yet.</p>
          ) : null}
        </div>
      </aside>
      <section className="thread">
        <div className="thread-head">
          <div>
            <strong className="ui">{bot?.name ?? "—"}</strong>
            {bot?.title ? <div className="title">{bot.title}</div> : null}
          </div>
          <div className="row">
            {working ? (
              <button
                className="btn ghost tiny"
                type="button"
                onClick={() =>
                  bot && void client.threads.stop({ botId: bot.id })
                }
              >
                Stop now
              </button>
            ) : null}
            <button
              className="btn ghost tiny"
              type="button"
              onClick={() => setProfileOpen(true)}
            >
              Profile
            </button>
          </div>
        </div>
        <div className="transcript" ref={scroller}>
          {messages.map((message) => {
            const text = message.blocks
              .filter((block) => block.kind === "text")
              .map((block) => block.text)
              .join("\n");
            return (
              <div
                key={message.id}
                className={`bubble ${message.actorType === "human" ? "human" : "bot"}`}
              >
                {text}
              </div>
            );
          })}
          {working ? (
            <div className="meta-line">
              {bot?.name} {working}
            </div>
          ) : null}
          {!working && messages.length === 0 ? (
            <p className="lede">
              First message is a real task. A good handoff has an outcome,
              sources, and when to stop.
            </p>
          ) : null}
        </div>
        <div className="composer">
          {error ? <p className="error">{error}</p> : null}
          <form onSubmit={(event) => void send(event)}>
            <textarea
              value={draft}
              placeholder={
                messages.length === 0
                  ? FIRST_TASK
                  : bot
                    ? `Message ${bot.name}`
                    : "Message"
              }
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <button className="btn tiny" type="submit" disabled={!bot}>
              Send
            </button>
          </form>
        </div>
      </section>
      <aside className="pane">
        <div className="pane-head">
          <strong className="ui">{computer?.name ?? "Computer"}</strong>
          <span className="ui">{statusLabel}</span>
        </div>
        <div className="screen-box">
          {computer?.controlHolder === "user"
            ? "You're in control. Sign in, 2FA, or pay here — not in chat."
            : bot?.guestKind && bot.guestKind !== "off" && !bot.guestOnline
              ? `This teammate is waiting for ${bot.guestKind} to connect from your machine. Off by default — enable it in Profile → Advanced.`
              : computer?.usingBotId && computer.usingBotId !== bot?.id
                ? `${computer.usingBotName} has the mouse on ${computer.name}. Files and logins are shared; one mouse at a time.`
                : working
                  ? `${bot?.name ?? "Bot"} is using ${computer?.name ?? "this computer"}.\n${working}`
                  : computer?.isDefault ||
                      (computer?.teammates && computer.teammates.length > 1)
                    ? `${computer?.name ?? DEFAULT_COMPUTER_NAME}. Teammates on this computer share files and logins.`
                    : `${computer?.name ?? "Computer"}. Isolated computer — files and logins stay here.`}
        </div>
        <div className="profile">
          {computer?.controlHolder === "user" ? (
            <button
              className="btn"
              type="button"
              onClick={() => {
                if (!bot) return;
                void client.computer
                  .release({ botId: bot.id })
                  .then(setComputer)
                  .catch((caught: unknown) =>
                    setError(
                      caught instanceof Error
                        ? caught.message
                        : "Could not continue",
                    ),
                  );
              }}
            >
              Continue
            </button>
          ) : (
            <button
              className="btn ghost"
              type="button"
              onClick={() => {
                if (!bot) return;
                void client.computer
                  .takeover({ botId: bot.id })
                  .then(setComputer)
                  .catch((caught: unknown) =>
                    setError(
                      caught instanceof Error
                        ? caught.message
                        : "Could not take over",
                    ),
                  );
              }}
            >
              Take over
            </button>
          )}
          <p className="lede" style={{ fontSize: 14 }}>
            {computer?.teammates && computer.teammates.length > 1
              ? `On this computer: ${computer.teammates.map((item) => item.name).join(", ")}.`
              : "Closing this pane does not stop work."}
          </p>
        </div>
      </aside>
      {profileOpen && bot ? (
        <ProfileModal
          bot={bot}
          onClose={() => setProfileOpen(false)}
          onSaved={async () => {
            await refreshBots(bot.id);
          }}
        />
      ) : null}
      {newOpen ? (
        <NewBotModal
          onClose={() => setNewOpen(false)}
          onCreated={async (id) => {
            setNewOpen(false);
            await refreshBots(id);
          }}
        />
      ) : null}
      {settingsOpen ? (
        <SettingsModal
          theme={theme}
          onTheme={(value) => {
            setTheme(value);
            applyTheme(value);
          }}
          onClose={() => setSettingsOpen(false)}
          onSignOut={() => {
            void (async () => {
              await authClient.signOut();
              queryClient.clear();
              await router.invalidate();
              await navigate({ to: "/" });
            })();
          }}
        />
      ) : null}
    </div>
  );
}

function ProfileModal(props: {
  bot: Bot;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(props.bot.name);
  const [title, setTitle] = useState(props.bot.title);
  const [description, setDescription] = useState(props.bot.description);
  const [color, setColor] = useState(props.bot.avatarColor);
  const [shape, setShape] = useState(props.bot.avatarShape);
  const [busy, setBusy] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(
    props.bot.guestKind !== "off",
  );
  const [guestBusy, setGuestBusy] = useState(false);
  const [guestError, setGuestError] = useState("");
  const [issued, setIssued] = useState<{
    token: string;
    command: string;
    kind: string;
  } | null>(null);
  return (
    <ModalShell onClose={props.onClose}>
      <p className="kicker">Bot actions</p>
      <h2>Edit profile</h2>
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          margin: "12px 0",
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
        <input value={name} onChange={(e) => setName(e.target.value)} />
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
      <div className="row">
        <button
          className="btn"
          type="button"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void client.bots
              .update({
                botId: props.bot.id,
                name,
                title,
                description,
                instructions: description,
                avatarColor: color,
                avatarShape: shape,
              })
              .then(async () => {
                await props.onSaved();
                props.onClose();
              })
              .finally(() => setBusy(false));
          }}
        >
          Save
        </button>
        <button className="btn ghost" type="button" onClick={props.onClose}>
          Close
        </button>
      </div>
      <button
        className="btn ghost tiny"
        type="button"
        style={{ marginTop: 20 }}
        onClick={() => setAdvancedOpen((open) => !open)}
      >
        {advancedOpen ? "Hide advanced" : "Advanced"}
      </button>
      {advancedOpen ? (
        <div className="advanced">
          <p className="kicker">External agent</p>
          <p className="lede" style={{ fontSize: 14, marginBottom: 12 }}>
            Off by default. Hermes or OpenClaw connect outbound to this bot.
            Grogbot stays the host; they bring their own keys and files.
          </p>
          <p className="lede" style={{ fontSize: 14 }}>
            {props.bot.guestKind === "off"
              ? "Using Grogbot’s runtime."
              : props.bot.guestOnline
                ? `${props.bot.guestKind} is connected.`
                : `Waiting for ${props.bot.guestKind} to connect.`}
          </p>
          <div className="row">
            {(["hermes", "openclaw"] as GuestAgentKind[]).map((kind) => (
              <button
                key={kind}
                className={`chip${props.bot.guestKind === kind ? " on" : ""}`}
                type="button"
                disabled={guestBusy}
                onClick={() => {
                  setGuestBusy(true);
                  setGuestError("");
                  void client.guests
                    .enable({ botId: props.bot.id, kind })
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
            {props.bot.guestKind !== "off" ? (
              <button
                className="btn ghost tiny"
                type="button"
                disabled={guestBusy}
                onClick={() => {
                  setGuestBusy(true);
                  setIssued(null);
                  void client.guests
                    .disable({ botId: props.bot.id })
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
    </ModalShell>
  );
}

function NewBotModal(props: {
  onClose: () => void;
  onCreated: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [computer, setComputer] = useState<"default" | "new" | string>(
    "default",
  );
  const [busy, setBusy] = useState(false);
  const desksQuery = useQuery(orpc.computers.list.queryOptions());
  const desks = desksQuery.data ?? [];
  return (
    <ModalShell onClose={props.onClose}>
      <p className="kicker">New</p>
      <h2>Create new agent</h2>
      <label className="field">
        <span>Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} />
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
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <p className="kicker" style={{ marginTop: 16 }}>
        Computer
      </p>
      <p className="lede" style={{ fontSize: 14, marginBottom: 12 }}>
        The default computer is shared. Create a new computer only for private
        logins.
      </p>
      <div className="chips">
        <button
          type="button"
          className={`chip${computer === "default" ? " on" : ""}`}
          onClick={() => setComputer("default")}
        >
          {desks.find((item) => item.isDefault)?.name ?? DEFAULT_COMPUTER_NAME}
        </button>
        {desks
          .filter((item) => !item.isDefault)
          .map((item) => (
            <button
              key={item.id}
              type="button"
              className={`chip${computer === item.id ? " on" : ""}`}
              onClick={() => setComputer(item.id)}
            >
              {item.name}
            </button>
          ))}
        <button
          type="button"
          className={`chip${computer === "new" ? " on" : ""}`}
          onClick={() => setComputer("new")}
        >
          New computer
        </button>
      </div>
      <div className="row">
        <button
          className="btn"
          type="button"
          disabled={busy || !name.trim()}
          onClick={() => {
            setBusy(true);
            void client.bots
              .create({
                name,
                title,
                description,
                instructions: description,
                computer,
              })
              .then((bot) => props.onCreated(bot.id))
              .finally(() => setBusy(false));
          }}
        >
          Create
        </button>
        <button className="btn ghost" type="button" onClick={props.onClose}>
          Close
        </button>
      </div>
    </ModalShell>
  );
}

function SettingsModal(props: {
  theme: Theme;
  onTheme: (theme: Theme) => void;
  onClose: () => void;
  onSignOut: () => void;
}) {
  return (
    <ModalShell onClose={props.onClose}>
      <p className="kicker">Appearance</p>
      <h2>Settings</h2>
      <div className="chips">
        {(["system", "light", "dark"] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={`chip${props.theme === value ? " on" : ""}`}
            onClick={() => props.onTheme(value)}
          >
            {value}
          </button>
        ))}
      </div>
      <p className="lede" style={{ marginTop: 16 }}>
        First-task recipe: {FIRST_TASK}
      </p>
      <div className="row">
        <button className="btn ghost" type="button" onClick={props.onSignOut}>
          Sign out
        </button>
        <button className="btn" type="button" onClick={props.onClose}>
          Done
        </button>
      </div>
    </ModalShell>
  );
}
