import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { mountDiscovery } from "./discovery.js";

describe("discovery HTTP", () => {
  const app = new Hono();
  mountDiscovery(app, "https://groxbot.com");

  it("serves llms.txt and redirects llm.txt", async () => {
    const llms = await app.request("https://groxbot.com/llms.txt");
    expect(llms.status).toBe(200);
    expect(llms.headers.get("content-type")).toContain("text/plain");
    expect(await llms.text()).toContain("# Groxbot");

    const llm = await app.request("https://groxbot.com/llm.txt");
    expect(llm.status).toBe(301);
    expect(llm.headers.get("location")).toBe("/llms.txt");
  });

  it("serves MCP card and initialize", async () => {
    const card = await app.request("https://groxbot.com/.well-known/mcp.json");
    expect(card.status).toBe(200);
    expect(await card.text()).toContain("streamable-http");

    const html = await app.request("https://groxbot.com/mcp");
    expect(html.status).toBe(200);
    expect(html.headers.get("content-type")).toContain("text/html");

    const init = await app.request("https://groxbot.com/mcp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize" }),
    });
    expect(init.status).toBe(200);
    expect(await init.text()).toContain("io.groxbot/docs");
  });
});
