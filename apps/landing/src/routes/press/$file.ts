import { createFileRoute } from "@tanstack/react-router";
import { lookupPressAsset } from "../../lib/press-assets";

export const Route = createFileRoute("/press/$file")({
  server: {
    handlers: {
      GET: ({ params }) => {
        const asset = lookupPressAsset(params.file);
        if (!asset) {
          return new Response("Not found", { status: 404 });
        }
        return new Response(asset.body, {
          headers: {
            "content-type": asset.contentType,
            "cache-control": "public, max-age=3600, must-revalidate",
            "content-disposition": `inline; filename="${asset.filename}"`,
          },
        });
      },
    },
  },
});
