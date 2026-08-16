import { createFileRoute } from "@tanstack/react-router";
import { discoveryResponse } from "../lib/discovery";

export const Route = createFileRoute("/identity.json")({
  server: {
    handlers: {
      GET: ({ request }) => discoveryResponse("/identity.json", request),
    },
  },
});
