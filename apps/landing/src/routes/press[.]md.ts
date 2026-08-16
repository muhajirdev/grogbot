import { createFileRoute } from "@tanstack/react-router";
import { discoveryResponse } from "../lib/discovery";

export const Route = createFileRoute("/press.md")({
  server: {
    handlers: {
      GET: ({ request }) => discoveryResponse("/press.md", request),
    },
  },
});
