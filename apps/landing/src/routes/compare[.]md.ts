import { createFileRoute } from "@tanstack/react-router";
import { compareIndexMarkdown } from "../data/comparisons";
import { corsHeaders } from "../lib/discovery";
import { landingOrigin } from "../lib/site";

export const Route = createFileRoute("/compare.md")({
  server: {
    handlers: {
      GET: () =>
        new Response(compareIndexMarkdown(landingOrigin()), {
          headers: {
            ...corsHeaders(),
            "content-type": "text/markdown; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        }),
    },
  },
});
