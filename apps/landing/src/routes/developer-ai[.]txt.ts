import { createFileRoute } from "@tanstack/react-router";
import { discoveryResponse } from "../lib/discovery";

export const Route = createFileRoute("/developer-ai.txt")({
  server: {
    handlers: {
      GET: ({ request }) => discoveryResponse("/developer-ai.txt", request),
    },
  },
});
