import type { ReactNode } from "react";

type IconProps = { className?: string };

function Svg(props: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={props.className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <title>Icon</title>
      {props.children}
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Svg className={props.className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </Svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Svg className={props.className}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function PlugIcon(props: IconProps) {
  return (
    <Svg className={props.className}>
      <path d="M9 7v4M15 7v4M8 11h8v3a4 4 0 0 1-8 0v-3Z" />
      <path d="M12 18v3" />
    </Svg>
  );
}

export function MicIcon(props: IconProps) {
  return (
    <Svg className={props.className}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v4" />
    </Svg>
  );
}

export function MonitorIcon(props: IconProps) {
  return (
    <Svg className={props.className}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </Svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Svg className={props.className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Svg className={props.className}>
      <path d="M15 6l-6 6 6 6" />
    </Svg>
  );
}

export function CollapseIcon(props: IconProps) {
  return (
    <Svg className={props.className}>
      <path d="M9 6l6 6-6 6M4 4v16" />
    </Svg>
  );
}

export function FilterIcon(props: IconProps) {
  return (
    <Svg className={props.className}>
      <path d="M4 6h16M7 12h10M10 18h4" />
    </Svg>
  );
}

export function GearIcon(props: IconProps) {
  return (
    <Svg className={props.className}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3.2v2.2M12 18.6V20.8M3.2 12h2.2M18.6 12h2.2M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6" />
    </Svg>
  );
}

export function DoubleChevronIcon(props: IconProps) {
  return (
    <Svg className={props.className}>
      <path d="M8 6l5 6-5 6M13 6l5 6-5 6" />
    </Svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg className={props.className}>
      <path d="M5 12l5 5L19 7" />
    </Svg>
  );
}
