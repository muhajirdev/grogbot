import type { IncomingMessage, ServerResponse } from "node:http";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import {
  discoveryDocuments,
  discoveryLinkHeader,
  mcpGetResponse,
  mcpPostResponse,
  originsFromWeb,
} from "../../packages/seo/src/index.ts";

const api = "http://127.0.0.1:3100";

function discoveryPlugin(webOrigin: string): Plugin {
  const origins = originsFromWeb(webOrigin);
  const docs = discoveryDocuments(origins);
  const byPath = new Map(docs.map((doc) => [doc.path, doc]));
  const link = discoveryLinkHeader(origins);

  function pathnameOf(url: string | undefined): string {
    const path = (url ?? "/").split("?")[0] ?? "/";
    if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
    return path;
  }

  function write(
    res: ServerResponse,
    status: number,
    headers: Record<string, string>,
    body: string,
  ): void {
    res.statusCode = status;
    for (const [key, value] of Object.entries(headers)) {
      res.setHeader(key, value);
    }
    res.end(body);
  }

  function middleware(
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ): void {
    const path = pathnameOf(req.url);
    const cors = {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, HEAD, POST, OPTIONS",
      "access-control-allow-headers":
        "content-type, mcp-protocol-version, accept",
      link,
    };

    if (path === "/mcp" && req.method === "OPTIONS") {
      write(res, 204, cors, "");
      return;
    }

    if (path === "/mcp" && req.method === "POST") {
      const chunks: Buffer[] = [];
      req.on("data", (chunk) => {
        chunks.push(chunk as Buffer);
      });
      req.on("end", () => {
        let payload: unknown = {};
        try {
          payload = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
        } catch {
          payload = {};
        }
        const result = mcpPostResponse(payload, origins);
        write(
          res,
          result.status,
          { ...cors, "content-type": result.contentType },
          result.body,
        );
      });
      return;
    }

    if (path === "/mcp" && (req.method === "GET" || req.method === "HEAD")) {
      const doc = mcpGetResponse(req.headers.accept, origins);
      write(
        res,
        200,
        {
          ...cors,
          "content-type": doc.contentType,
          "cache-control": "public, max-age=3600",
        },
        req.method === "HEAD" ? "" : doc.body,
      );
      return;
    }

    const doc = byPath.get(path);
    if (!doc || (req.method !== "GET" && req.method !== "HEAD")) {
      next();
      return;
    }
    if (doc.redirectTo) {
      write(res, 301, { ...cors, location: doc.redirectTo }, "");
      return;
    }
    write(
      res,
      200,
      {
        ...cors,
        "content-type": doc.contentType,
        "cache-control": "public, max-age=3600",
      },
      req.method === "HEAD" ? "" : doc.body,
    );
  }

  return {
    name: "grogbot-discovery",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
    generateBundle() {
      const paths = docs.map((doc) => doc.path);
      for (const doc of docs) {
        const prefix = `${doc.path}/`;
        if (paths.some((path) => path.startsWith(prefix))) continue;
        const source = doc.redirectTo
          ? (byPath.get(doc.redirectTo)?.body ?? doc.body)
          : doc.body;
        this.emitFile({ type: "asset", fileName: doc.path.slice(1), source });
      }
      this.emitFile({
        type: "asset",
        fileName: "mcp.html",
        source: mcpGetResponse("text/html", origins).body,
      });
      this.emitFile({
        type: "asset",
        fileName: "mcp",
        source: mcpGetResponse("text/html", origins).body,
      });
    },
  };
}

export default defineConfig(({ command }) => {
  const webOrigin =
    command === "build" ? "https://grogbot.com" : "http://127.0.0.1:5173";
  return {
    plugins: [
      discoveryPlugin(webOrigin),
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
        quoteStyle: "double",
      }),
      react(),
    ],
    server: {
      proxy: {
        "/api": api,
        "/health": api,
        "/rpc": {
          target: api,
          timeout: 0,
          proxyTimeout: 0,
          configure: (proxy) => {
            proxy.on("proxyRes", (proxyRes) => {
              const type = String(proxyRes.headers["content-type"] ?? "");
              if (
                type.includes("text/event-stream") ||
                type.includes("application/octet-stream")
              ) {
                proxyRes.headers["cache-control"] = "no-cache, no-transform";
                proxyRes.headers["x-accel-buffering"] = "no";
              }
            });
          },
        },
      },
    },
  };
});
