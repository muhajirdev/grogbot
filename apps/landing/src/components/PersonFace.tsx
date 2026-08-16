export function PersonFace(props: {
  src: string;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const size = props.size ?? "sm";
  const px = size === "lg" ? 44 : size === "md" ? 36 : 28;
  return (
    <img
      className={`avatar ${size} circle photo`}
      src={props.src}
      alt=""
      width={px}
      height={px}
    />
  );
}
