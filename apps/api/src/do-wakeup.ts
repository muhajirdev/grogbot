import type { WakeupDriver, WakeupJob } from "@groxbot/adapter-kit";

type ActorStub = {
  fetch: (request: Request) => Promise<Response>;
};

type ActorBinding = {
  idFromName: (name: string) => unknown;
  get: (id: unknown) => ActorStub;
};

export class DurableObjectWakeupDriver implements WakeupDriver {
  constructor(private readonly actors: ActorBinding) {}

  async enqueue(job: WakeupJob): Promise<void> {
    const stub = this.actors.get(this.actors.idFromName(job.botId));
    const response = await stub.fetch(
      new Request("https://groxbot.internal/wakeup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          botId: job.botId,
          name: job.name,
          payload: job.payload,
          runAt: job.runAt?.toISOString(),
          jobKey: job.jobKey,
        }),
      }),
    );
    if (!response.ok) {
      throw new Error(`wakeup ${response.status}`);
    }
  }

  async start(): Promise<void> {}
  async stop(): Promise<void> {}
}
