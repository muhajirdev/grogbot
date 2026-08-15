import { randomUUID } from "node:crypto";
import type {
  AdapterContext,
  CommandRequest,
  ComputerRef,
  ProcessEvent,
  SandboxProvider,
} from "@grogbot/adapter-kit";

export class FakeSandboxProvider implements SandboxProvider {
  readonly boxes = new Map<string, ComputerRef>();

  async provision(
    request: { botId: string; homePath: string },
    _context: AdapterContext,
  ): Promise<ComputerRef> {
    const ref: ComputerRef = {
      id: `fake-${request.botId}-${randomUUID().slice(0, 8)}`,
      botId: request.botId,
      kind: "fake",
      providerRef: request.homePath,
    };
    this.boxes.set(ref.id, ref);
    return ref;
  }

  async *execute(
    _computer: ComputerRef,
    request: CommandRequest,
    _context: AdapterContext,
  ): AsyncIterable<ProcessEvent> {
    yield { type: "stdout", data: `[fake] ${request.argv.join(" ")}\n` };
    yield { type: "exit", code: 0 };
  }

  async stop(computer: ComputerRef): Promise<void> {
    this.boxes.delete(computer.id);
  }

  async destroy(computer: ComputerRef): Promise<void> {
    this.boxes.delete(computer.id);
  }
}

export function createSandboxProvider(kind: string): SandboxProvider {
  switch (kind) {
    case "fake":
      return new FakeSandboxProvider();
    case "docker":
    case "e2b":
    case "desktop":
      throw new Error(
        `${kind} sandbox is not implemented yet. Use SANDBOX_PROVIDER=fake for this scaffold.`,
      );
    default:
      throw new Error(`Unknown SANDBOX_PROVIDER "${kind}"`);
  }
}
