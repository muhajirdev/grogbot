import { createFileRoute } from "@tanstack/react-router";
import { corsHeaders, discoveryResponse, mcpPost } from "../lib/discovery";

export const Route = createFileRoute("/mcp")({
  server: {
    handlers: {
      OPTIONS: () =>
        new Response(null, { status: 204, headers: corsHeaders() }),
      GET: ({ request }) => discoveryResponse("/mcp", request),
      POST: ({ request }) => mcpPost(request),
    },
  },
});
