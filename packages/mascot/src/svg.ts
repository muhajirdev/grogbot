import {
  type MascotMood,
  type MascotShape,
  mascotBlush,
  mascotBody,
  mascotColors,
  mascotShine,
  mascotSlits,
  mascotSpark,
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

function oval(
  item: { cx: number; cy: number; rx: number; ry: number },
  extra: string,
): string {
  return `<ellipse cx="${item.cx.toFixed(2)}" cy="${item.cy.toFixed(2)}" rx="${item.rx.toFixed(2)}" ry="${item.ry.toFixed(2)}"${extra} />`;
}

function slitRect(
  slit: { cx: number; cy: number; w: number; h: number; rot: number },
  fill: string,
): string {
  const x = slit.cx - slit.w / 2;
  const y = slit.cy - slit.h / 2;
  const rx = Math.min(slit.w, slit.h) / 2;
  return `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${slit.w.toFixed(2)}" height="${slit.h.toFixed(2)}" rx="${rx.toFixed(2)}" fill="${fill}" transform="rotate(${slit.rot.toFixed(2)} ${slit.cx.toFixed(2)} ${slit.cy.toFixed(2)})" />`;
}

export function mascotMarkElements(options: MascotMarkSvgOptions = {}): string {
  const shape = options.shape ?? "circle";
  const mood = options.mood ?? "idle";
  const colors = mascotColors(options.color ?? GROGBOT_MARK_COLOR);
  const body = mascotBody(shape);
  const slits = mascotSlits(shape, mood);
  const [left, right] = slits;
  const blush = mascotBlush(slits);
  const shine = mascotShine();
  const paint = options.paintId ?? "grogbot-mark";
  const sheen = `${paint}-sheen`;
  const clip = `${paint}-clip`;
  const d = escapeXml(body.d);

  return `<defs>
  <linearGradient id="${escapeXml(paint)}" x1="28%" y1="8%" x2="78%" y2="96%">
    <stop offset="0%" stop-color="${colors.light}" />
    <stop offset="46%" stop-color="${colors.mid}" />
    <stop offset="100%" stop-color="${colors.dark}" />
  </linearGradient>
  <radialGradient id="${escapeXml(sheen)}" cx="34%" cy="30%" r="54%">
    <stop offset="0%" stop-color="#fff" stop-opacity="0.3" />
    <stop offset="62%" stop-color="#fff" stop-opacity="0" />
  </radialGradient>
  <clipPath id="${escapeXml(clip)}">
    <path d="${d}" />
  </clipPath>
</defs>
<g>
  <path d="${d}" fill="url(#${escapeXml(paint)})" />
  <path d="${d}" fill="url(#${escapeXml(sheen)})" />
  ${oval(shine, ` class="mascot-shine" fill="#fff" opacity="0.28" clip-path="url(#${escapeXml(clip)})"`)}
</g>
<g>
  ${oval(blush[0], ` class="mascot-blush" fill="${colors.blush}" opacity="0.34"`)}
  ${oval(blush[1], ` class="mascot-blush" fill="${colors.blush}" opacity="0.34"`)}
  ${slitRect(left, colors.slit)}
  ${slitRect(right, colors.slit)}
  ${oval(mascotSpark(left), ' class="mascot-spark" fill="#fff" opacity="0.55"')}
  ${oval(mascotSpark(right), ' class="mascot-spark" fill="#fff" opacity="0.55"')}
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
