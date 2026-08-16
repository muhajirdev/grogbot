import { createFileRoute } from "@tanstack/react-router";
import { discoveryResponse } from "../lib/discovery";

export const Route = createFileRoute("/llms-full.txt")({
  server: {
    handlers: {
      GET: ({ request }) => discoveryResponse("/llms-full.txt", request),
    },
  },
});
