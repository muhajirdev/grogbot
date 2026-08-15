import type { AgentRuntime, WakeupDriver } from "@grogbot/adapter-kit";
import type { Database } from "@grogbot/db";
import { continueRun, sleepComputer } from "./run-continue.js";

export function createWakeHandlers(opts: {
  db: Database;
  runtime: AgentRuntime;
  wakeup: WakeupDriver;
}) {
  return {
    "run.continue": async (payload: Record<string, unknown>) => {
      const runId = String(payload.runId ?? "");
      const botId = String(payload.botId ?? "");
      if (!runId) return;
      await continueRun({ db: opts.db, runtime: opts.runtime, runId });
      if (botId) {
        await opts.wakeup.enqueue({
          botId,
          name: "computer.sleep",
          payload: { botId },
          runAt: new Date(Date.now() + 45_000),
          jobKey: `computer.sleep:${botId}`,
        });
      }
    },
    "routine.wakeup": async (_payload: Record<string, unknown>) => {},
    "computer.sleep": async (payload: Record<string, unknown>) => {
      const botId = String(payload.botId ?? "");
      if (!botId) return;
      await sleepComputer(opts.db, botId);
    },
  };
}
