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

export type Brow = { d: string; width: number };

export type MascotFace = {
  left: Eye;
  right: Eye;
  pupils: [Eye, Eye];
  sparks: [Eye, Eye];
  brows: [Brow, Brow];
  mouth: { d: string; width: number; fill: boolean };
  blush: [Eye, Eye];
  blushOpacity: number;
};

export type MascotColors = {
  mid: string;
  light: string;
  dark: string;
  eye: string;
  pupil: string;
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
    pupil: "#241510",
    mouth: "#241510",
    blush: mixHex(mid, "#ff8aa8", 0.42),
  };
}

export function mascotShine(): Eye {
  return { cx: 22, cy: 17, rx: 7.5, ry: 4.5 };
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

function sparksOn(pupils: [Eye, Eye]): [Eye, Eye] {
  return [
    {
      cx: pupils[0].cx - pupils[0].rx * 0.38,
      cy: pupils[0].cy - pupils[0].ry * 0.44,
      rx: 1.55,
      ry: 1.85,
    },
    {
      cx: pupils[1].cx - pupils[1].rx * 0.38,
      cy: pupils[1].cy - pupils[1].ry * 0.44,
      rx: 1.55,
      ry: 1.85,
    },
  ];
}

export function mascotFace(mood: MascotMood): MascotFace {
  const blush: [Eye, Eye] = [
    { cx: 30, cy: 63, rx: 7.2, ry: 3.8 },
    { cx: 70, cy: 63, rx: 7.2, ry: 3.8 },
  ];
  switch (mood) {
    case "thinking": {
      const pupils: [Eye, Eye] = [
        { cx: 38.2, cy: 40.4, rx: 3.4, ry: 5.2 },
        { cx: 67.4, cy: 39.6, rx: 3.4, ry: 5.4 },
      ];
      return {
        left: { cx: 36, cy: 44, rx: 7.4, ry: 12.6 },
        right: { cx: 65, cy: 43, rx: 7.4, ry: 12.8 },
        pupils,
        sparks: sparksOn(pupils),
        brows: [
          { d: "M27 31 Q35 29 43 32", width: 3.1 },
          { d: "M57 24 Q65 20 74 26", width: 3.2 },
        ],
        mouth: { d: "M47 67.5 a 3.6 3.1 0 1 1 0.08 0", width: 2.2, fill: true },
        blush,
        blushOpacity: 0.28,
      };
    }
    case "working": {
      const pupils: [Eye, Eye] = [
        { cx: 37, cy: 47.2, rx: 3.3, ry: 4.6 },
        { cx: 63, cy: 47.2, rx: 3.3, ry: 4.6 },
      ];
      return {
        left: { cx: 37, cy: 45, rx: 7, ry: 10.6 },
        right: { cx: 63, cy: 45, rx: 7, ry: 10.6 },
        pupils,
        sparks: sparksOn(pupils),
        brows: [
          { d: "M28 33 Q36 36 44 33", width: 3.3 },
          { d: "M56 33 Q64 36 72 33", width: 3.3 },
        ],
        mouth: { d: "M43 70 Q50 71 57 70", width: 4.4, fill: false },
        blush,
        blushOpacity: 0.3,
      };
    }
    case "happy": {
      const pupils: [Eye, Eye] = [
        { cx: 34, cy: 45.2, rx: 4.4, ry: 6.6 },
        { cx: 66, cy: 45.2, rx: 4.4, ry: 6.6 },
      ];
      return {
        left: { cx: 34, cy: 43, rx: 8.4, ry: 13.4 },
        right: { cx: 66, cy: 43, rx: 8.4, ry: 13.4 },
        pupils,
        sparks: sparksOn(pupils),
        brows: [
          { d: "M24 27 Q34 20 44 26", width: 3.3 },
          { d: "M56 26 Q66 20 76 27", width: 3.3 },
        ],
        mouth: {
          d: "M32 61 Q50 61 68 61 Q50 88 32 61 Z",
          width: 2.4,
          fill: true,
        },
        blush: [
          { cx: 26, cy: 61, rx: 9, ry: 5 },
          { cx: 74, cy: 61, rx: 9, ry: 5 },
        ],
        blushOpacity: 0.56,
      };
    }
    default: {
      const pupils: [Eye, Eye] = [
        { cx: 35, cy: 45.2, rx: 3.8, ry: 6 },
        { cx: 65, cy: 45.2, rx: 3.8, ry: 6 },
      ];
      return {
        left: { cx: 35, cy: 44, rx: 7.6, ry: 13 },
        right: { cx: 65, cy: 44, rx: 7.6, ry: 13 },
        pupils,
        sparks: sparksOn(pupils),
        brows: [
          { d: "M26 29 Q35 25 44 30", width: 3 },
          { d: "M56 30 Q65 25 74 29", width: 3 },
        ],
        mouth: { d: "M38 65 Q50 76 62 65", width: 5.2, fill: false },
        blush,
        blushOpacity: 0.36,
      };
    }
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

export function ellipseContains(outer: Eye, inner: Eye, pad = 0.35): boolean {
  return (
    inner.cx - inner.rx >= outer.cx - outer.rx + pad &&
    inner.cx + inner.rx <= outer.cx + outer.rx - pad &&
    inner.cy - inner.ry >= outer.cy - outer.ry + pad &&
    inner.cy + inner.ry <= outer.cy + outer.ry - pad
  );
}
