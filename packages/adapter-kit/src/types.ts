import type { SandboxKind } from "@grogbot/contracts";

export interface AdapterContext {
  operationId: string;
  workspaceId: string;
  userId: string;
  botId?: string;
  runId?: string;
  signal: AbortSignal;
}

export interface WakeupJob {
  /** Rivet actor key — the bot, never the room. */
  botId: string;
  name: string;
  payload: Record<string, unknown>;
  runAt?: Date;
  /** Named schedule on that actor (e.g. computer.sleep). Replaces the previous one. */
  jobKey?: string;
}

export interface ComputerRef {
  id: string;
  botId: string;
  kind: SandboxKind;
  providerRef?: string;
}

export interface CommandRequest {
  argv: string[];
  cwd?: string;
}

export type ProcessEvent =
  | { type: "stdout"; data: string }
  | { type: "stderr"; data: string }
  | { type: "exit"; code: number };

export interface AgentRunRequest {
  botId: string;
  threadId: string;
  runId: string;
  prompt: string;
  instructions: string;
  history: Array<{ role: "user" | "assistant" | "system"; content: string }>;
}

export type AgentRuntimeEvent =
  | { type: "text"; text: string }
  | { type: "progress"; text: string }
  | { type: "done"; text?: string };

export interface PortableFile {
  path: string;
  content: string;
}
