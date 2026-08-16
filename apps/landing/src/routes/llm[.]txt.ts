import { createFileRoute } from "@tanstack/react-router";
import { discoveryResponse } from "../lib/discovery";

export const Route = createFileRoute("/llm.txt")({
  server: {
    handlers: {
      GET: ({ request }) => discoveryResponse("/llm.txt", request),
    },
  },
});
