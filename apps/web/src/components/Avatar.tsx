import type { AvatarShape } from "@grogbot/contracts";

export function AvatarMark(props: {
  name: string;
  color: string;
  shape: AvatarShape;
  large?: boolean;
}) {
  const letter = (props.name.trim()[0] ?? "?").toUpperCase();
  return (
    <span
      className={`avatar ${props.shape}${props.large ? " lg" : ""}`}
      style={{ background: props.color }}
      aria-hidden
    >
      {letter}
    </span>
  );
}
