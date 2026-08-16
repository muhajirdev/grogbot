import { createFileRoute } from "@tanstack/react-router";
import { discoveryResponse } from "../lib/discovery";

export const Route = createFileRoute("/index.md")({
  server: {
    handlers: {
      GET: ({ request }) => discoveryResponse("/index.md", request),
    },
  },
});
