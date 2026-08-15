import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import type { Hono } from "hono";
import type { RpcContext } from "./context.js";
import { appRouter } from "./router.js";

const handler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

export function mountRpc(app: Hono, context: RpcContext): void {
  app.use("/rpc/*", async (c, next) => {
    const { matched, response } = await handler.handle(c.req.raw, {
      prefix: "/rpc",
      context,
    });
    if (matched) {
      return c.newResponse(response.body, response);
    }
    await next();
  });
}
