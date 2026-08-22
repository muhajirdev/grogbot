import type { AgentRunRequest, AgentRuntimeEvent } from "@groxbot/adapter-kit";

export interface GuestClient {
  hello(): Promise<{ sessionId: string; botId: string; name: string }>;
  wait(): Promise<Record<string, unknown>>;
  event(runId: string, event: AgentRuntimeEvent): Promise<void>;
  bye(): Promise<void>;
}

export function createGuestClient(opts: {
  url: string;
  token: string;
  kind: string;
}): GuestClient {
  const base = opts.url.replace(/\/$/, "");
  let sessionId = "";

  async function post(path: string, body: unknown): Promise<unknown> {
    const response = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error =
        json && typeof json === "object" && "error" in json
          ? String(json.error)
          : `guest ${response.status}`;
      throw new Error(error);
    }
    return json;
  }

  return {
    async hello() {
      const result = (await post("/guest/hello", {
        token: opts.token,
        kind: opts.kind,
      })) as { sessionId: string; botId: string; name: string };
      sessionId = result.sessionId;
      return result;
    },
    async wait() {
      return (await post("/guest/wait", { sessionId })) as Record<
        string,
        unknown
      >;
    },
    async event(runId, event) {
      await post("/guest/event", { sessionId, runId, event });
    },
    async bye() {
      if (!sessionId) return;
      await post("/guest/bye", { sessionId }).catch(() => undefined);
    },
  };
}

export async function runFake(
  request: AgentRunRequest,
  emit: (event: AgentRuntimeEvent) => Promise<void>,
): Promise<void> {
  await emit({ type: "progress", text: "working…" });
  await new Promise((resolve) => setTimeout(resolve, 80));
  const text = `Guest: ${request.prompt}`;
  await emit({ type: "text", text });
  await emit({ type: "done", text });
}
