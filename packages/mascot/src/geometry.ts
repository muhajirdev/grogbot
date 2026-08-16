export const MASCOT_SHAPES = [
  "circle",
  "squircle",
  "diamond",
  "triangle",
  "hex",
] as const;

export type MascotShape = (typeof MASCOT_SHAPES)[number];

export const MASCOT_MOODS = ["idle", "thinking", "working", "happy"] as const;

export type MascotMood = (typeof MASCOT_MOODS)[number];

export const FACE_BOX = 100;
export const BODY_POINTS = 24;
export const PACK_LENGTH = BODY_POINTS * 2 + 10;

export type Pt = { x: number; y: number };

export type Slit = {
  cx: number;
  cy: number;
  w: number;
  h: number;
  rot: number;
};

export type MascotAnchor = { x: number; y: number; scale: number };

export type MascotBody = { d: string };

export type MascotFace = { left: Slit; right: Slit };

export type Oval = { cx: number; cy: number; rx: number; ry: number };

export type MascotColors = {
  mid: string;
  light: string;
  dark: string;
  slit: string;
  blush: string;
};

const FALLBACK = "#e45c9a";
const CX = 50;
const CY = 51;
const TAU = Math.PI * 2;

export function normalizeHex(value: string): string {
  const raw = value.trim();
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(raw)) {
    const r = raw[1] ?? "0";
    const g = raw[2] ?? "0";
    const b = raw[3] ?? "0";
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return FALLBACK;
}

function channel(hex: string, index: number): number {
  return Number.parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16);
}

function toHex(value: number): string {
  return Math.round(Math.min(255, Math.max(0, value)))
    .toString(16)
    .padStart(2, "0");
}

export function mixHex(a: string, b: string, t: number): string {
  const from = normalizeHex(a);
  const to = normalizeHex(b);
  const k = Math.min(1, Math.max(0, t));
  const mix = (i: number) => channel(from, i) * (1 - k) + channel(to, i) * k;
  return `#${toHex(mix(0))}${toHex(mix(1))}${toHex(mix(2))}`;
}

function srgb(channelValue: number): number {
  const c = channelValue / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const mid = normalizeHex(hex);
  return (
    0.2126 * srgb(channel(mid, 0)) +
    0.7152 * srgb(channel(mid, 1)) +
    0.0722 * srgb(channel(mid, 2))
  );
}

function contrast(a: number, b: number): number {
  const light = Math.max(a, b) + 0.05;
  const dark = Math.min(a, b) + 0.05;
  return light / dark;
}

export function slitColor(hex: string): string {
  const lum = luminance(hex);
  const dark = luminance("#1a1412");
  const light = luminance("#f4f4f4");
  return contrast(lum, dark) >= contrast(lum, light)
    ? "#1a1412"
    : mixHex(hex, "#f4f4f4", 0.84);
}

export function mascotColors(hex: string): MascotColors {
  const mid = normalizeHex(hex);
  return {
    mid,
    light: mixHex(mid, "#fff6ea", 0.36),
    dark: mixHex(mid, "#1a120c", 0.24),
    slit: slitColor(mid),
    blush: mixHex(mid, "#ff8aa8", 0.48),
  };
}

export function mascotShine(): Oval {
  return { cx: 29, cy: 24, rx: 11.5, ry: 7.2 };
}

export function mascotBlush(slits: [Slit, Slit]): [Oval, Oval] {
  const [left, right] = slits;
  return [
    {
      cx: left.cx - 6.5,
      cy: left.cy + 13.5,
      rx: 8.4,
      ry: 4.6,
    },
    {
      cx: right.cx + 6.5,
      cy: right.cy + 13.5,
      rx: 8.4,
      ry: 4.6,
    },
  ];
}

export function mascotSpark(slit: Slit): Oval {
  return {
    cx: slit.cx - slit.w * 0.12,
    cy: slit.cy - slit.h * 0.28,
    rx: Math.max(0.9, slit.w * 0.22),
    ry: Math.max(1.1, slit.h * 0.14),
  };
}

export function mascotAnchor(shape: MascotShape): MascotAnchor {
  switch (shape) {
    case "circle":
      return { x: 50, y: 51, scale: 1 };
    case "squircle":
      return { x: 50, y: 51, scale: 0.96 };
    case "diamond":
      return { x: 50, y: 52, scale: 0.78 };
    case "triangle":
      return { x: 50, y: 60, scale: 0.74 };
    case "hex":
      return { x: 50, y: 51, scale: 0.9 };
  }
}

function param(index: number): number {
  return -Math.PI / 2 + (index / BODY_POINTS) * TAU;
}

function superellipse(t: number, a: number, b: number, n: number): Pt {
  const c = Math.cos(t);
  const s = Math.sin(t);
  const px = Math.abs(c) ** (2 / n);
  const py = Math.abs(s) ** (2 / n);
  return {
    x: CX + a * Math.sign(c) * px,
    y: CY + b * Math.sign(s) * py,
  };
}

function polygonRadius(
  theta: number,
  sides: number,
  rotation: number,
  vertexR: number,
  round: number,
): number {
  const step = TAU / sides;
  let ang = theta - rotation;
  ang = ((ang % step) + step) % step;
  const sharp = (vertexR * Math.cos(Math.PI / sides)) / Math.cos(ang - step / 2);
  const apothem = vertexR * Math.cos(Math.PI / sides);
  const over = Math.max(0, sharp - apothem);
  return apothem + over * (1 - round);
}

