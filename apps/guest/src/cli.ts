import type { AgentRunRequest, AgentRuntimeEvent } from "@grogbot/adapter-kit";
import { AcpSession, guestCommand } from "./acp.js";
import { createGuestClient, runFake } from "./client.js";

function arg(name: string, fallback?: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0) return process.argv[index + 1];
  return fallback;
}

function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

async function main() {
  const url = arg("url");
  const token = arg("token");
  const kind = arg("kind", "hermes");
  const runtime = arg("runtime", kind === "generic" ? "fake" : "acp");
  const cwd = arg("cwd", process.cwd()) ?? process.cwd();
  if (!url || !token || !kind) {
    console.error(
      "usage: grogbot-guest --url http://127.0.0.1:3101 --token gbg_… --kind hermes|openclaw|generic [--runtime fake|acp]",
    );
    process.exit(1);
  }

  const client = createGuestClient({ url, token, kind });
  const hello = await client.hello();
  console.log(`connected as ${kind} to ${hello.name} (${hello.botId})`);

  let acp: AcpSession | undefined;
  if (runtime === "acp") {
    const cmd = guestCommand(kind);
    acp = new AcpSession(cmd.command, cmd.args, cwd);
    await acp.start();
  }

  const stop = async () => {
    await client.bye();
    acp?.close();
    process.exit(0);
  };
  process.on("SIGINT", () => void stop());
  process.on("SIGTERM", () => void stop());

  for (;;) {
    const message = await client.wait();
    if (message.type === "bye") {
      console.log("host ended the session");
      break;
    }
    if (message.type !== "run") continue;
    const request = message.request as AgentRunRequest;
    const emit = (event: AgentRuntimeEvent) =>
      client.event(request.runId, event);
    try {
      if (runtime === "fake" || flag("fake")) {
        await runFake(request, emit);
      } else if (acp) {
        await acp.prompt(request, emit);
      } else {
        await emit({
          type: "error",
          text: "ACP runtime failed to start",
        });
      }
    } catch (error) {
      const text = error instanceof Error ? error.message : "guest run failed";
      await emit({ type: "error", text }).catch(() => undefined);
    }
  }

  await stop();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
