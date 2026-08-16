import { createFileRoute } from "@tanstack/react-router";
import { discoveryResponse } from "../lib/discovery";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: ({ request }) => discoveryResponse("/robots.txt", request),
    },
  },
});
