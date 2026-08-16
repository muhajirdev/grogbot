import { createFileRoute } from "@tanstack/react-router";
import { discoveryResponse } from "../lib/discovery";

export const Route = createFileRoute("/faq-ai.txt")({
  server: {
    handlers: {
      GET: ({ request }) => discoveryResponse("/faq-ai.txt", request),
    },
  },
});
