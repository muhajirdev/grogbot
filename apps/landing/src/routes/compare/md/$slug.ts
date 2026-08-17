import { createFileRoute } from "@tanstack/react-router";
import { comparisonMarkdown, getComparison } from "../../../data/comparisons";
import { corsHeaders } from "../../../lib/discovery";
import { landingOrigin } from "../../../lib/site";

export const Route = createFileRoute("/compare/md/$slug")({
  server: {
    handlers: {
      GET: ({ params }) => {
        const item = getComparison(params.slug);
        if (!item) {
          return new Response("Not found", {
            status: 404,
            headers: corsHeaders(),
          });
        }
        return new Response(comparisonMarkdown(item, landingOrigin()), {
          headers: {
            ...corsHeaders(),
            "content-type": "text/markdown; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
