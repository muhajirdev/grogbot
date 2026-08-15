import { existsSync } from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { PostgresWakeupDriver, ScriptedAgentRuntime } from "@rekan/adapters";
import { createDb } from "@rekan/db";

function loadRootEnv() {
  let dir = process.cwd();
  for (let i = 0; i < 8; i += 1) {
    const candidate = path.join(dir, ".env");
    if (existsSync(candidate)) {
      config({ path: candidate, override: false });
      return;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
}
loadRootEnv();

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  const { db } = createDb(databaseUrl);
  const wakeup = new PostgresWakeupDriver(db);
  const runtime = new ScriptedAgentRuntime();

  await wakeup.start({
    "run.continue": async (payload) => {
      console.log("run.continue", payload.runId, runtime.constructor.name);
    },
    "routine.wakeup": async (payload) => {
      console.log("routine.wakeup", payload.routineId);
    },
    "computer.sleep": async (payload) => {
      console.log("computer.sleep", payload.botId);
    },
  });

  console.log("rekan worker ready");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
