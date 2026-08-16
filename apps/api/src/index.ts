import { createAgentRuntime } from "@grogbot/adapters";
import { createWakeHandlers } from "@grogbot/core";
import { serve } from "@hono/node-server";
import { loadRootEnv } from "./load-root-env.js";

loadRootEnv();

import { createApp } from "./app.js";
import { agentRuntimeSource, loadEnv } from "./env.js";

async function main() {
  const env = loadEnv();
  const handles = createApp(env);

  if (!env.workerUrl) {
    const runtime = createAgentRuntime(
      env.agentRuntime,
      agentRuntimeSource(env),
    );
    await handles.wakeup.start(
      createWakeHandlers({
        db: handles.db,
        runtime,
        wakeup: handles.wakeup,
        guests: handles.guests,
        bindRuntime: (overlay) =>
          createAgentRuntime(env.agentRuntime, overlay.env),
      }),
    );
  }

  serve({ fetch: handles.app.fetch, port: 3100, hostname: "127.0.0.1" }, () => {
    console.log("grogbot api http://127.0.0.1:3100");
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
