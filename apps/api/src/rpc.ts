import { ORPCError, onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import type { Hono } from "hono";
import type { RpcContext } from "./context.js";
import { appRouter } from "./router.js";

const handler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      if (error instanceof ORPCError && error.status < 500) return;
      console.error(error);
    }),
  ],
});

export function mountRpc(app: Hono, base: Omit<RpcContext, "headers">): void {
  app.use("/rpc/*", async (c, next) => {
    const { matched, response } = await handler.handle(c.req.raw, {
      prefix: "/rpc",
      context: { ...base, headers: c.req.raw.headers },
    });
    if (matched) {
      return c.newResponse(response.body, response);
    }
    await next();
  });
}
