import { type ChildProcess, spawn } from "node:child_process";
import readline from "node:readline";
import type { AgentRunRequest, AgentRuntimeEvent } from "@groxbot/adapter-kit";

interface Pending {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
}

export function guestCommand(kind: string): {
  command: string;
  args: string[];
} {
  if (kind === "openclaw") {
    return {
      command: process.env.OPENCLAW_BIN ?? "openclaw",
      args: ["acp"],
    };
  }
  return {
    command: process.env.HERMES_BIN ?? "hermes",
    args: ["acp"],
  };
}

export class AcpSession {
  private nextId = 1;
  private readonly pending = new Map<number, Pending>();
  private child: ChildProcess;
  private sessionId = "";
  private chunks: string[] = [];
  private emit?: (event: AgentRuntimeEvent) => Promise<void>;

  constructor(
    command: string,
    args: string[],
    private readonly cwd: string,
  ) {
    this.child = spawn(command, args, {
      cwd,
      stdio: ["pipe", "pipe", "inherit"],
    });
    const stdout = this.child.stdout;
    if (!stdout) throw new Error("ACP agent has no stdout");
    const rl = readline.createInterface({ input: stdout });
    rl.on("line", (line) => {
      let msg: {
        id?: number;
        result?: unknown;
        error?: { message?: string };
        method?: string;
        params?: Record<string, unknown>;
      };
      try {
        msg = JSON.parse(line) as typeof msg;
      } catch {
        return;
      }
      if (msg.method === "session/request_permission" && msg.id) {
        this.respond(msg.id, {
          outcome: { outcome: "selected", optionId: "allow-once" },
        });
        return;
      }
      if (msg.method === "session/update") {
        const update = msg.params?.update as
          | { sessionUpdate?: string; content?: { text?: string } }
          | undefined;
        const text = update?.content?.text;
        if (
          text &&
          (update?.sessionUpdate === "agent_message_chunk" ||
            update?.sessionUpdate === "agent_thought_chunk")
        ) {
          this.chunks.push(text);
          void this.emit?.({ type: "progress", text });
        }
        return;
      }
      if (msg.id && this.pending.has(msg.id)) {
        const waiter = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) {
          waiter?.reject(new Error(msg.error.message ?? "acp error"));
        } else waiter?.resolve(msg.result);
      }
    });
  }

  private send(method: string, params: unknown): Promise<unknown> {
    const id = this.nextId++;
    this.child.stdin?.write(
      `${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`,
    );
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  private respond(id: number, result: unknown): void {
    this.child.stdin?.write(
      `${JSON.stringify({ jsonrpc: "2.0", id, result })}\n`,
    );
  }

  async start(): Promise<void> {
    await this.send("initialize", {
      protocolVersion: 1,
      clientCapabilities: {
        fs: { readTextFile: false, writeTextFile: false },
        terminal: false,
      },
      clientInfo: { name: "groxbot-guest", version: "0.0.1" },
    });
    const created = (await this.send("session/new", {
      cwd: this.cwd,
      mcpServers: [],
    })) as { sessionId?: string };
    this.sessionId = created.sessionId ?? "";
  }

  async prompt(
    request: AgentRunRequest,
    emit: (event: AgentRuntimeEvent) => Promise<void>,
  ): Promise<void> {
    this.emit = emit;
    this.chunks = [];
    const text = [
      request.instructions ? `Instructions:\n${request.instructions}\n` : "",
      request.prompt,
    ]
      .filter(Boolean)
      .join("\n");
    await emit({ type: "progress", text: "working…" });
    await this.send("session/prompt", {
      sessionId: this.sessionId,
      prompt: [{ type: "text", text }],
    });
    const reply = this.chunks.join("") || "Done.";
    await emit({ type: "text", text: reply });
    await emit({ type: "done", text: reply });
    this.emit = undefined;
  }

  close(): void {
    this.child.kill();
  }
}
