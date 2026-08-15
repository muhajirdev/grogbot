import { serve } from "@hono/node-server";
import { loadRootEnv } from "./load-root-env.js";

loadRootEnv();

import { createApp } from "./app.js";
import { loadEnv } from "./env.js";

const env = loadEnv();
const { app } = createApp(env);

serve({ fetch: app.fetch, port: 3100, hostname: "127.0.0.1" }, () => {
  console.log("grogbot api http://127.0.0.1:3100");
});
