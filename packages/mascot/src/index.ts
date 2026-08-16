export type {
  Brow,
  Eye,
  MascotAnchor,
  MascotBody,
  MascotColors,
  MascotFace,
  MascotMood,
  MascotShape,
} from "./geometry.js";
export {
  ellipseContains,
  eyeInsideCircle,
  FACE_BOX,
  MASCOT_MOODS,
  MASCOT_SHAPES,
  mascotAnchor,
  mascotBody,
  mascotColors,
  mascotFace,
  mascotShine,
  mixHex,
  moodFromActivity,
  normalizeHex,
  seedFromName,
} from "./geometry.js";
export { MascotMark } from "./MascotMark.js";
export {
  GROGBOT_MARK_COLOR,
  type MascotMarkSvgOptions,
  mascotMarkElements,
  mascotMarkSvg,
} from "./svg.js";
