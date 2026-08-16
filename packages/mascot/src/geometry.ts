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

export type MascotAnchor = { x: number; y: number; scale: number };

export type MascotBody =
  | { kind: "circle"; cx: number; cy: number; r: number }
  | { kind: "path"; d: string };

export type Eye = { cx: number; cy: number; rx: number; ry: number };

export type MascotFace = {
  left: Eye;
  right: Eye;
  mouth: { d: string; width: number };
  blush: [Eye, Eye];
};

export type MascotColors = {
  mid: string;
  light: string;
  dark: string;
  eye: string;
  mouth: string;
  blush: string;
};

const FALLBACK = "#e45c9a";

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

export function mascotColors(hex: string): MascotColors {
  const mid = normalizeHex(hex);
  return {
    mid,
    light: mixHex(mid, "#fff6ea", 0.32),
    dark: mixHex(mid, "#1a120c", 0.26),
    eye: "#fffaf3",
    mouth: "#fffaf3",
    blush: mixHex(mid, "#ff8aa8", 0.42),
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

export function mascotBody(shape: MascotShape): MascotBody {
  switch (shape) {
    case "circle":
      return { kind: "circle", cx: 50, cy: 51, r: 43 };
    case "squircle":
      return {
        kind: "path",
        d: "M28 9 H72 Q91 9 91 28 V72 Q91 91 72 91 H28 Q9 91 9 72 V28 Q9 9 28 9 Z",
      };
    case "diamond":
      return {
        kind: "path",
        d: "M50 10 C56 10 88 44 88 51 C88 58 56 90 50 90 C44 90 12 58 12 51 C12 44 44 10 50 10 Z",
      };
    case "triangle":
      return {
        kind: "path",
        d: "M50 12 C58 12 86 74 82 84 C78 92 22 92 18 84 C14 74 42 12 50 12 Z",
      };
    case "hex":
      return {
        kind: "path",
        d: "M32 16 H68 Q74 16 77 21 L90 44 Q93 50 90 56 L77 79 Q74 84 68 84 H32 Q26 84 23 79 L10 56 Q7 50 10 44 L23 21 Q26 16 32 16 Z",
      };
  }
}

export function mascotFace(mood: MascotMood): MascotFace {
  const blush: [Eye, Eye] = [
    { cx: 32, cy: 62, rx: 6.4, ry: 3.4 },
    { cx: 68, cy: 62, rx: 6.4, ry: 3.4 },
  ];
  switch (mood) {
    case "thinking":
      return {
        left: { cx: 37, cy: 40, rx: 6.6, ry: 12.2 },
        right: { cx: 63, cy: 38, rx: 6.6, ry: 12.6 },
        mouth: { d: "M44 68 Q50 70 56 67", width: 4.8 },
        blush,
      };
    case "working":
      return {
        left: { cx: 39, cy: 46, rx: 6.2, ry: 11.2 },
        right: { cx: 61, cy: 46, rx: 6.2, ry: 11.2 },
        mouth: { d: "M43 68 Q50 69 57 68", width: 4.6 },
        blush,
      };
    case "happy":
      return {
        left: { cx: 35, cy: 44, rx: 7.4, ry: 13.2 },
        right: { cx: 65, cy: 44, rx: 7.4, ry: 13.2 },
        mouth: { d: "M38 64 Q50 76 62 64", width: 5.6 },
        blush,
      };
    default:
      return {
        left: { cx: 36, cy: 44, rx: 7.2, ry: 12.8 },
        right: { cx: 64, cy: 44, rx: 7.2, ry: 12.8 },
        mouth: { d: "M40 66 Q50 73 60 66", width: 5.2 },
        blush,
      };
  }
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

export function eyeInsideCircle(
  eye: Eye,
  body: Extract<MascotBody, { kind: "circle" }>,
  pad = 2,
): boolean {
  const limit = body.r - pad;
  const points: Array<[number, number]> = [
    [eye.cx - eye.rx, eye.cy],
    [eye.cx + eye.rx, eye.cy],
    [eye.cx, eye.cy - eye.ry],
    [eye.cx, eye.cy + eye.ry],
  ];
  return points.every(
    ([x, y]) => (x - body.cx) ** 2 + (y - body.cy) ** 2 <= limit * limit,
  );
}
