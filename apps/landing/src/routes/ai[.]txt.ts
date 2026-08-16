import { createFileRoute } from "@tanstack/react-router";
import { discoveryResponse } from "../lib/discovery";

export const Route = createFileRoute("/ai.txt")({
  server: {
    handlers: {
      GET: ({ request }) => discoveryResponse("/ai.txt", request),
    },
  },
});
