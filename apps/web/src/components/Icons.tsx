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

export function ChevronDownIcon(props: IconProps) {
  return (
    <Svg className={props.className}>
      <path d="M6 9l6 6 6-6" />
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

function BrandSvg(props: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={props.className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <title>Icon</title>
      {props.children}
    </svg>
  );
}

export function GmailIcon(props: IconProps) {
  return (
    <BrandSvg className={props.className}>
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2Zm0 4.2-8 5-8-5V6l8 5 8-5v2.2Z" />
    </BrandSvg>
  );
}

export function SlackIcon(props: IconProps) {
  return (
    <BrandSvg className={props.className}>
      <path d="M5.04 15.16a2.04 2.04 0 1 1-2.04-2.04h2.04v2.04Zm1.02 0a2.04 2.04 0 1 1 4.08 0v5.12a2.04 2.04 0 1 1-4.08 0v-5.12ZM8.96 5.04a2.04 2.04 0 1 1 2.04-2.04v2.04H8.96Zm0 1.02a2.04 2.04 0 1 1 0 4.08H3.84a2.04 2.04 0 1 1 0-4.08h5.12ZM18.96 8.96a2.04 2.04 0 1 1 2.04 2.04h-2.04V8.96Zm-1.02 0a2.04 2.04 0 1 1-4.08 0V3.84a2.04 2.04 0 1 1 4.08 0v5.12ZM15.04 18.96a2.04 2.04 0 1 1-2.04 2.04v-2.04h2.04Zm0-1.02a2.04 2.04 0 1 1 0-4.08h5.12a2.04 2.04 0 1 1 0 4.08h-5.12Z" />
    </BrandSvg>
  );
}

export function GitHubIcon(props: IconProps) {
  return (
    <BrandSvg className={props.className}>
      <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.55-1.14-4.55-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05A9.3 9.3 0 0 1 12 6.8c.85 0 1.7.12 2.5.34 1.9-1.32 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .26.18.58.69.48A10.03 10.03 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" />
    </BrandSvg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <BrandSvg className={props.className}>
      <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2Zm0 16H5V10h14v10Zm0-12H5V6h14v2Z" />
    </BrandSvg>
  );
}

export function DriveIcon(props: IconProps) {
  return (
    <BrandSvg className={props.className}>
      <path d="M7.71 3.5 1.5 14.25h4.24L11.95 3.5H7.71Zm8.58 0-3.18 5.5 6.36 11 3.18-5.5-6.36-11Zm-3.54 6.5L7.71 20.5h12.72l5.04-10.5H12.75Z" />
    </BrandSvg>
  );
}

export function LinearIcon(props: IconProps) {
  return (
    <BrandSvg className={props.className}>
      <path d="M2.86 16.51A10 10 0 0 1 16.51 2.86L2.86 16.51ZM4.5 19.14A10 10 0 0 0 19.14 4.5L4.5 19.14ZM6.86 20.8A10 10 0 0 0 20.8 6.86L6.86 20.8ZM22 12A10 10 0 0 1 12 22L22 12Z" />
    </BrandSvg>
  );
}
