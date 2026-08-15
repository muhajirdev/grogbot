import { appContract } from "@grogbot/contracts";
import { implement, ORPCError } from "@orpc/server";
import type { RpcContext } from "./context.js";
import { healthPayload } from "./health.js";

const os = implement(appContract).$context<RpcContext>();

function notImplemented(name: string): never {
  throw new ORPCError("NOT_IMPLEMENTED", {
    message: `${name} is not implemented yet`,
  });
}

export const appRouter = os.router({
  health: os.health.handler(async ({ context }) => healthPayload(context.env)),
  me: os.me.handler(async () => {
    throw new ORPCError("UNAUTHORIZED", { message: "Sign in" });
  }),
  bots: {
    list: os.bots.list.handler(async () => []),
    get: os.bots.get.handler(async () => {
      throw new ORPCError("NOT_FOUND", { message: "Bot not found" });
    }),
    create: os.bots.create.handler(async () => notImplemented("bots.create")),
  },
  threads: {
    subscribe: os.threads.subscribe.handler(
      // biome-ignore lint/correctness/useYield: stub ends the stream immediately
      async function* () {
        notImplemented("threads.subscribe");
      },
    ),
    send: os.threads.send.handler(async () => notImplemented("threads.send")),
  },
  computer: {
    status: os.computer.status.handler(async () => {
      throw new ORPCError("NOT_FOUND", { message: "Computer not found" });
    }),
  },
  memory: {
    list: os.memory.list.handler(async () => []),
  },
  routines: {
    list: os.routines.list.handler(async () => []),
  },
});

export type AppRouter = typeof appRouter;
