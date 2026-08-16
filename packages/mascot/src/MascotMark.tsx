import { type CSSProperties, useId } from "react";
import {
  type MascotMood,
  type MascotShape,
  mascotAnchor,
  mascotBody,
  mascotColors,
  mascotFace,
  mascotShine,
  seedFromName,
} from "./geometry.js";
import "./mascot.css";

export function MascotMark(props: {
  name: string;
  color: string;
  shape?: MascotShape;
  mood?: MascotMood;
  size?: "xs" | "sm" | "md" | "lg";
}) {
  const shape = props.shape ?? "circle";
  const mood = props.mood ?? "idle";
  const size = props.size ?? "md";
  const colors = mascotColors(props.color);
  const body = mascotBody(shape);
  const face = mascotFace(mood);
  const shine = mascotShine();
  const anchor = mascotAnchor(shape);
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const paint = `mascot-${rawId}`;
  const delay = `${(seedFromName(props.name) % 2600) / 1000}s`;

  return (
    <span
      className={`mascot mascot-${size} mood-${mood}`}
      style={{ "--mascot-delay": delay } as CSSProperties}
      aria-hidden
    >
      <svg viewBox="0 0 100 100" focusable="false" aria-hidden>
        <title>{props.name}</title>
        <defs>
          <linearGradient id={paint} x1="28%" y1="6%" x2="78%" y2="96%">
            <stop offset="0%" stopColor={colors.light} />
            <stop offset="52%" stopColor={colors.mid} />
            <stop offset="100%" stopColor={colors.dark} />
          </linearGradient>
        </defs>
        <g className="mascot-body">
          {body.kind === "circle" ? (
            <circle
              cx={body.cx}
              cy={body.cy}
              r={body.r}
              fill={`url(#${paint})`}
            />
          ) : (
            <path d={body.d} fill={`url(#${paint})`} />
          )}
          <ellipse
            className="mascot-shine"
            cx={shine.cx}
            cy={shine.cy}
            rx={shine.rx}
            ry={shine.ry}
            fill="#fff"
          />
        </g>
        <g
          className="mascot-face"
          transform={`translate(${anchor.x} ${anchor.y}) scale(${anchor.scale}) translate(-50 -51)`}
        >
          <ellipse
            cx={face.blush[0].cx}
            cy={face.blush[0].cy}
            rx={face.blush[0].rx}
            ry={face.blush[0].ry}
            fill={colors.blush}
            opacity={face.blushOpacity}
          />
          <ellipse
            cx={face.blush[1].cx}
            cy={face.blush[1].cy}
            rx={face.blush[1].rx}
            ry={face.blush[1].ry}
            fill={colors.blush}
            opacity={face.blushOpacity}
          />
          <path
            d={face.brows[0].d}
            fill="none"
            stroke={colors.mouth}
            strokeWidth={face.brows[0].width}
            strokeLinecap="round"
          />
          <path
            d={face.brows[1].d}
            fill="none"
            stroke={colors.mouth}
            strokeWidth={face.brows[1].width}
            strokeLinecap="round"
          />
          <g className="mascot-eyes">
            <ellipse
              cx={face.left.cx}
              cy={face.left.cy}
              rx={face.left.rx}
              ry={face.left.ry}
              fill={colors.eye}
            />
            <ellipse
              cx={face.right.cx}
              cy={face.right.cy}
              rx={face.right.rx}
              ry={face.right.ry}
              fill={colors.eye}
            />
            <ellipse
              cx={face.pupils[0].cx}
              cy={face.pupils[0].cy}
              rx={face.pupils[0].rx}
              ry={face.pupils[0].ry}
              fill={colors.pupil}
            />
            <ellipse
              cx={face.pupils[1].cx}
              cy={face.pupils[1].cy}
              rx={face.pupils[1].rx}
              ry={face.pupils[1].ry}
              fill={colors.pupil}
            />
            <ellipse
              cx={face.sparks[0].cx}
              cy={face.sparks[0].cy}
              rx={face.sparks[0].rx}
              ry={face.sparks[0].ry}
              fill="#fff"
            />
            <ellipse
              cx={face.sparks[1].cx}
              cy={face.sparks[1].cy}
              rx={face.sparks[1].rx}
              ry={face.sparks[1].ry}
              fill="#fff"
            />
          </g>
          <path
            d={face.mouth.d}
            fill={face.mouth.fill ? colors.mouth : "none"}
            stroke={colors.mouth}
            strokeWidth={face.mouth.width}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </span>
  );
}
