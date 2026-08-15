import type {
  AdapterContext,
  AgentRunRequest,
  AgentRuntime,
  AgentRuntimeEvent,
} from "@grogbot/adapter-kit";

export class ScriptedAgentRuntime implements AgentRuntime {
  private running = new Map<string, AbortController>();

  async abort(runId: string): Promise<void> {
    this.running.get(runId)?.abort();
  }

  async *run(
    request: AgentRunRequest,
    context: AdapterContext,
  ): AsyncIterable<AgentRuntimeEvent> {
    const controller = new AbortController();
    this.running.set(request.runId, controller);
    const signal = context.signal ?? controller.signal;
    yield { type: "progress", text: "working…" };
    await new Promise((resolve) => setTimeout(resolve, 450));
    if (signal.aborted) {
      yield { type: "done", text: "stopped" };
      return;
    }
    yield { type: "text", text: `Echo: ${request.prompt}` };
    yield { type: "done", text: request.prompt };
    this.running.delete(request.runId);
  }
}