export function mascotBodyPoints(shape: MascotShape): Pt[] {
  const points: Pt[] = [];
  for (let i = 0; i < BODY_POINTS; i++) {
    const t = param(i);
    switch (shape) {
      case "circle":
        points.push({
          x: CX + 43 * Math.cos(t),
          y: CY + 43 * Math.sin(t),
        });
        break;
      case "squircle":
        points.push(superellipse(t, 41, 41, 6.2));
        break;
      case "diamond": {
        const r = polygonRadius(t, 4, -Math.PI / 2, 44, 0.48);
        points.push({ x: CX + r * Math.cos(t), y: CY + r * Math.sin(t) });
        break;
      }
      case "triangle": {
        const r = polygonRadius(t, 3, -Math.PI / 2, 48, 0.32);
        points.push({ x: CX + r * Math.cos(t), y: CY + r * Math.sin(t) });
        break;
      }
      case "hex": {
        const r = polygonRadius(t, 6, Math.PI / 6, 44, 0.22);
        points.push({ x: CX + r * Math.cos(t), y: CY + r * Math.sin(t) });
        break;
      }
    }
  }
  return points;
}

function fmt(value: number): string {
  return value.toFixed(2);
}

export function pointsToPath(points: readonly Pt[]): string {
  const n = points.length;
  if (n === 0) return "";
  const start = points[0];
  if (!start) return "";
  let d = `M${fmt(start.x)} ${fmt(start.y)}`;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    if (!p0 || !p1 || !p2 || !p3) continue;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += `C${fmt(c1x)} ${fmt(c1y)} ${fmt(c2x)} ${fmt(c2y)} ${fmt(p2.x)} ${fmt(p2.y)}`;
  }
  return `${d}Z`;
}

export function mascotBody(shape: MascotShape): MascotBody {
  return { d: pointsToPath(mascotBodyPoints(shape)) };
}

function moodSlits(mood: MascotMood): [Slit, Slit] {
  switch (mood) {
    case "thinking":
      return [
        { cx: 44.8, cy: 40.8, w: 4.8, h: 11.6, rot: -3 },
        { cx: 57.8, cy: 38.4, w: 4.8, h: 12.4, rot: -14 },
      ];
    case "working":
      return [
        { cx: 44, cy: 47.2, w: 4.6, h: 9.8, rot: -5 },
        { cx: 56, cy: 47.2, w: 4.6, h: 9.8, rot: -5 },
      ];
    case "happy":
      return [
        { cx: 43.2, cy: 44.2, w: 5.2, h: 9.4, rot: -20 },
        { cx: 56.8, cy: 44.2, w: 5.2, h: 9.4, rot: -20 },
      ];
    default:
      return [
        { cx: 43.6, cy: 42.4, w: 5, h: 12.4, rot: -9 },
        { cx: 56.4, cy: 42.4, w: 5, h: 12.4, rot: -9 },
      ];
  }
}

function mapSlit(slit: Slit, anchor: MascotAnchor): Slit {
  return {
    cx: anchor.x + (slit.cx - 50) * anchor.scale,
    cy: anchor.y + (slit.cy - 51) * anchor.scale,
    w: slit.w * anchor.scale,
    h: slit.h * anchor.scale,
    rot: slit.rot,
  };
}

export function mascotSlits(shape: MascotShape, mood: MascotMood): [Slit, Slit] {
  const anchor = mascotAnchor(shape);
  const [left, right] = moodSlits(mood);
  return [mapSlit(left, anchor), mapSlit(right, anchor)];
}

export function mascotFace(mood: MascotMood, shape: MascotShape = "circle"): MascotFace {
  const [left, right] = mascotSlits(shape, mood);
  return { left, right };
}

export function packMascot(shape: MascotShape, mood: MascotMood): number[] {
  const points = mascotBodyPoints(shape);
  const slits = mascotSlits(shape, mood);
  const out: number[] = [];
  for (const point of points) {
    out.push(point.x, point.y);
  }
  for (const slit of slits) {
    out.push(slit.cx, slit.cy, slit.w, slit.h, slit.rot);
  }
  return out;
}

export function unpackMascot(pack: number[]): { d: string; slits: [Slit, Slit] } {
  const points: Pt[] = [];
  for (let i = 0; i < BODY_POINTS; i++) {
    points.push({ x: pack[i * 2] ?? 0, y: pack[i * 2 + 1] ?? 0 });
  }
  const o = BODY_POINTS * 2;
  const slit = (offset: number): Slit => ({
    cx: pack[o + offset] ?? 0,
    cy: pack[o + offset + 1] ?? 0,
    w: pack[o + offset + 2] ?? 0,
    h: pack[o + offset + 3] ?? 0,
    rot: pack[o + offset + 4] ?? 0,
  });
  return { d: pointsToPath(points), slits: [slit(0), slit(5)] };
}

export function moodFromActivity(working: boolean): MascotMood {
  return working ? "working" : "idle";
}

export function seedFromName(name: string): number {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}
