import type {
  ComputerStatus,
  ProductEvent,
  ThreadMessage,
} from "@grogbot/contracts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppSettings } from "../components/AppSettings";
import { AvatarMark } from "../components/Avatar";
import { BotSettingsPane } from "../components/BotSettingsPane";
import { ComputerCard } from "../components/ComputerCard";
import { ComputerPane } from "../components/ComputerPane";
import {
  MicIcon,
  MonitorIcon,
  PlugIcon,
  PlusIcon,
  SearchIcon,
} from "../components/Icons";
import { PluginsModal } from "../components/PluginsModal";
import { authClient } from "../lib/auth";
import { isModelSetupError, userFacingError } from "../lib/errors";
import { AVATAR_COLORS, FIRST_TASK } from "../lib/jobs";
import { orpc } from "../lib/orpc";
import { client } from "../lib/rpc";
import { cacheCreatedBot } from "../lib/session";
import { applyTheme, readTheme, type Theme } from "../lib/theme";
import { dayKey, formatDaySep, formatListTime } from "../lib/time";
import { Button, cn } from "../ui";

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

function messageText(message: ThreadMessage): string {
  return message.blocks
    .filter((block) => block.kind === "text")
    .map((block) => block.text)
    .join("\n");
}

function lastHumanBefore(messages: ThreadMessage[], index: number): string {
  for (let i = index - 1; i >= 0; i -= 1) {
    const item = messages[i];
    if (item?.actorType === "human") return messageText(item);
  }
  return "Computer";
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0]?.slice(0, 2) ?? "?").toUpperCase();
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

