import {
  discoveryDocuments,
  discoveryLinkHeader,
  mcpGetResponse,
  mcpPostResponse,
  originsFromWeb,
} from "@groxbot/seo";
import type { Hono } from "hono";

function corsHeaders(): Record<string, string> {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, HEAD, POST, OPTIONS",
    "access-control-allow-headers":
      "content-type, mcp-protocol-version, accept",
  };
}

export function mountDiscovery(app: Hono, webOrigin: string): void {
  const origins = originsFromWeb(webOrigin);
  const link = discoveryLinkHeader(origins);

  app.use("*", async (c, next) => {
    await next();
    if (!c.res.headers.has("link")) c.header("Link", link);
  });

  const headers = (contentType: string) => ({
    ...corsHeaders(),
    "content-type": contentType,
    "cache-control": "public, max-age=3600",
  });

  for (const doc of discoveryDocuments(origins)) {
    app.get(doc.path, (c) => {
      if (doc.redirectTo) return c.redirect(doc.redirectTo, 301);
      return c.body(doc.body, 200, headers(doc.contentType));
    });
  }

  app.options("/mcp", (c) => c.body(null, 204, corsHeaders()));

  app.get("/mcp", (c) => {
    const doc = mcpGetResponse(c.req.header("accept"), origins);
    return c.body(doc.body, 200, headers(doc.contentType));
  });

  app.post("/mcp", async (c) => {
    let payload: unknown = {};
    try {
      payload = await c.req.json();
    } catch {
      payload = {};
    }
    const result = mcpPostResponse(payload, origins);
    return c.newResponse(result.body, result.status, {
      ...corsHeaders(),
      "content-type": result.contentType,
    });
  });
}
