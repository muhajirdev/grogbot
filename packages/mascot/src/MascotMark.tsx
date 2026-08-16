import { type CSSProperties, useId } from "react";
import {
  type MascotMood,
  type MascotShape,
  mascotBlush,
  mascotColors,
  mascotShine,
  mascotSpark,
  seedFromName,
} from "./geometry.js";
import { useMascotMorph } from "./spring.js";
import "./mascot.css";

function OvalMark(props: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  fill: string;
  opacity?: number;
  className?: string;
  clipPath?: string;
}) {
  return (
    <ellipse
      className={props.className}
      cx={props.cx}
      cy={props.cy}
      rx={props.rx}
      ry={props.ry}
      fill={props.fill}
      opacity={props.opacity}
      clipPath={props.clipPath}
    />
  );
}

function SlitMark(props: {
  cx: number;
  cy: number;
  w: number;
  h: number;
  rot: number;
  fill: string;
}) {
  const rx = Math.min(props.w, props.h) / 2;
  return (
    <rect
      x={props.cx - props.w / 2}
      y={props.cy - props.h / 2}
      width={props.w}
      height={props.h}
      rx={rx}
      fill={props.fill}
      transform={`rotate(${props.rot} ${props.cx} ${props.cy})`}
    />
  );
}

export function MascotMark(props: {
  name: string;
  color: string;
  shape?: MascotShape;
  mood?: MascotMood;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const shape = props.shape ?? "circle";
  const mood = props.mood ?? "idle";
  const size = props.size ?? "md";
  const colors = mascotColors(props.color);
  const { d, slits } = useMascotMorph(shape, mood);
  const blush = mascotBlush(slits);
  const shine = mascotShine();
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const paint = `mascot-${rawId}`;
  const sheen = `${paint}-sheen`;
  const clip = `${paint}-clip`;
  const delay = `${(seedFromName(props.name) % 2800) / 1000}s`;
  const className = ["mascot", `mascot-${size}`, `mood-${mood}`, props.className]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={className}
      style={{ "--mascot-delay": delay } as CSSProperties}
      aria-hidden
    >
      <svg viewBox="0 0 100 100" focusable="false" aria-hidden>
        <title>{props.name}</title>
        <defs>
          <linearGradient id={paint} x1="28%" y1="8%" x2="78%" y2="96%">
            <stop offset="0%" stopColor={colors.light} />
            <stop offset="46%" stopColor={colors.mid} />
            <stop offset="100%" stopColor={colors.dark} />
          </linearGradient>
          <radialGradient id={sheen} cx="34%" cy="30%" r="54%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.3" />
            <stop offset="62%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <clipPath id={clip}>
            <path d={d} />
          </clipPath>
        </defs>
        <g className="mascot-body">
          <path d={d} fill={`url(#${paint})`} />
          <path d={d} fill={`url(#${sheen})`} />
          <OvalMark
            className="mascot-shine"
            {...shine}
            fill="#fff"
            clipPath={`url(#${clip})`}
          />
        </g>
        <g className="mascot-face">
          <OvalMark
            className="mascot-blush"
            {...blush[0]}
            fill={colors.blush}
            opacity={0.34}
          />
          <OvalMark
            className="mascot-blush"
            {...blush[1]}
            fill={colors.blush}
            opacity={0.34}
          />
          <g className="mascot-slits">
            <SlitMark {...slits[0]} fill={colors.slit} />
            <SlitMark {...slits[1]} fill={colors.slit} />
            <OvalMark
              className="mascot-spark"
              {...mascotSpark(slits[0])}
              fill="#fff"
              opacity={0.55}
            />
            <OvalMark
              className="mascot-spark"
              {...mascotSpark(slits[1])}
              fill="#fff"
              opacity={0.55}
            />
          </g>
        </g>
      </svg>
    </span>
  );
}
