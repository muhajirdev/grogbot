import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/press-kit")({
  server: {
    handlers: {
      GET: () =>
        new Response(null, {
          status: 301,
          headers: { location: "/press" },
        }),
    },
  },
});
