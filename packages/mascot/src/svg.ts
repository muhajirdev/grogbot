import {
  type MascotMood,
  type MascotShape,
  mascotAnchor,
  mascotBody,
  mascotColors,
  mascotFace,
  mascotShine,
} from "./geometry.js";

export const GROGBOT_MARK_COLOR = "#e45c9a";

export type MascotMarkSvgOptions = {
  name?: string;
  color?: string;
  shape?: MascotShape;
  mood?: MascotMood;
  paintId?: string;
};

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function ellipse(
  eye: { cx: number; cy: number; rx: number; ry: number },
  extra: string,
): string {
  return `<ellipse cx="${eye.cx}" cy="${eye.cy}" rx="${eye.rx}" ry="${eye.ry}"${extra} />`;
}

export function mascotMarkElements(options: MascotMarkSvgOptions = {}): string {
  const shape = options.shape ?? "circle";
  const mood = options.mood ?? "idle";
  const colors = mascotColors(options.color ?? GROGBOT_MARK_COLOR);
  const body = mascotBody(shape);
  const face = mascotFace(mood);
  const shine = mascotShine();
  const anchor = mascotAnchor(shape);
  const paint = options.paintId ?? "grogbot-mark";
  const bodyEl =
    body.kind === "circle"
      ? `<circle cx="${body.cx}" cy="${body.cy}" r="${body.r}" fill="url(#${paint})" />`
      : `<path d="${escapeXml(body.d)}" fill="url(#${paint})" />`;

  return `<defs>
  <linearGradient id="${escapeXml(paint)}" x1="28%" y1="6%" x2="78%" y2="96%">
    <stop offset="0%" stop-color="${colors.light}" />
    <stop offset="52%" stop-color="${colors.mid}" />
    <stop offset="100%" stop-color="${colors.dark}" />
  </linearGradient>
</defs>
<g>
  ${bodyEl}
  ${ellipse(shine, ' class="mascot-shine" fill="#fff" opacity="0.22"')}
</g>
<g transform="translate(${anchor.x} ${anchor.y}) scale(${anchor.scale}) translate(-50 -51)">
  ${ellipse(face.blush[0], ` fill="${colors.blush}" opacity="${face.blushOpacity}"`)}
  ${ellipse(face.blush[1], ` fill="${colors.blush}" opacity="${face.blushOpacity}"`)}
  <path d="${escapeXml(face.brows[0].d)}" fill="none" stroke="${colors.mouth}" stroke-width="${face.brows[0].width}" stroke-linecap="round" />
  <path d="${escapeXml(face.brows[1].d)}" fill="none" stroke="${colors.mouth}" stroke-width="${face.brows[1].width}" stroke-linecap="round" />
  ${ellipse(face.left, ` fill="${colors.eye}"`)}
  ${ellipse(face.right, ` fill="${colors.eye}"`)}
  ${ellipse(face.pupils[0], ` fill="${colors.pupil}"`)}
  ${ellipse(face.pupils[1], ` fill="${colors.pupil}"`)}
  ${ellipse(face.sparks[0], ' fill="#fff"')}
  ${ellipse(face.sparks[1], ' fill="#fff"')}
  <path d="${escapeXml(face.mouth.d)}" fill="${face.mouth.fill ? colors.mouth : "none"}" stroke="${colors.mouth}" stroke-width="${face.mouth.width}" stroke-linecap="round" stroke-linejoin="round" />
</g>`;
}

export function mascotMarkSvg(options: MascotMarkSvgOptions = {}): string {
  const name = options.name ?? "Grogbot";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img">
  <title>${escapeXml(name)}</title>
  ${mascotMarkElements(options)}
</svg>
`;
}
