import { createFileRoute } from "@tanstack/react-router";
import { discoveryResponse } from "../lib/discovery";

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: ({ request }) => discoveryResponse("/llms.txt", request),
    },
  },
});
