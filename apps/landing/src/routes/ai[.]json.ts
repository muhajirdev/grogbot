import { createFileRoute } from "@tanstack/react-router";
import { discoveryResponse } from "../lib/discovery";

export const Route = createFileRoute("/ai.json")({
  server: {
    handlers: {
      GET: ({ request }) => discoveryResponse("/ai.json", request),
    },
  },
});
