import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { AgentRunError, init } from "@flue/runtime";
import { type Flue, sqlite, start } from "@flue/runtime/node";
import type {
  AdapterContext,
  AgentRunRequest,
  AgentRuntime,
  AgentRuntimeEvent,
} from "@grogbot/adapter-kit";
import { setTeammateTurn, teammateInstanceId } from "./context.js";
import { createEchoProvider, ECHO_MODEL } from "./echo.js";
import { Teammate } from "./teammate.js";

export interface FlueRuntimeOptions {
  echo?: boolean;
  env?: NodeJS.ProcessEnv;
}

function envValue(source: NodeJS.ProcessEnv, key: string): string | undefined {
  const value = source[key]?.trim();
  return value || undefined;
}

export function resolveFlueModel(
  echo: boolean,
  source: NodeJS.ProcessEnv = process.env,
): string {
  if (echo) return ECHO_MODEL;
  const explicit = envValue(source, "GROGBOT_MODEL");
  if (explicit) return explicit;
  if (envValue(source, "ANTHROPIC_API_KEY")) {
    return "anthropic/claude-sonnet-4-6";
  }
  if (envValue(source, "OPENAI_API_KEY")) return "openai/gpt-4o-mini";
  if (envValue(source, "OPENROUTER_API_KEY")) {
    return "openrouter/deepseek/deepseek-v4-flash-0731";
  }
  throw new Error(
    "AGENT_RUNTIME=flue needs GROGBOT_MODEL or a provider API key. Use AGENT_RUNTIME=flue-echo or scripted offline.",
  );
}

export function flueConfigured(
  source: NodeJS.ProcessEnv = process.env,
): boolean {
  try {
    resolveFlueModel(false, source);
    return true;
  } catch {
    return false;
  }
}

function persistence(source: NodeJS.ProcessEnv) {
  const file = envValue(source, "FLUE_DB_PATH");
  const dataDir = envValue(source, "DATA_DIR");
  const path =
    file ?? (dataDir ? `${dataDir.replace(/\/$/, "")}/flue.sqlite` : undefined);
  if (!path) return undefined;
  mkdirSync(dirname(path), { recursive: true });
  return sqlite(path);
}

/**
 * Pi harness via Flue `start()` in this Node process.
 * One Teammate type; instances are `botId:threadId`.
 */
export class FlueAgentRuntime implements AgentRuntime {
  private readonly echo: boolean;
  private readonly env: NodeJS.ProcessEnv;
  private model: string | undefined;
  private boot: Promise<Flue> | undefined;
  private flue: Flue | undefined;
  private readonly running = new Map<
    string,
    { abort: AbortController; instanceId: string }
  >();

  constructor(options: FlueRuntimeOptions = {}) {
    this.echo = options.echo === true;
    this.env = options.env ?? process.env;
  }

  private resolvedModel(): string {
    this.model ??= resolveFlueModel(this.echo, this.env);
    return this.model;
  }

  async abort(runId: string): Promise<void> {
    const current = this.running.get(runId);
    current?.abort.abort();
    if (!current || !this.boot) return;
    await this.ensureStarted();
    await init(Teammate, { id: current.instanceId }).abort();
  }

  async stop(): Promise<void> {
    if (!this.boot) return;
    const flue = this.flue ?? (await this.boot);
    await flue.stop();
    this.flue = undefined;
    this.boot = undefined;
  }

  async *run(
    request: AgentRunRequest,
    context: AdapterContext,
  ): AsyncIterable<AgentRuntimeEvent> {
    const instanceId = teammateInstanceId(request.botId, request.threadId);
    const controller = new AbortController();
    this.running.set(request.runId, { abort: controller, instanceId });
    const signal = mergeSignals(context.signal, controller.signal);
    yield { type: "progress", text: "working…" };
    try {
      const model = this.resolvedModel();
      await this.ensureStarted();
      setTeammateTurn(instanceId, {
        instructions: request.instructions,
        model,
      });
      const handle = init(Teammate, { id: instanceId });
      const receipt = await handle.dispatch({
        message: { kind: "user", body: request.prompt },
      });
      const reply = await handle.read(receipt, { signal });
      if (signal.aborted) {
        yield { type: "done", text: reply.text || "stopped" };
        return;
      }
      const text = reply.text.trim();
      if (!text) throw new Error("Flue returned an empty reply");
      yield { type: "text", text };
      yield { type: "done", text };
    } catch (error) {
      if (isAbortError(error) || signal.aborted) {
        yield { type: "done", text: "stopped" };
        return;
      }
      const message =
        error instanceof AgentRunError
          ? error.cause instanceof Error
            ? error.cause.message
            : error.message
          : error instanceof Error
            ? error.message
            : "Flue run failed";
      yield { type: "error", text: message };
    } finally {
      this.running.delete(request.runId);
    }
  }

  private ensureStarted(): Promise<Flue> {
    this.boot ??= this.start();
    return this.boot;
  }

  private async start(): Promise<Flue> {
    const echo = this.echo ? createEchoProvider() : undefined;
    const flue = await start({
      agents: [Teammate],
      db: persistence(this.env),
      env: this.env,
      providers: echo ? [echo.provider] : undefined,
    });
    this.flue = flue;
    return flue;
  }
}

let shared: FlueAgentRuntime | undefined;

export function getFlueAgentRuntime(
  echo: boolean,
  env: NodeJS.ProcessEnv = process.env,
): FlueAgentRuntime {
  shared ??= new FlueAgentRuntime({ echo, env });
  return shared;
}

export async function stopFlueAgentRuntime(): Promise<void> {
  if (!shared) return;
  await shared.stop();
  shared = undefined;
}

function mergeSignals(
  left: AbortSignal | undefined,
  right: AbortSignal,
): AbortSignal {
  if (!left) return right;
  return AbortSignal.any([left, right]);
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof Error && error.name === "AbortError") ||
    (typeof DOMException !== "undefined" &&
      error instanceof DOMException &&
      error.name === "AbortError")
  );
}
