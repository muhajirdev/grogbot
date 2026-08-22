import type {
  AgentRunRequest,
  AgentRuntimeEvent,
  GuestAgentKind,
  HostToGuest,
} from "@groxbot/adapter-kit";
import { GuestOfflineError } from "@groxbot/adapter-kit";
import { newId } from "./ids.js";

interface RunWaiter {
  queue: AgentRuntimeEvent[];
  done: boolean;
  error?: Error;
  wake: () => void;
}

interface GuestSession {
  id: string;
  botId: string;
  kind: GuestAgentKind;
  outbox: HostToGuest[];
  waitWake: () => void;
  runs: Map<string, RunWaiter>;
}

export class GuestHub {
  private readonly byBot = new Map<string, GuestSession>();
  private readonly bySession = new Map<string, GuestSession>();
  private readonly runBots = new Map<string, string>();

  isOnline(botId: string): boolean {
    return this.byBot.has(botId);
  }

  hello(botId: string, kind: GuestAgentKind): GuestSession {
    const existing = this.byBot.get(botId);
    if (existing) this.drop(existing, "replaced");
    const session: GuestSession = {
      id: newId(),
      botId,
      kind,
      outbox: [],
      waitWake: () => {},
      runs: new Map(),
    };
    this.byBot.set(botId, session);
    this.bySession.set(session.id, session);
    return session;
  }

  get(sessionId: string): GuestSession | undefined {
    return this.bySession.get(sessionId);
  }

  getByBot(botId: string): GuestSession | undefined {
    return this.byBot.get(botId);
  }

  async wait(
    sessionId: string,
    timeoutMs: number,
    signal?: AbortSignal,
  ): Promise<HostToGuest> {
    const session = this.bySession.get(sessionId);
    if (!session) return { type: "bye", reason: "unknown session" };
    if (session.outbox.length > 0) {
      return session.outbox.shift() ?? { type: "idle" };
    }
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, timeoutMs);
      session.waitWake = () => {
        clearTimeout(timer);
        resolve();
      };
      signal?.addEventListener(
        "abort",
        () => {
          clearTimeout(timer);
          resolve();
        },
        { once: true },
      );
    });
    return session.outbox.shift() ?? { type: "idle" };
  }

  push(botId: string, message: HostToGuest): void {
    const session = this.byBot.get(botId);
    if (!session) return;
    session.outbox.push(message);
    session.waitWake();
  }

  abortRun(runId: string): void {
    const botId = this.runBots.get(runId);
    if (botId) this.abort(botId, runId);
  }

  abort(botId: string, runId?: string): void {
    const session = this.byBot.get(botId);
    if (!session) return;
    if (runId) {
      this.push(botId, { type: "abort", runId });
      const waiter = session.runs.get(runId);
      if (waiter) {
        waiter.error = new Error("aborted");
        waiter.done = true;
        waiter.wake();
      }
      return;
    }
    for (const id of session.runs.keys()) this.abort(botId, id);
  }

  dropBot(botId: string, reason = "revoked"): void {
    const session = this.byBot.get(botId);
    if (session) this.drop(session, reason);
  }

  bye(sessionId: string, reason = "disconnected"): void {
    const session = this.bySession.get(sessionId);
    if (session) this.drop(session, reason);
  }

  stop(): void {
    for (const session of [...this.bySession.values()]) {
      this.drop(session, "stopped");
    }
  }

  async *forwardRun(
    request: AgentRunRequest,
    signal?: AbortSignal,
  ): AsyncIterable<AgentRuntimeEvent> {
    const session = this.byBot.get(request.botId);
    if (!session) throw new GuestOfflineError(request.botId);
    const waiter: RunWaiter = {
      queue: [],
      done: false,
      wake: () => {},
    };
    session.runs.set(request.runId, waiter);
    this.runBots.set(request.runId, request.botId);
    this.push(request.botId, {
      type: "run",
      request: {
        ...request,
        pokeTeammate: undefined,
        composioSearch: undefined,
        composioExecute: undefined,
      },
    });
    try {
      while (!waiter.done) {
        if (signal?.aborted) {
          this.abort(request.botId, request.runId);
          throw new Error("aborted");
        }
        if (waiter.error) throw waiter.error;
        if (waiter.queue.length > 0) {
          const event = waiter.queue.shift();
          if (event) yield event;
          continue;
        }
        await new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, 200);
          waiter.wake = () => {
            clearTimeout(timer);
            resolve();
          };
          signal?.addEventListener(
            "abort",
            () => {
              clearTimeout(timer);
              resolve();
            },
            { once: true },
          );
        });
      }
      while (waiter.queue.length > 0) {
        const event = waiter.queue.shift();
        if (event) yield event;
      }
    } finally {
      session.runs.delete(request.runId);
      this.runBots.delete(request.runId);
    }
  }

  onEvent(sessionId: string, runId: string, event: AgentRuntimeEvent): boolean {
    const session = this.bySession.get(sessionId);
    const waiter = session?.runs.get(runId);
    if (!waiter) return false;
    waiter.queue.push(event);
    if (event.type === "done" || event.type === "error") waiter.done = true;
    if (event.type === "error") waiter.error = new Error(event.text);
    waiter.wake();
    return true;
  }

  private drop(session: GuestSession, reason: string): void {
    for (const waiter of session.runs.values()) {
      waiter.error = new Error(reason);
      waiter.done = true;
      waiter.wake();
    }
    session.runs.clear();
    session.outbox.push({ type: "bye", reason });
    session.waitWake();
    this.byBot.delete(session.botId);
    this.bySession.delete(session.id);
  }
}
