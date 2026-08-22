import type {
  AdapterContext,
  AgentRunRequest,
  AgentRuntime,
  AgentRuntimeEvent,
} from "@groxbot/adapter-kit";
import type { GuestHub } from "./guest-hub.js";

export class GuestAgentRuntime implements AgentRuntime {
  constructor(private readonly hub: GuestHub) {}

  async abort(runId: string): Promise<void> {
    this.hub.abortRun(runId);
  }

  abortBot(botId: string): void {
    this.hub.abort(botId);
  }

  async *run(
    request: AgentRunRequest,
    context: AdapterContext,
  ): AsyncIterable<AgentRuntimeEvent> {
    yield* this.hub.forwardRun(request, context.signal);
  }
}
