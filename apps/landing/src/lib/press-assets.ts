import { mascotMarkElements, mascotMarkSvg } from "@grogbot/mascot";
import { PRESS_ASSETS } from "@grogbot/seo";

/** Bump when the mark geometry changes so browsers drop stale /press/*.svg. */
export const PRESS_ASSET_VERSION = "slit-2026-08-17";

const FONT =
  "'Source Sans 3', 'Segoe UI', system-ui, sans-serif";

function framedMark(bg: string, paintId: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img">
  <title>Grogbot</title>
  <rect width="128" height="128" rx="28" fill="${bg}" />
  <g transform="translate(14 14)">${mascotMarkElements({ paintId, name: "Grogbot" })}</g>
</svg>
`;
}

function lockup(theme: "dark" | "light"): string {
  const ink = theme === "dark" ? "#f4f4f4" : "#171614";
  const bg = theme === "dark" ? "#000000" : "#f4f4f4";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 128" role="img">
  <title>Grogbot</title>
  <rect width="460" height="128" rx="28" fill="${bg}" />
  <g transform="translate(22 22) scale(0.84)">${mascotMarkElements({ paintId: `lockup-${theme}`, name: "Grogbot" })}</g>
  <text x="128" y="78" fill="${ink}" font-size="42" font-weight="600" font-family="${FONT}">Grogbot</text>
</svg>
`;
}

const BODIES: Record<string, string> = {
  "grogbot-mark.svg": mascotMarkSvg({
    name: "Grogbot",
    paintId: "grogbot-mark",
  }),
  "grogbot-mark-dark.svg": framedMark("#000000", "grogbot-mark-dark"),
  "grogbot-mark-light.svg": framedMark("#f4f4f4", "grogbot-mark-light"),
  "grogbot-lockup-dark.svg": lockup("dark"),
  "grogbot-lockup-light.svg": lockup("light"),
};

export function pressAssetHref(file: string): string {
  return `/press/${file}?v=${PRESS_ASSET_VERSION}`;
}

export function lookupPressAsset(file: string):
  | {
      filename: string;
      contentType: string;
      body: string;
    }
  | undefined {
  const body = BODIES[file];
  if (!body) return undefined;
  return {
    filename: file,
    contentType: "image/svg+xml; charset=utf-8",
    body,
  };
}

export function pressAssetFiles(): string[] {
  return PRESS_ASSETS.map((asset) => asset.file);
}