export function Office(props: { botId: string }) {
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const botsQuery = useQuery(orpc.bots.list.queryOptions());
  const meQuery = useQuery(orpc.me.queryOptions());
  const bots = botsQuery.data ?? [];
  const me = meQuery.data;
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [working, setWorking] = useState("");
  const [computer, setComputer] = useState<ComputerStatus | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"general" | "models">(
    "general",
  );
  const [pluginsOpen, setPluginsOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [paneMode, setPaneMode] = useState<"computer" | "settings" | null>(
    null,
  );
  const [theme, setTheme] = useState<Theme>(readTheme());
  const scroller = useRef<HTMLDivElement>(null);
  const bot = bots.find((item) => item.id === props.botId) ?? bots[0];
  const activeId = bot?.id;
  const q = search.trim().toLowerCase();
  const visibleBots = useMemo(() => {
    const list = q
      ? bots.filter((item) => item.name.toLowerCase().includes(q))
      : bots;
    return [...list].sort(
      (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime(),
    );
  }, [bots, q]);

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

  const hire = useCallback(
    async (computerChoice: "default" | "new" = "default") => {
      setNewOpen(false);
      try {
        const created = await client.bots.create({
          name: "New Bot",
          avatarColor: AVATAR_COLORS[0],
          computer: computerChoice,
        });
        cacheCreatedBot(queryClient, created);
        await queryClient.invalidateQueries({ queryKey: orpc.bots.key() });
        await navigate({ to: "/$botId", params: { botId: created.id } });
        setPaneMode("settings");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not create");
      }
    },
    [navigate, queryClient],
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n") {
        event.preventDefault();
        void hire();
      }
      if ((event.metaKey || event.ctrlKey) && event.key === ",") {
        event.preventDefault();
        setSettingsTab("general");
        setSettingsOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hire]);

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
            void queryClient.invalidateQueries({ queryKey: orpc.bots.key() });
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
    if (me?.needsModel) {
      setSettingsTab("models");
      setSettingsOpen(true);
      setError("Add a model key to talk to teammates.");
      return;
    }
    const text = draft.trim();
    setDraft("");
    setWorking("working…");
    setError("");
    try {
      await client.threads.send({ botId: bot.id, text });
    } catch (caught) {
      setDraft(text);
      setWorking("");
      const message = userFacingError(caught, "Could not send");
      setError(message);
      if (isModelSetupError(message)) {
        setSettingsTab("models");
        setSettingsOpen(true);
      }
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
    return "Done";
  }, [bot, computer, working]);

  const computerBody = useMemo(() => {
    if (computer?.controlHolder === "user")
      return "You're in control. Sign in, 2FA, or pay here — not in chat.";
    if (bot?.guestKind && bot.guestKind !== "off" && !bot.guestOnline)
      return `Waiting for ${bot.guestKind} to connect from your machine.`;
    if (computer?.usingBotId && computer.usingBotId !== bot?.id)
      return `${computer.usingBotName} has the mouse on ${computer.name}. Files and logins are shared; one mouse at a time.`;
    if (working)
      return `${bot?.name ?? "Bot"} is using ${computer?.name ?? "this computer"}.\n${working}`;
    return `${computer?.name ?? "Computer"}. Work continues if you close this.`;
  }, [bot, computer, working]);

  return (
    <div
      className={cn(
        "office-shell relative grid h-screen bg-bg",
        paneMode
          ? "grid-cols-[280px_minmax(0,1fr)_320px]"
          : "grid-cols-[280px_minmax(0,1fr)]",
      )}
    >
      <aside className="flex min-h-0 flex-col border-r border-line bg-bg-side px-2.5 pb-2">
        <div className="flex flex-col gap-2 px-0.5 pt-1.5 pb-2.5">
          <div className="side-chrome drag flex min-h-9 items-center">
            <div className="min-w-0 flex-1" />
            <div className="no-drag relative shrink-0">
              <Button
                variant="icon"
                type="button"
                aria-label="New"
                onClick={() => setNewOpen((open) => !open)}
              >
                <PlusIcon />
              </Button>
              {newOpen ? (
                <div className="menu">
                  <button type="button" onClick={() => void hire("default")}>
                    Create new agent
                  </button>
                  <button type="button" onClick={() => void hire("new")}>
                    Create with new computer
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          <label className="search-field">
            <SearchIcon />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
            />
          </label>
        </div>
        <div className="grid flex-1 content-start gap-0.5 overflow-auto px-1">
          {visibleBots.map((item) => (
            <Link
              key={item.id}
              to="/$botId"
              params={{ botId: item.id }}
              className={cn(
                "office-conv grid min-w-0 grid-cols-[40px_minmax(0,1fr)] items-center gap-2.5 rounded-[14px] border-0 bg-transparent px-2 py-2.5 text-left text-inherit no-underline",
                item.id === bot?.id && "bg-selected",
              )}
            >
              <AvatarMark
                name={item.name}
                color={item.avatarColor}
                shape={item.avatarShape}
                mood={item.id === bot?.id && working ? "working" : "idle"}
              />
              <span className="office-conv-copy min-w-0">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold">{item.name}</span>
                  <span className="shrink-0 text-[11px] whitespace-nowrap text-muted">
                    {formatListTime(item.lastAt)}
                  </span>
                </span>
                <div className="mt-0.5 overflow-hidden text-xs text-ellipsis whitespace-nowrap text-muted">
                  {item.lastPreview || item.title || "No messages yet"}
                </div>
              </span>
            </Link>
          ))}
          {visibleBots.length === 0 ? (
            <p className="empty">No teammates yet.</p>
          ) : null}
        </div>
        <div className="office-foot mt-auto grid gap-1 px-1.5 pt-2 pb-1">
          <button
            className="flex w-full items-center gap-2.5 rounded-xl border-0 bg-transparent px-2 py-2 text-left text-inherit hover:bg-hover"
            type="button"
            onClick={() => setPluginsOpen(true)}
          >
            <PlugIcon />
            <span>Plugins</span>
          </button>
          <button
            className="flex w-full items-center gap-2.5 rounded-xl border-0 bg-transparent px-2 py-2 text-left text-inherit hover:bg-hover"
            type="button"
            onClick={() => {
              setSettingsTab("general");
              setSettingsOpen(true);
            }}
          >
            <span
              className="avatar circle"
              style={{ background: "#4d5568", width: 28, height: 28 }}
            >
              {initials(me?.name ?? "You")}
            </span>
            <span>{me?.name || "You"}</span>
          </button>
        </div>
      </aside>
      <section className="flex min-h-0 flex-col bg-bg-thread">
        <div className="thread-head drag flex items-center justify-between gap-2 border-b border-line px-[18px] py-2.5">
          <button
            className="no-drag flex items-center gap-2.5 border-0 bg-transparent p-0 text-inherit"
            type="button"
            onClick={() => setPaneMode("settings")}
          >
            {bot ? (
              <AvatarMark
                name={bot.name}
                color={bot.avatarColor}
                shape={bot.avatarShape}
                mood={working ? "working" : "idle"}
                size="sm"
              />
            ) : null}
            <strong className="text-[15px] font-semibold tracking-tight">
              {bot?.name ?? "—"}
            </strong>
          </button>
          <div className="no-drag flex flex-wrap items-center gap-1.5">
            {working ? (
              <Button
                variant="mini"
                type="button"
                onClick={() =>
                  bot && void client.threads.stop({ botId: bot.id })
                }
              >
                Stop now
              </Button>
            ) : null}
            <Button
              variant="icon"
              type="button"
              aria-label="Computer"
              title="Computer"
              on={paneMode === "computer"}
              onClick={() =>
                setPaneMode(paneMode === "computer" ? null : "computer")
              }
            >
              <MonitorIcon />
            </Button>
          </div>
        </div>
        {me?.needsModel || me?.modelWarning ? (
          <div className="mx-5 mb-2 flex items-center justify-between gap-3 rounded-xl border border-line bg-card px-3 py-2.5 text-[13px]">
            <span>
              {me?.needsModel
                ? "Add a model key to talk to teammates."
                : me?.modelWarning}
            </span>
            <Button
              variant="text"
              type="button"
              onClick={() => {
                setSettingsTab("models");
                setSettingsOpen(true);
              }}
            >
              Open models
            </Button>
          </div>
        ) : null}
        <div
          className="grid flex-1 content-start gap-2.5 overflow-auto px-7 pt-2 pb-6"
          ref={scroller}
        >
          {messages.map((message, index) => {
            const prev = messages[index - 1];
            const showDay =
              !prev || dayKey(prev.createdAt) !== dayKey(message.createdAt);
            const text = messageText(message);
            const lastInRun =
              Boolean(message.runId) &&
              message.actorType === "bot" &&
              !messages
                .slice(index + 1)
                .some((item) => item.runId === message.runId);
            const latestRun =
              lastInRun &&
              !messages
                .slice(index + 1)
                .some((item) => item.actorType === "bot" && item.runId);
            const human = message.actorType === "human";
            return (
              <div key={message.id} className="contents">
                {showDay ? (
                  <div className="my-2.5 mb-1 text-center text-xs text-muted">
                    {formatDaySep(message.createdAt)}
                  </div>
                ) : null}
                {text ? (
                  <div
                    className={cn(
                      "max-w-[72%] rounded-[18px] px-3.5 py-2.5 text-[15px] leading-snug whitespace-pre-wrap",
                      human
                        ? "justify-self-end border border-[#2a2a2a] bg-[#1a1a1a] light:border-line light:bg-white"
                        : "justify-self-start bg-[#141414] light:bg-[#ececec]",
                    )}
                  >
                    {text}
                  </div>
                ) : null}
                {lastInRun ? (
                  <ComputerCard
                    title={lastHumanBefore(messages, index)}
                    status={
                      latestRun && working
                        ? "Working"
                        : latestRun && computer?.controlHolder === "user"
                          ? "You're in control"
                          : "Done"
                    }
                    done={!(latestRun && working)}
                    preview={
                      latestRun &&
                      (working || computer?.controlHolder === "user")
                        ? computerBody
                        : undefined
                    }
                    onOpen={() => setPaneMode("computer")}
                  />
                ) : null}
              </div>
            );
          })}
          {working &&
          !messages.some(
            (item, index) =>
              item.runId &&
              item.actorType === "bot" &&
              !messages
                .slice(index + 1)
                .some((later) => later.runId === item.runId),
          ) ? (
            <ComputerCard
              title={draft || lastHumanBefore(messages, messages.length)}
              status="Working"
              preview={computerBody}
              onOpen={() => setPaneMode("computer")}
            />
          ) : null}
          {!working && messages.length === 0 ? (
            <p className="mb-6 text-base leading-normal text-muted">
              First message is a real task. A good handoff has an outcome,
              sources, and when to stop.
            </p>
          ) : null}
        </div>
        <div className="px-5 pt-2 pb-[18px]">
          {error ? <p className="mb-2 text-[13px] text-danger">{error}</p> : null}
          <form
            className="grid grid-cols-[auto_1fr_auto] items-end gap-1.5 rounded-pill border border-[#262626] bg-[#141414] py-1.5 pr-2 pl-2.5 light:border-line light:bg-white"
            onSubmit={(event) => void send(event)}
          >
            <Button
              variant="icon"
              className="size-[34px] rounded-pill"
              type="button"
              aria-label="Attach"
              title="Attach"
            >
              <PlusIcon />
            </Button>
            <textarea
              rows={1}
              className="max-h-[140px] min-h-6 resize-none border-0 bg-transparent px-1 py-2 outline-none"
              value={draft}
              placeholder={
                me?.needsModel
                  ? "Add a model key to send"
                  : messages.length === 0
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
            <Button
              variant="icon"
              className="size-[34px] rounded-pill"
              type="button"
              aria-label="Voice"
              title="Voice"
            >
              <MicIcon />
            </Button>
          </form>
        </div>
      </section>
      {paneMode === "computer" && bot ? (
        <ComputerPane
          bot={bot}
          computer={computer}
          statusLabel={statusLabel}
          body={computerBody}
          working={Boolean(working)}
          onSettings={() => setPaneMode("settings")}
          onCollapse={() => setPaneMode(null)}
          onTakeover={() => {
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
          onRelease={() => {
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
        />
      ) : null}
      {paneMode === "settings" && bot ? (
        <BotSettingsPane
          bot={bot}
          computer={computer}
          onCollapse={() => setPaneMode(null)}
          onSaved={async () => {
            await refreshBots(bot.id);
          }}
        />
      ) : null}
      {pluginsOpen ? (
        <PluginsModal onClose={() => setPluginsOpen(false)} />
      ) : null}
      {settingsOpen ? (
        <AppSettings
          me={me}
          theme={theme}
          initialTab={settingsTab}
          onTheme={(value) => {
            setTheme(value);
            applyTheme(value);
          }}
          onClose={() => {
            setSettingsOpen(false);
            setSettingsTab("general");
          }}
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
