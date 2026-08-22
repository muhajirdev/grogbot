import type { AvatarShape } from "@groxbot/contracts";
import { MascotMark, type MascotMood } from "@groxbot/mascot";

export function AvatarMark(props: {
  name: string;
  color: string;
  shape: AvatarShape;
  large?: boolean;
  mood?: MascotMood;
  size?: "xs" | "sm" | "md" | "lg";
  hero?: boolean;
}) {
  return (
    <MascotMark
      name={props.name}
      color={props.color}
      shape={props.shape}
      mood={props.mood}
      size={props.size ?? (props.large ? "lg" : "md")}
      className={props.hero ? "mascot-hero" : undefined}
    />
  );
}

export function ShapePicks(props: {
  color: string;
  value: AvatarShape;
  shapes: AvatarShape[];
  onChange: (shape: AvatarShape) => void;
}) {
  return (
    <div className="shape-picks">
      {props.shapes.map((shape) => (
        <button
          key={shape}
          type="button"
          className={`shape-pick${props.value === shape ? " on" : ""}`}
          aria-label={shape}
          aria-pressed={props.value === shape}
          onClick={() => props.onChange(shape)}
        >
          <AvatarMark
            name={shape}
            color={props.color}
            shape={shape}
            size="sm"
          />
        </button>
      ))}
    </div>
  );
}
