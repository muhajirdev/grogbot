import { createFileRoute } from "@tanstack/react-router";
import { discoveryResponse } from "../lib/discovery";

export const Route = createFileRoute("/mcp.json")({
  server: {
    handlers: {
      GET: ({ request }) => discoveryResponse("/mcp.json", request),
    },
  },
});
